import { ModuloSistema } from '@prisma/client';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export class ListaPrivilegiosModulos {
    privilegios: ListaDePrivilegios[];
    sistemas: ModuloSistema[];
}
