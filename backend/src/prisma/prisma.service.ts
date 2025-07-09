import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from 'src/generated/prisma/client';
import { UnwrapTuple } from '@prisma/client/runtime/library';
import { fieldEncryptionMiddleware } from 'prisma-field-encryption';
import { RetryPromise } from '../common/retryPromise';
import { PrismaPg } from '@prisma/adapter-pg';
import { DMMFDocument } from 'prisma-field-encryption/dist/types';

const dmmf: DMMFDocument = {
    datamodel: {
        models: [
            {
                name: 'api_request_log',
                fields: [
                    {
                        name: 'created_at',
                        type: 'DateTime',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'cf_ray',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'request_num',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'ip',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'response_time',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'response_size',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'req_method',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'req_path',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'req_host',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'req_headers',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                        documentation: '@encrypted?mode=strict',
                    },
                    {
                        name: 'req_query',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                        documentation: '@encrypted?mode=strict',
                    },
                    {
                        name: 'req_body',
                        type: 'String',
                        isId: false,
                        isList: false,
                        isUnique: false,
                        documentation: '@encrypted?mode=strict',
                    },
                    {
                        name: 'req_body_size',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'res_code',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                    {
                        name: 'created_pessoa_id',
                        type: 'Int',
                        isId: false,
                        isList: false,
                        isUnique: false,
                    },
                ],
            },
        ],
    },
};

class PrismaServiceBase extends PrismaClient implements OnModuleInit {
    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

        super({
            adapter,
            log: [
                {
                    emit: 'event',
                    level: 'query',
                },
                {
                    emit: 'stdout',
                    level: 'error',
                },
                {
                    emit: 'stdout',
                    level: 'info',
                },
                {
                    emit: 'stdout',
                    level: 'warn',
                },
            ],
        });

    }

    async onModuleInit() {
        await this.$connect();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.$on('query', async (e: any) => {
            if (process.env.NODE_ENV == 'test' && !process.env.DEBUG) return;
            if (process.env.DISABLE_QUERY_LOG) return;
            // se ta diferente de 1, entao ta ligado sempre
            // já faz o log
            if (process.env.INTERNAL_DISABLE_QUERY_LOG !== '1' && e.query != 'SELECT 1' && e.query != 'COMMIT') {
                console.log(`${e.query} ${e.params} took ${e.duration}ms`);
            } else {
                // aqui apenas algumas queries que não queremos o log
                // as outras queries, se por acaso acontecer de ter um evento
                // entre o await a mudança do INTERNAL_DISABLE_QUERY_LOG
                // esse if vai pegar pra tratar
                const query = e.query as string;

                if (
                    query &&
                    query !== 'BEGIN' &&
                    query !== 'COMMIT' &&
                    query !== 'SELECT 1' &&
                    query !== 'SET TRANSACTION ISOLATION LEVEL READ COMMITTED' &&
                    /(?:pg_try_advisory_xact_lock|task_queue|org_device_activation_data_pending_sync_queue|formula_composta|relatorio_fila)/.test(
                        query
                    ) !== true
                )
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    console.log(`${e.query} ${e.params} took ${e.duration}ms`);
            }
        });
    }
}

@Injectable()
export class PrismaService extends PrismaServiceBase {
    constructor() {
        super();
    }

    async $transaction<P extends Prisma.PrismaPromise<any>[]>(
        arg: [...P],
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
    ): Promise<UnwrapTuple<P>>;
    async $transaction<R>(
        fn: (prisma: Omit<this, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<R>,
        options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }
    ): Promise<R>;

    async $transaction(arg: any, options?: any): Promise<any> {
        if (Array.isArray(arg)) {
            const transactionPromiseFn = async () => {
                return super.$transaction(arg, options);
            };

            return RetryPromise(transactionPromiseFn, 10, 10000, 2000);
        } else if (typeof arg === 'function') {
            if (!options) options = {};

            if (options.timeout === undefined) options.timeout = 60 * 1000;
            if (options.maxWait === undefined) options.maxWait = 45 * 1000;

            const transactionPromiseFn = async () => {
                return super.$transaction(arg, options);
            };

            return RetryPromise(transactionPromiseFn, 10, 10000, 2000);
        }

        throw new Error('Invalid arguments passed to $transaction');
    }
}
