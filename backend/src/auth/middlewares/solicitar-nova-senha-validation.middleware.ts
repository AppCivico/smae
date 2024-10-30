import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { SolicitarNovaSenhaRequestBody } from '../models/SolicitarNovaSenhaRequestBody.dto';
import { FormatValidationErrors } from '../../common/helpers/FormatValidationErrors';

@Injectable()
export class SolicitarNovaSenhaValidationMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        const body = req.body;

        const loginRequestBody = new SolicitarNovaSenhaRequestBody();
        loginRequestBody.email = body.email;

        const validations = await validate(loginRequestBody);

        if (validations.length) {
            throw new BadRequestException(FormatValidationErrors(validations));
        }
        next();
    }
}
