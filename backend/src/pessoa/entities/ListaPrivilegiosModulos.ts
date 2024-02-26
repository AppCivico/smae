import { ModuloSistema } from '@prisma/client';

export class ListaPrivilegiosModulos {
    privilegios: string[];
    modulos: string[];
    sistemas: ModuloSistema[];
}
