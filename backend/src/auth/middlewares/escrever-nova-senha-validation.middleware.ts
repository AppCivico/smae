import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { EscreverNovaSenhaRequestBody } from '../models/EscreverNovaSenhaRequestBody.dto';

@Injectable()
export class EscreverNovaSenhaValidationMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        const body = req.body;

        const loginRequestBody = new EscreverNovaSenhaRequestBody();
        loginRequestBody.reduced_access_token = body.reduced_access_token;
        loginRequestBody.senha = body.senha;

        const validations = await validate(loginRequestBody);

        if (validations.length) {
            throw new BadRequestException(
                validations.reduce((acc, curr) => {
                    return [...acc, ...Object.values(curr.constraints as any)];
                }, [])
            );
        }
        next();
    }
}
