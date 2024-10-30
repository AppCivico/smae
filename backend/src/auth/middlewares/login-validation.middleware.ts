import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { LoginRequestBody } from '../models/LoginRequestBody.dto';
import { FormatValidationErrors } from '../../common/helpers/FormatValidationErrors';

@Injectable()
export class LoginValidationMiddleware implements NestMiddleware {
    async use(req: Request, res: Response, next: NextFunction) {
        const body = req.body;

        const loginRequestBody = new LoginRequestBody();
        loginRequestBody.email = body.email;
        loginRequestBody.senha = body.senha;

        const validations = await validate(loginRequestBody);

        if (validations.length) {
            throw new BadRequestException(FormatValidationErrors(validations));
        }

        next();
    }
}
