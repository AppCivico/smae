import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AuthRequest } from './auth/models/AuthRequest';
import { PessoaFromJwt } from './auth/models/PessoaFromJwt';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const request = ctx.getRequest<AuthRequest>();
        let ehAdmin: boolean = false;
        console.log(request.user, exception);
        if (request.user && request.user instanceof PessoaFromJwt && request.user.hasSomeRoles(['SMAE.superadmin']))
            ehAdmin = true;

        const httpStatusCode =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        let httpResponse = exception instanceof HttpException ? exception.getResponse() : undefined;

        if (httpResponse && typeof httpResponse === 'string') httpResponse = { message: httpResponse };
        if (typeof httpResponse !== 'object') httpResponse = {};

        let responseBody: any = {
            statusCode: httpStatusCode,
            message: 'Erro interno/não esperado... Contate um administrador do sistema ou tente novamente.',
            ...httpResponse,
        };

        if (exception instanceof Error) {
            console.error(exception);
        }

        if (ehAdmin) {
            console.log(exception);
            responseBody = {
                ...responseBody,
                exception: {
                    message: exception instanceof Error ? exception.message : `Erro desconhecido: ${exception}`,
                    stack: exception instanceof Error ? exception.stack : null,
                },
            };
        }

        httpAdapter.reply(ctx.getResponse(), responseBody, httpStatusCode);
    }
}
