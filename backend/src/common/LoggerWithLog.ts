import { Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { LogOpt } from '../auth/models/PessoaFromJwt';

export type LoggerWithLog = {
    getLogs: () => string[];
    debug: (message: string, ...args: any[]) => void;
    log: (message: string, ...args: any[]) => void;
    verbose: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    saveLogs: (prismaTx: Prisma.TransactionClient, logOpts: LogOpt) => Promise<void>;
};

export function LoggerWithLog(methodName: string): LoggerWithLog {
    const logger = new Logger(`${methodName}`);

    const logs: string[] = [];

    return {
        ...logger,
        getLogs: () => logs,
        saveLogs: async (prismaTx: Prisma.TransactionClient, logOpts: LogOpt) => {
            await prismaTx.logGenerico.create({
                data: {
                    contexto: methodName,
                    ip: logOpts.ip || '0.0.0.0',
                    log: logs.join('\n'),
                    pessoa_id: logOpts.pessoa_id,
                    pessoa_sessao_id: logOpts.pessoa_sessao_id,
                },
            });
        },
        log: (message: string, ...args: any[]) => {
            logger.log(message, ...args);
            logs.push(`${message}`);
        },
        debug: (message: string, ...args: any[]) => {
            logger.debug(message, ...args);
            logs.push(`${message}`);
        },
        verbose: (message: string, ...args: any[]) => {
            logger.verbose(message, ...args);
            logs.push(`${message}`);
        },
        warn: (message: string, ...args: any[]) => {
            logger.warn(message, ...args);
            logs.push(`${message}`);
        },
        error: (message: string, ...args: any[]) => {
            logger.error(message, ...args);
            logs.push(`${message}`);
        },
    };
}
