import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient, UnwrapTuple } from '@prisma/client';
import { RetryPromise } from '../common/retryPromise';

class PrismaServiceBase extends PrismaClient implements OnModuleInit {
    constructor() {
        super({
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
        this.$on('query', async (e) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            console.log(`${e.query} ${e.params} took ${e.duration}ms`);
        });
    }

    async enableShutdownHooks(app: INestApplication) {
        this.$on('beforeExit', async () => {
            await app.close();
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
