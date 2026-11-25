import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { AuthRequest } from './auth/models/AuthRequest';
import { respondTriggerHttpError } from './prisma-error-unknown.filter';
import { getRecentPrismaQueries } from './prisma/prisma-query-context';

const ERROS_CONEXAO = new Set(['P1001', 'P1002', 'P1008', 'P1011', 'P1017']);

const BANCO_INDISPONIVEL = {
    message: 'Banco de dados temporariamente indisponível',
    detail: 'Por favor, repita a operação',
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter implements ExceptionFilter {
    private logger: Logger = new Logger('Prisma Error');

    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<AuthRequest>();

        if (respondTriggerHttpError(exception, response)) return;

        // Get the stack trace and find the relevant application code location
        const stackLines = exception.stack?.split('\n') || [];
        const appStackLine =
            stackLines.find((line) => line.includes('/src/') && !line.includes('node_modules')) || stackLines[1] || '';

        let ehAdmin: boolean = false;
        if (request.user && request.user.hasSomeRoles(['SMAE.superadmin'])) ehAdmin = true;

        // Extract model name from the error message
        const modelMatch =
            exception.message.match(/Invalid `(?:\w+\.)?(\w+)\.\w+\(\)`/) || exception.message.match(/No (\w+) found/);
        const model = exception.meta?.modelName || (modelMatch ? modelMatch[1] : 'unknown');

        // Try to extract the where clause from the message
        const whereMatch = exception.message.match(/where:\s*({[^}]+})/);
        const whereClause = whereMatch ? whereMatch[1] : 'conditions not available';

        // Recent SQL queries captured for this request (oldest -> newest)
        const recentQueries = getRecentPrismaQueries();

        if (ERROS_CONEXAO.has(exception.code)) {
            response.status(503).json(BANCO_INDISPONIVEL);
        } else if (exception.code == 'P2025') {
            response.status(404).json(
                this.convertLog(ehAdmin, {
                    message: `Registro não encontrado na tabela '${model}'`,
                    detail: exception.message,
                    where: whereClause,
                    path: request.url,
                    location: appStackLine.trim(),
                    stack: stackLines.filter((line) => line.includes('/src/')).map((line) => line.trim()),
                })
            );
        } else if (exception.code == 'P2003') {
            response.status(423).json(
                this.convertLog(ehAdmin, {
                    message: `Restrição de chave estrangeira falhou`,
                    detail: `Tabela ${exception.meta?.modelName}, campo ${exception.meta?.field_name}`,
                    location: appStackLine.trim(),
                })
            );
        } else if (exception.code == 'P2002') {
            response.status(409).json(
                this.convertLog(ehAdmin, {
                    message: 'Registro duplicado: já existe um registro com estes dados',
                    detail: `Tabela ${model}, restrição ${this.uniqueTarget(exception)}`,
                    location: appStackLine.trim(),
                })
            );
        } else if (exception.code == 'P2034') {
            response.status(423).json(
                this.convertLog(ehAdmin, {
                    message: 'Impasse durante execução das transações no banco de dados ' + exception.code,
                    detail: 'Por favor, repita a operação',
                    location: appStackLine.trim(),
                })
            );
        } else {
            response.status(500).json(
                this.convertLog(ehAdmin, {
                    message: 'Erro interno durante execução no banco de dados ' + exception.code,
                    code: exception.code,
                    model: model,
                    location: appStackLine.trim(),
                    recentQueries: recentQueries.slice(-5),
                })
            );
        }

        this.logger.error(
            JSON.stringify(
                {
                    code: exception.code,
                    message: exception.message,
                    model: model,
                    where: whereClause,
                    location: appStackLine,
                    meta: exception.meta,
                    fullStack: stackLines.filter((line) => line.includes('/src/')),
                    recentQueries: recentQueries,
                    rawError: exception,
                },
                null,
                2
            )
        );
    }

    // com driver adapter o alvo vem em meta.driverAdapterError.cause.constraint, não em meta.target
    private uniqueTarget(exception: Prisma.PrismaClientKnownRequestError): string {
        const meta = exception.meta as any;
        const constraint = meta?.driverAdapterError?.cause?.constraint;
        const target = meta?.target ?? constraint?.index ?? constraint?.fields;
        if (!target) return 'desconhecida';
        return Array.isArray(target) ? target.join(', ') : String(target);
    }

    private convertLog(ehAdmin: boolean, log: any): any {
        if (ehAdmin) {
            return {
                message: log.message + ' ' + JSON.stringify(log, null, 2),
            };
        } else {
            return {
                message: log.message,
                location: log.location,
                detail: log.detail,
                path: log.path,
                code: log.code,
            };
        }
    }
}

@Catch(Prisma.PrismaClientInitializationError)
export class PrismaInitializationErrorFilter implements ExceptionFilter {
    private logger: Logger = new Logger('Prisma Error');

    catch(exception: Prisma.PrismaClientInitializationError, host: ArgumentsHost) {
        this.logger.error(exception.message, exception.stack);
        host.switchToHttp().getResponse<Response>().status(503).json(BANCO_INDISPONIVEL);
    }
}
