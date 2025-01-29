import { ModuloSistema, TipoPdm } from '@prisma/client';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export class ListaPrivilegiosModulos {
    privilegios: ListaDePrivilegios[];
    sistemas: ModuloSistema[];
    equipe_pdm_tipos: TipoPdm[];
}
