import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRequest } from './auth/models/AuthRequest';
import { getRecentPrismaQueries } from './prisma/prisma-query-context';

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
 */
@Injectable()
export class QueryDebugInterceptor implements NestInterceptor {
    private readonly logger = new Logger('QueryDebug');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<AuthRequest>();

        const pediuDebug = req.header('x-debug') !== undefined || req.query?.debug === '1';
        const ehAdmin = !!req.user && req.user.hasSomeRoles(['SMAE.superadmin']);
        const liberadoPorEnv = process.env.QUERY_DEBUG_ALLOW_ALL === '1';
        const ativo = pediuDebug && (ehAdmin || liberadoPorEnv);

        if (!ativo) return next.handle();

        return next.handle().pipe(
            tap({
                next: () => this.dump(req),
                error: () => this.dump(req),
            })
        );
    }

    private dump(req: AuthRequest): void {
        const queries = getRecentPrismaQueries();
        this.logger.log(
            `${req.method} ${req.url} — ${queries.length} query(s):\n` +
                queries
                    .map(
                        (q, i) =>
                            `#${i + 1} (${q.duration}ms) ${q.query}` + (q.params ? `\n     params: ${q.params}` : '')
                    )
                    .join('\n')
        );
    }
}
