import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../models/AuthRequest';
import { PessoaFromJwt } from './../models/PessoaFromJwt';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext): PessoaFromJwt => {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    return request.user as PessoaFromJwt;
});
