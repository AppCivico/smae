import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { from, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuthRequest } from './auth/models/AuthRequest';
import { PrismaService } from './prisma/prisma.service';
import { getRecentPrismaQueries, PrismaQueryLogEntry } from './prisma/prisma-query-context';

/**
 * Loga as queries do Prisma capturadas durante a requisição quando o cliente pede debug,
 * via header `x-debug` (qualquer valor) ou query string `?debug=1`.
 *
 * Por padrão somente superadmins (SMAE.superadmin) podem disparar, para não vazar SQL/params em
 * produção. Em ambientes controlados (ex.: homol, que roda NODE_ENV=production) pode-se liberar para
 * qualquer requisição setando a env QUERY_DEBUG_ALLOW_ALL=1.
 *
 * As queries já são coletadas globalmente pelo $on('query') em PrismaService -> prisma-query-context;
 * aqui apenas expomos o que foi coletado nesta requisição (com fallback no ring buffer global).
 *
 * Além do log via Logger, persiste as queries em `log_generico` e devolve o id da linha no header
 * `x-debug-log-id`, para consulta posterior (ex.: Metabase).
 */
@Injectable()
export class QueryDebugInterceptor implements NestInterceptor {
    private readonly logger = new Logger('QueryDebug');

    constructor(private readonly prisma: PrismaService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<AuthRequest>();
        const res = context.switchToHttp().getResponse();

        const pediuDebug = req.header('x-debug') !== undefined || req.query?.debug === '1';
        const ehAdmin =
            !!req.user && typeof req.user.hasSomeRoles === 'function' && req.user.hasSomeRoles(['SMAE.superadmin']);
        const liberadoPorEnv = process.env.QUERY_DEBUG_ALLOW_ALL === '1';
        const ativo = pediuDebug && (ehAdmin || liberadoPorEnv);

        if (!ativo) return next.handle();

        return next.handle().pipe(
            // Persiste antes de emitir a resposta, para conseguir setar o header com o id.
            mergeMap((body) => from(this.persist(req, res).then(() => body))),
            // Se a persistência falhar, não derruba a requisição.
            // (o erro já é logado dentro de persist)
        );
    }

    private async persist(req: AuthRequest, res: any): Promise<void> {
        const queries = getRecentPrismaQueries();
        const texto = this.montarTexto(req, queries);

        this.logger.log(texto);

        try {
            const logData = req.user?.getLogData();
            const ip = logData?.ip || req.ip || '0.0.0.0';
            const pessoa_sessao_id =
                logData?.pessoa_sessao_id && logData.pessoa_sessao_id > 0 ? logData.pessoa_sessao_id : null;

            const row = await this.prisma.logGenerico.create({
                data: {
                    contexto: `QueryDebug ${req.method} ${req.url}`,
                    ip,
                    log: texto,
                    pessoa_id: logData?.pessoa_id ?? null,
                    pessoa_sessao_id,
                },
                select: { id: true },
            });

            if (!res.headersSent) res.setHeader('x-debug-log-id', String(row.id));
        } catch (e) {
            this.logger.error(`Falha ao persistir log de debug: ${e}`);
        }
    }

    private montarTexto(req: AuthRequest, queries: PrismaQueryLogEntry[]): string {
        return (
            `${req.method} ${req.url} — ${queries.length} query(s):\n` +
            queries
                .map((q, i) => `#${i + 1} (${q.duration}ms) ${q.query}` + (q.params ? `\n     params: ${q.params}` : ''))
                .join('\n')
        );
    }
}
