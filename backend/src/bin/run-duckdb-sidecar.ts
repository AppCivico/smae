import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DuckDBProviderService } from '../common/duckdb/duckdb-provider.service';
import { Database } from 'duckdb-async';

// Desativa crontabs no sidecar
process.env.DISABLED_CRONTABS = 'all';

const logger = new Logger('DuckDBSidecar');
let duckdb: Database | null = null;
let isShuttingDown = false;

// Mensagens de controle do processo pai
type SidecarRequest =
    | { type: 'query'; sql: string; params?: any[] }
    | { type: 'attach_postgres'; connectionString: string; alias?: string }
    | { type: 'install_extension'; name: string }
    | { type: 'ping' };

type SidecarResponse =
    | { event: 'query_result'; data: any[]; error?: string }
    | { event: 'query_error'; error: string }
    | { event: 'attached'; alias: string; error?: string }
    | { event: 'extension_installed'; name: string; error?: string }
    | { event: 'pong' }
    | { event: 'ready' }
    | { event: 'error'; error: string };

// Tratamento de erros
process.on('uncaughtException', (error: Error) => {
    logger.error(`Exceção não capturada: ${error.message}`, error.stack);
    if (process.send) process.send({ event: 'error', error: error.message } as SidecarResponse);
});

process.on('unhandledRejection', (reason: unknown) => {
    logger.error(`Rejeição não tratada: ${reason}`);
});

// Sinais de desligamento
process.on('SIGTERM', async () => {
    logger.log('SIGTERM recebido, encerrando...');
    await shutdown();
});

process.on('SIGINT', async () => {
    logger.log('SIGINT recebido, encerrando...');
    await shutdown();
});

async function shutdown() {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.log('Desligando DuckDB sidecar...');
    if (duckdb) {
        try {
            await duckdb.close();
            logger.log('Conexão DuckDB fechada');
        } catch (e) {
            logger.error(`Erro ao fechar DuckDB: ${e}`);
        }
    }
    process.exit(0);
}

async function bootstrap() {
    logger.log('Iniciando DuckDB Sidecar...');

    try {
        const app = await NestFactory.createApplicationContext(AppModule, {
            logger: ['error', 'warn'],
        });
        app.enableShutdownHooks();

        // Obtém o serviço configurado
        const duckdbProvider = app.get(DuckDBProviderService);

        // Cria instância do DuckDB
        duckdb = await duckdbProvider.getConfiguredInstance();

        // Instala extensões úteis para vector search e FTS
        logger.log('Instalando extensões...');
        await duckdb.run('INSTALL vss;');
        await duckdb.run('LOAD vss;');
        await duckdb.run('INSTALL fts;');
        await duckdb.run('LOAD fts;');
        await duckdb.run('INSTALL postgres;');
        await duckdb.run('LOAD postgres;');

        logger.log('DuckDB Sidecar pronto');

        // Notifica o processo pai que está pronto
        if (process.send) {
            process.send({ event: 'ready' } as SidecarResponse);
        }

        // Configura handler de mensagens do processo pai
        process.on('message', async (msg: SidecarRequest) => {
            if (isShuttingDown) return;

            try {
                switch (msg.type) {
                    case 'ping':
                        if (process.send) process.send({ event: 'pong' } as SidecarResponse);
                        break;

                    case 'query':
                        await handleQuery(msg.sql, msg.params);
                        break;

                    case 'attach_postgres':
                        await handleAttachPostgres(msg.connectionString, msg.alias || 'postgres');
                        break;

                    case 'install_extension':
                        await handleInstallExtension(msg.name);
                        break;

                    default:
                        logger.warn(`Mensagem desconhecida: ${JSON.stringify(msg)}`);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                logger.error(`Erro ao processar mensagem: ${errorMsg}`);
                if (process.send) {
                    process.send({ event: 'error', error: errorMsg } as SidecarResponse);
                }
            }
        });
    } catch (error) {
        logger.error(`Falha ao iniciar sidecar: ${error}`);
        process.exit(1);
    }
}

async function handleQuery(sql: string, params?: any[]) {
    if (!duckdb) {
        if (process.send) {
            process.send({ event: 'query_error', error: 'DuckDB não inicializado' } as SidecarResponse);
        }
        return;
    }

    try {
        const startTime = Date.now();
        const rows = await duckdb.all(sql, params || []);
        const duration = Date.now() - startTime;

        logger.debug(`Query executada em ${duration}ms: ${sql.substring(0, 100)}...`);

        if (process.send) {
            process.send({ event: 'query_result', data: rows } as SidecarResponse);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Erro na query: ${errorMsg}`);
        if (process.send) {
            process.send({ event: 'query_error', error: errorMsg } as SidecarResponse);
        }
    }
}

async function handleAttachPostgres(connectionString: string, alias: string) {
    if (!duckdb) {
        if (process.send) {
            process.send({
                event: 'attached',
                alias,
                error: 'DuckDB não inicializado',
            } as SidecarResponse);
        }
        return;
    }

    try {
        // ATTACH PostgreSQL database
        // connectionString format: "postgresql://user:pass@host:port/dbname"
        await duckdb.run(`ATTACH '${connectionString}' AS ${alias} (TYPE postgres)`);
        logger.log(`PostgreSQL anexado como ${alias}`);

        if (process.send) {
            process.send({ event: 'attached', alias } as SidecarResponse);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Erro ao anexar PostgreSQL: ${errorMsg}`);
        if (process.send) {
            process.send({ event: 'attached', alias, error: errorMsg } as SidecarResponse);
        }
    }
}

async function handleInstallExtension(name: string) {
    if (!duckdb) {
        if (process.send) {
            process.send({
                event: 'extension_installed',
                name,
                error: 'DuckDB não inicializado',
            } as SidecarResponse);
        }
        return;
    }

    try {
        await duckdb.run(`INSTALL ${name};`);
        await duckdb.run(`LOAD ${name};`);
        logger.log(`Extensão ${name} instalada e carregada`);

        if (process.send) {
            process.send({ event: 'extension_installed', name } as SidecarResponse);
        }
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`Erro ao instalar extensão ${name}: ${errorMsg}`);
        if (process.send) {
            process.send({ event: 'extension_installed', name, error: errorMsg } as SidecarResponse);
        }
    }
}

bootstrap().catch((error) => {
    logger.error(`Erro fatal no bootstrap: ${error}`);
    process.exit(1);
});
