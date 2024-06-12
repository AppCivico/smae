import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { ApiBearerAuth, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

export const ROLES_KEY = 'roles';
export const RequerPriv = (...roles: ListaDePrivilegios[]) => SetMetadata(ROLES_KEY, roles);

export function Roles(roles: ListaDePrivilegios[], summary?: string): MethodDecorator & ClassDecorator {
    summary = summary ? `${summary} ` : '';
    summary = `${summary}(Privilégios: ${Array.isArray(roles) ? roles.join(', ') : ''})`;
    return applyDecorators(
        ApiBearerAuth('access-token'),
        ApiUnauthorizedResponse(),
        ApiOperation({ summary: summary }),
        RequerPriv(...roles)
    );
}
