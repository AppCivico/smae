import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/auth/decorators/roles.decorator';

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

        const { user } = context.switchToHttp().getRequest();
        // qualquer uma das regras que der match
        const canExecute = requiredRoles.some((role) => user.privilegios?.includes(role));
        if (canExecute) return true;
        throw new UnauthorizedException(`Pelo menos dos privilégios são necessários para o acesso: ${requiredRoles.join(', ')}`);
    }


}
