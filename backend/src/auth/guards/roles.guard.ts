import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }

        let { user } = context.switchToHttp().getRequest();

        console.log(user);
        if (!user)
            throw new UnauthorizedException(`Faltando usuário para verificar o acesso: ${requiredRoles.join(', ')}`);

        const JwtUser = user as PessoaFromJwt;
        if (JwtUser.hasSomeRoles(requiredRoles)) {
            return true
        }

        throw new UnauthorizedException(`Pelo menos dos privilégios são necessários para o acesso: ${requiredRoles.join(', ')}`);
    }


}
