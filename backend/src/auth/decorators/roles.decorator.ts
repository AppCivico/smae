import { SetMetadata } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ListaDePrivilegios[]) => SetMetadata(ROLES_KEY, roles);
