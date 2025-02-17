import { ModuloSistema, PerfilResponsavelEquipe } from '@prisma/client';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export class ListaPrivilegiosModulos {
    privilegios: ListaDePrivilegios[];
    sistemas: ModuloSistema[];
    perfis_equipe_pdm: PerfilResponsavelEquipe[];
    perfis_equipe_ps: PerfilResponsavelEquipe[];
}
