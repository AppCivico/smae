import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ApiBearerAuth, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

export const ROLES_KEY = 'roles';
export const RequerPriv = (...roles: ListaDePrivilegios[]) => SetMetadata(ROLES_KEY, roles);

export function Roles(roles: ListaDePrivilegios[], summary?: string): MethodDecorator & ClassDecorator {
    summary = summary ? `${summary} ` : '';
    const summaryText = `${summary}(Privilégios: ${Array.isArray(roles) ? roles.join(', ') : ''})`;

    return (target: any, key?: string | symbol, descriptor?: PropertyDescriptor): any => {
        if (descriptor !== undefined) {
            return applyDecorators(
                ApiBearerAuth('access-token'),
                ApiUnauthorizedResponse(),
                ApiOperation({ summary: summaryText }),
                RequerPriv(...roles)
            )(target, key!, descriptor);
        }
        return applyDecorators(ApiBearerAuth('access-token'), ApiUnauthorizedResponse(), RequerPriv(...roles))(target);
    };
}
