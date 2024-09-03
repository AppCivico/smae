import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';

export class GrupoTematico {
    id: number;
    nome: string;
    programa_habitacional: boolean;
    unidades_habitacionais: boolean;
    familias_beneficiadas: boolean;
    unidades_atendidas: boolean;
    criado_em: Date;
    criado_por: IdNomeExibicaoDto;
}

export class ListGrupoTematicoDto {
    linhas: GrupoTematico[];
}
