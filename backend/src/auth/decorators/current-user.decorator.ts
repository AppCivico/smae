import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PessoaFromJwt } from './../models/PessoaFromJwt';
import { AuthRequest } from '../models/AuthRequest';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext): PessoaFromJwt => {
    const request = context.switchToHttp().getRequest<AuthRequest>();

    return request.user as PessoaFromJwt;
});
