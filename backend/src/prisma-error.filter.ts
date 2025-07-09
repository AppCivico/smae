import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { Response } from 'express';
import { AuthRequest } from './auth/models/AuthRequest';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaErrorFilter implements ExceptionFilter {
    private logger: Logger = new Logger('Prisma Error');

    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<AuthRequest>();

        // Get the stack trace and find the relevant application code location
        const stackLines = exception.stack?.split('\n') || [];
        const appStackLine =
            stackLines.find((line) => line.includes('/src/') && !line.includes('node_modules')) || stackLines[1] || '';

        let ehAdmin: boolean = false;
        if (request.user && request.user.hasSomeRoles(['SMAE.superadmin'])) ehAdmin = true;

        // Extract model name from the error message
        const modelMatch = exception.message.match(/Invalid `(\w+)\./) || exception.message.match(/No (\w+) found/);
        const model = modelMatch ? modelMatch[1] : exception.meta?.modelName || 'unknown';

        // Try to extract the where clause from the message
        const whereMatch = exception.message.match(/where:\s*({[^}]+})/);
        const whereClause = whereMatch ? whereMatch[1] : 'conditions not available';

        if (exception.code == 'P2025') {
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
        } else if (exception.code == 'P2034') {
            response.status(423).json(
                this.convertLog(ehAdmin, {
                    message: 'Impasse durante execução das transações no banco de dados',
                    detail: 'Por favor, repita a operação',
                    location: appStackLine.trim(),
                })
            );
        } else {
            response.status(500).json(
                this.convertLog(ehAdmin, {
                    message: 'Erro interno durante execução no banco de dados',
                    code: exception.code,
                    model: model,
                    location: appStackLine.trim(),
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
                    rawError: exception,
                },
                null,
                2
            )
        );
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
