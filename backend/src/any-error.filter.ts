import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AuthRequest } from './auth/models/AuthRequest';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const request = ctx.getRequest<AuthRequest>();
        let ehAdmin: boolean = false;
        if (request.user && request.user.hasSomeRoles(['SMAE.superadmin'])) ehAdmin = true;

        const httpStatus =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const httpMessage = exception instanceof HttpException ? exception.message : 'Erro interno';

        let responseBody: any = {
            statusCode: httpStatus,
            message: httpMessage,
        };

        if (ehAdmin) {
            responseBody = {
                ...responseBody,
                exception: {
                    message: exception instanceof Error ? exception.message : `Erro desconhecido: ${exception}`,
                    stack: exception instanceof Error ? exception.stack : null,
                },
            };
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
}
