import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ROLES_KEY } from './../decorators/roles.decorator';
import { PessoaFromJwt } from './../models/PessoaFromJwt';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<ListaDePrivilegios[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();
        if (!user) throw new UnauthorizedException(`Faltando usuário para verificar o acesso: ${requiredRoles.join(', ')}`);

        const JwtUser = user as PessoaFromJwt;
        if (JwtUser.hasSomeRoles(requiredRoles)) {
            return true;
        }

        throw new UnauthorizedException(`Pelo menos os seguintes privilégios são necessários para o acesso: ${requiredRoles.join(', ')}`);
    }
}
