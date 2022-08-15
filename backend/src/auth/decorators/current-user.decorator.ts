import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';
import { AuthRequest } from '../models/AuthRequest';

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext): Pessoa => {
        const request = context.switchToHttp().getRequest<AuthRequest>();

        return request.user;
    },
);