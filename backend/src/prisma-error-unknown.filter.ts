import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { Response } from 'express';
import { AllExceptionsFilter } from './any-error.filter';
import { HttpAdapterHost } from '@nestjs/core';

// Tratando erro de dentro de trigger: eg função f_tgr_atualiza_variavel_na_troca_da_etapa
@Catch(Prisma.PrismaClientUnknownRequestError)
export class PrismaErrorFilterUnknown implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: Prisma.PrismaClientUnknownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const jsonMatch = exception.message.match(/__HTTP__ (.+?) __EOF__/);
        if (jsonMatch && jsonMatch[1]) {
            const jsonString = jsonMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');

            console.log('Detected and extracted JSON from a trigger:', jsonString);

            try {
                const jsonObject = JSON.parse(jsonString);
                console.log('Extracted JSON:', jsonObject);

                response.status(jsonObject?.code ?? 400).json(jsonObject);
                return;
            } catch (error) {
                console.error('Failed to parse JSON:', error);
            }
        }

        console.error('redirecting to AllExceptionsFilter');
        const tmp = new AllExceptionsFilter(this.httpAdapterHost);
        tmp.catch(exception, host);
    }
}
