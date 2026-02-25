import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { UnwrapTuple } from '@prisma/client/runtime/library';
import { fieldEncryptionExtension } from 'prisma-field-encryption';
import { RetryPromise } from '../common/retryPromise';

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

    constructor() {
        super({ log: logConfig });
        // Apply field encryption extension immediately
        const extended = this.$extends(fieldEncryptionExtension());

        // Proxy to intercept onModuleInit and $transaction while delegating everything else
        return new Proxy(extended, {
            get(target, prop, receiver) {
                if (prop === 'onModuleInit') {
                    return async function (this: any) {
                        await target.$connect();
                    };
                }
                if (prop === '$transaction') {
                    return async function (arg: any, options?: any) {
                        if (Array.isArray(arg)) {
                            const transactionPromiseFn = async () => {
                                return target.$transaction(arg, options);
                            };
                            return RetryPromise(transactionPromiseFn, 10, 10000, 2000);
                        } else if (typeof arg === 'function') {
                            if (!options) options = {};
                            if (options.timeout === undefined) options.timeout = 60 * 1000;
                            if (options.maxWait === undefined) options.maxWait = 45 * 1000;

                            const transactionPromiseFn = async () => {
                                return target.$transaction(arg, options);
                            };
                            return RetryPromise(transactionPromiseFn, 10, 10000, 2000);
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
