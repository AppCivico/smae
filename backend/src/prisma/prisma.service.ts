import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import { fieldEncryptionExtension } from 'prisma-field-encryption';
import { RetryPromise } from '../common/retryPromise';
import { prismaQueryAls, recordPrismaQuery } from './prisma-query-context';

const logConfig = [
    {
        emit: 'event' as const,
        level: 'query' as const,
    },
    {
        emit: 'stdout' as const,
        level: 'error' as const,
    },
    {
        emit: 'stdout' as const,
        level: 'info' as const,
    },
    {
        emit: 'stdout' as const,
        level: 'warn' as const,
    },
];

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    // Stub method - will be replaced by Proxy
    async onModuleInit() {}

    /**
     * Client com a extensão `prisma-field-encryption` aplicada. Use **somente** nas operações
     * que leem/escrevem colunas `@encrypted` (hoje: o model `api_request_log`).
     *
     * O client principal (`this`) NÃO tem a extensão de propósito: ela envolve TODAS as
     * operações e desreferencia o modelo no mapa DMMF sem null-guard, então qualquer query
     * numa `view` (que o field-encryption não mapeia) quebraria com
     * `Cannot read properties of undefined (reading 'fields')`. Isolando a extensão neste
     * client derivado, as ~22 views do schema passam direto pelo client principal.
     *
     * O client derivado via `$extends` compartilha a mesma conexão/pool do principal.
     */
    declare readonly encrypted: PrismaClient;

    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
        super({ adapter, log: logConfig });

        (this as unknown as PrismaClient<{ log: typeof logConfig }>).$on('query', (e: Prisma.QueryEvent) => {
            const hasStore = prismaQueryAls.getStore() !== undefined;
            if (hasStore)
                // eslint-disable-next-line no-console
                console.error('[prisma-query-debug] fired, hasStore=', hasStore, 'sql=', e.query, '\n', e.params);
            recordPrismaQuery({
                query: e.query,
                params: e.params,
                duration: e.duration,
                timestamp: new Date(e.timestamp).toISOString(),
                target: e.target,
            });
        });

        // Client derivado com field-encryption — só usado via `this.encrypted` (compartilha a conexão).
        const encrypted = this.$extends(fieldEncryptionExtension());

        // Proxy to intercept onModuleInit and $transaction while delegating everything else.
        // O alvo é o client BASE (sem field-encryption): tudo, inclusive queries em views, passa por ele.
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (prop === 'onModuleInit') {
                    return async function (this: any) {
                        await target.$connect();
                    };
                }
                if (prop === 'encrypted') {
                    return encrypted;
                }
                if (prop === '$transaction') {
                    return async function (arg: any, options?: any) {
                        if (Array.isArray(arg)) {
                            const transactionPromiseFn = async () => {
                                return target.$transaction(arg, options);
                            };
                            return RetryPromise(transactionPromiseFn, 10, 10_000, 0.2);
                        } else if (typeof arg === 'function') {
                            if (!options) options = {};
                            if (options.timeout === undefined) options.timeout = 60 * 1000;
                            if (options.maxWait === undefined) options.maxWait = 45 * 1000;

                            const transactionPromiseFn = async () => {
                                return target.$transaction(arg, options);
                            };
                            return RetryPromise(transactionPromiseFn, 10, 10_000, 0.2);
                        }
                        throw new Error('Invalid arguments passed to $transaction');
                    };
                }
                // Delegate everything else to the extended client
                return Reflect.get(target, prop, receiver);
            },
        }) as any;
    }
}
