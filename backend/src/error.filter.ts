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

        response.status(404).json({ message: 'Recurso acesso não foi encontrado ' + request.url });
    }

}