import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { fork, ChildProcess } from 'child_process';
import { resolve as resolvePath } from 'path';
import { ConfigService } from '@nestjs/config';

// Tipos de mensagens IPC
type SidecarRequest =
    | { type: 'query'; sql: string; params?: any[] }
    | { type: 'attach_postgres'; connectionString: string; alias?: string }
    | { type: 'install_extension'; name: string }
    | { type: 'ping' };

type SidecarResponse =
    | { event: 'query_result'; data: any[] }
    | { event: 'query_error'; error: string }
    | { event: 'attached'; alias: string; error?: string }
    | { event: 'extension_installed'; name: string; error?: string }
    | { event: 'pong' }
    | { event: 'ready' }
    | { event: 'error'; error: string };

type QueryResult = { success: true; data: any[] } | { success: false; error: string };

/**
 * Serviço que gerencia o processo sidecar do DuckDB.
 * - Mantém um processo filho rodando DuckDB
 * - Monitora saúde do processo via ping/pong
 * - Reinicia o processo se necessário (máx 1 vez por minuto)
 * - Provê interface simples para executar queries
 */
@Injectable()
export class DuckDBSidecarService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DuckDBSidecarService.name);
    private childProcess: ChildProcess | null = null;
    private isShuttingDown = false;
    private isReady = false;

    // Controle de reinício
    private lastRestartTime: Date | null = null;
    private restartCount = 0;
    private readonly MAX_RESTARTS_PER_MINUTE = 1;
    private readonly RESTART_WINDOW_MS = 60 * 1000; // 1 minuto

    // Health check
    private lastPongTime: Date | null = null;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private readonly HEALTH_CHECK_INTERVAL_MS = 30000; // 30 segundos
    private readonly PONG_TIMEOUT_MS = 10000; // 10 segundos

    // Queries pendentes (para correlação request/response)
    private pendingQueries = new Map<
        string,
        { resolve: (value: QueryResult) => void; reject: (reason: Error) => void; timer: NodeJS.Timeout }
    >();
    private queryIdCounter = 0;
    private readonly QUERY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        this.logger.log('Inicializando DuckDB Sidecar Service...');
        await this.startSidecar();
        this.startHealthCheck();
    }

    async onModuleDestroy() {
        this.logger.log('Destruindo DuckDB Sidecar Service...');
        this.isShuttingDown = true;
        this.stopHealthCheck();
        await this.stopSidecar();
    }

    /**
     * Verifica se o sidecar está pronto para receber queries
     */
    isSidecarReady(): boolean {
        return this.isReady && this.childProcess !== null && this.childProcess.connected;
    }

    /**
     * Executa uma query SQL no DuckDB sidecar
     * @param sql - Query SQL a ser executada
     * @param params - Parâmetros da query (opcional)
     * @returns Resultado da query ou erro
     */
    async query(sql: string, params?: any[]): Promise<QueryResult> {
        if (!this.isSidecarReady()) {
            return { success: false, error: 'DuckDB sidecar não está pronto' };
        }

        const queryId = `query_${++this.queryIdCounter}_${Date.now()}`;

        return new Promise((resolve, reject) => {
            // Timeout para a query
            const timer = setTimeout(() => {
                this.pendingQueries.delete(queryId);
                resolve({ success: false, error: 'Query timeout' });
            }, this.QUERY_TIMEOUT_MS);

            this.pendingQueries.set(queryId, { resolve, reject, timer });

            // Envia a query para o processo filho
            const request: SidecarRequest = { type: 'query', sql, params };
            this.childProcess!.send(request, (err) => {
                if (err) {
                    clearTimeout(timer);
                    this.pendingQueries.delete(queryId);
                    resolve({ success: false, error: `Falha ao enviar query: ${err.message}` });
                }
            });
        });
    }

    /**
     * Anexa um banco PostgreSQL ao DuckDB
     * @param connectionString - Connection string do PostgreSQL
     * @param alias - Alias para o banco (padrão: 'postgres')
     */
    async attachPostgres(connectionString?: string, alias = 'postgres'): Promise<boolean> {
        if (!this.isSidecarReady()) {
            this.logger.error('DuckDB sidecar não está pronto');
            return false;
        }

        const pgConn =
            connectionString || this.configService.get<string>('DATABASE_URL') || this.buildConnectionStringFromEnv();

        if (!pgConn) {
            this.logger.error('Connection string do PostgreSQL não encontrada');
            return false;
        }

        return new Promise((resolve) => {
            const request: SidecarRequest = { type: 'attach_postgres', connectionString: pgConn, alias };

            const timer = setTimeout(() => {
                resolve(false);
            }, 30000);

            const handler = (msg: SidecarResponse) => {
                if (msg.event === 'attached' && msg.alias === alias) {
                    clearTimeout(timer);
                    this.childProcess!.off('message', handler);
                    resolve(!msg.error);
                }
            };

            this.childProcess!.on('message', handler);
            this.childProcess!.send(request);
        });
    }

    /**
     * Instala e carrega uma extensão do DuckDB
     * @param name - Nome da extensão
     */
    async installExtension(name: string): Promise<boolean> {
        if (!this.isSidecarReady()) {
            this.logger.error('DuckDB sidecar não está pronto');
            return false;
        }

        return new Promise((resolve) => {
            const request: SidecarRequest = { type: 'install_extension', name };

            const timer = setTimeout(() => {
                resolve(false);
            }, 60000);

            const handler = (msg: SidecarResponse) => {
                if (msg.event === 'extension_installed' && msg.name === name) {
                    clearTimeout(timer);
                    this.childProcess!.off('message', handler);
                    resolve(!msg.error);
                }
            };

            this.childProcess!.on('message', handler);
            this.childProcess!.send(request);
        });
    }

    /**
     * Sincroniza dados do PostgreSQL para o DuckDB (in-memory)
     * Útil para carregar embeddings e dados para BM25 search
     */
    async syncFromPostgres(
        tableName: string,
        options?: {
            columns?: string[];
            where?: string;
            limit?: number;
            duckdbTableName?: string;
        }
    ): Promise<QueryResult> {
        const duckdbTable = options?.duckdbTableName || tableName;
        const columns = options?.columns?.join(', ') || '*';
        const whereClause = options?.where ? `WHERE ${options.where}` : '';
        const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';

        // Cria tabela no DuckDB a partir do PostgreSQL
        const sql = `
            CREATE OR REPLACE TABLE ${duckdbTable} AS 
            SELECT ${columns} 
            FROM postgres.${tableName} 
            ${whereClause}
            ${limitClause}
        `;

        return this.query(sql);
    }

    /**
     * Inicia o processo sidecar
     */
    private async startSidecar(): Promise<void> {
        if (this.childProcess) {
            this.logger.warn('Sidecar já está rodando');
            return;
        }

        // Verifica rate limit de reinício
        if (this.lastRestartTime) {
            const timeSinceLastRestart = Date.now() - this.lastRestartTime.getTime();
            if (timeSinceLastRestart < this.RESTART_WINDOW_MS) {
                this.restartCount++;
                if (this.restartCount > this.MAX_RESTARTS_PER_MINUTE) {
                    this.logger.error(
                        `Limite de reinícios por minuto excedido (${this.MAX_RESTARTS_PER_MINUTE}). Aguardando...`
                    );
                    // Aguarda até poder reiniciar
                    await new Promise((resolve) =>
                        setTimeout(resolve, this.RESTART_WINDOW_MS - timeSinceLastRestart)
                    );
                }
            } else {
                // Janela passou, reseta contador
                this.restartCount = 0;
            }
        }

        this.lastRestartTime = new Date();
        this.logger.log('Iniciando DuckDB sidecar process...');

        return new Promise((resolve, reject) => {
            const sidecarPath = resolvePath(__dirname, './../../bin/') + '/run-duckdb-sidecar.js';
            this.childProcess = fork(sidecarPath, [], {
                silent: false, // Herda stdio do processo pai para logs
                env: { ...process.env, NODE_ENV: process.env.NODE_ENV },
            });

            // Handler de mensagens
            this.childProcess.on('message', (msg: SidecarResponse) => {
                this.handleMessage(msg);

                if (msg.event === 'ready') {
                    this.isReady = true;
                    this.logger.log('DuckDB sidecar está pronto');
                    resolve();
                }
            });

            // Handler de erro
            this.childProcess.on('error', (err) => {
                this.logger.error(`Erro no processo sidecar: ${err.message}`);
                if (!this.isReady) {
                    reject(err);
                }
            });

            // Handler de exit
            this.childProcess.on('exit', (code, signal) => {
                this.logger.warn(`Sidecar encerrado (code: ${code}, signal: ${signal})`);
                this.isReady = false;
                this.childProcess = null;

                if (!this.isShuttingDown) {
                    this.scheduleRestart();
                }
            });

            // Timeout de inicialização
            setTimeout(() => {
                if (!this.isReady) {
                    reject(new Error('Timeout ao iniciar sidecar'));
                }
            }, 60000);
        });
    }

    /**
     * Para o processo sidecar
     */
    private async stopSidecar(): Promise<void> {
        if (!this.childProcess) return;

        this.logger.log('Parando DuckDB sidecar...');

        // Rejeita todas as queries pendentes
        for (const [id, pending] of this.pendingQueries.entries()) {
            clearTimeout(pending.timer);
            pending.resolve({ success: false, error: 'Sidecar sendo desligado' });
            this.pendingQueries.delete(id);
        }

        // Tenta graceful shutdown
        this.childProcess.kill('SIGTERM');

        // Aguarda até 5 segundos para encerrar
        await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                if (this.childProcess && !this.childProcess.killed) {
                    this.logger.warn('Forçando kill do sidecar');
                    this.childProcess.kill('SIGKILL');
                }
                resolve();
            }, 5000);

            this.childProcess!.on('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
        });

        this.childProcess = null;
        this.isReady = false;
        this.logger.log('DuckDB sidecar parado');
    }

    /**
     * Agenda reinício do sidecar
     */
    private scheduleRestart() {
        if (this.isShuttingDown) return;

        this.logger.log('Agendando reinício do sidecar...');
        setTimeout(async () => {
            if (!this.isShuttingDown && !this.isSidecarReady()) {
                try {
                    await this.startSidecar();
                } catch (error) {
                    this.logger.error(`Falha ao reiniciar sidecar: ${error}`);
                }
            }
        }, 5000); // Aguarda 5 segundos antes de tentar reiniciar
    }

    /**
     * Inicia health check periódico
     */
    private startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            if (!this.isSidecarReady()) {
                this.logger.warn('Sidecar não está pronto durante health check');
                return;
            }

            // Envia ping
            const pingTime = Date.now();
            this.childProcess!.send({ type: 'ping' } as SidecarRequest);

            // Aguarda pong por um tempo limitado
            setTimeout(() => {
                if (this.lastPongTime && this.lastPongTime.getTime() < pingTime) {
                    this.logger.error('Pong não recebido a tempo, sidecar pode estar travado');
                    // Força reinício
                    if (this.childProcess) {
                        this.childProcess.kill('SIGKILL');
                    }
                }
            }, this.PONG_TIMEOUT_MS);
        }, this.HEALTH_CHECK_INTERVAL_MS);
    }

    /**
     * Para health check
     */
    private stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Processa mensagens recebidas do processo filho
     */
    private handleMessage(msg: SidecarResponse) {
        switch (msg.event) {
            case 'pong':
                this.lastPongTime = new Date();
                break;

            case 'query_result':
                this.resolvePendingQuery(msg.data);
                break;

            case 'query_error':
                this.resolvePendingQuery(undefined, msg.error);
                break;

            case 'error':
                this.logger.error(`Erro reportado pelo sidecar: ${msg.error}`);
                break;

            case 'ready':
            case 'attached':
            case 'extension_installed':
                // Já tratados em seus respectivos métodos
                break;

            default:
                this.logger.warn(`Mensagem desconhecida do sidecar: ${JSON.stringify(msg)}`);
        }
    }

    /**
     * Resolve uma query pendente
     */
    private resolvePendingQuery(data?: any[], error?: string) {
        // Como não temos correlação por ID nas respostas atuais,
        // resolvemos a primeira query pendente (FIFO)
        const [firstEntry] = this.pendingQueries.entries();
        if (!firstEntry) return;

        const [id, pending] = firstEntry;
        clearTimeout(pending.timer);
        this.pendingQueries.delete(id);

        if (error) {
            pending.resolve({ success: false, error });
        } else {
            pending.resolve({ success: true, data: data || [] });
        }
    }

    /**
     * Constrói connection string a partir de variáveis de ambiente
     */
    private buildConnectionStringFromEnv(): string | null {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '5432';
        const user = process.env.DB_USER || process.env.DB_USERNAME;
        const pass = process.env.DB_PASS || process.env.DB_PASSWORD;
        const db = process.env.DB_NAME || process.env.DB_DATABASE;

        if (!user || !pass || !db) {
            return null;
        }

        return `postgresql://${user}:${pass}@${host}:${port}/${db}`;
    }
}
