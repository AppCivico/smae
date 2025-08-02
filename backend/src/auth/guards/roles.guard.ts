import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ROLES_KEY } from './../decorators/roles.decorator';
import { PessoaFromJwt } from './../models/PessoaFromJwt';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // const handler = context.getHandler();
        // const className = context.getClass().name;

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const requiredRoles = this.reflector.getAllAndOverride<ListaDePrivilegios[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const { user } = request;
        const requestUrl = request.originalUrl || request.url;
        ///const debug = `requestUrl = ${requestUrl}, controller = ${className}, smae-sistemas = ${request.headers['smae-sistemas'] ?? '-'}`;

        if (!user) {
            throw new UnauthorizedException(
                `Usuário não encontrado, necessário para verificar os acessos: \n${requiredRoles.join(', ')}`
            );
        }

        const jwtUser = user instanceof PessoaFromJwt ? user : new PessoaFromJwt(user);

        if (jwtUser.hasSomeRoles(requiredRoles)) {
            return true;
        }

        throw new UnauthorizedException(
            `Ao menos um dos seguintes privilégios é necessário para o acesso: \n${requiredRoles.join(', ')}`
        );
    }
}
