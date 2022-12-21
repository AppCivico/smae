import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

// Tratando erro do Prisma quando usa findOrThrow
@Catch(Prisma.PrismaClientKnownRequestError)
export class ErrorFilter implements ExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        console.log(exception);

        if (exception.code == 'P2025') {
            response.status(404).json({ message: 'Recurso acessado não foi encontrado ' + request.url });
        } else {
            response.status(500).json({ message: 'Erro interno durante execução, banco de dados: Prisma Code: ' + exception.code });
        }
    }

}