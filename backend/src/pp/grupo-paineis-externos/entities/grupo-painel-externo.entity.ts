import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { IdNomeExibicaoDto } from '../../../common/dto/IdNomeExibicao.dto';

export class GruposPaineisExternosItemDto {
    id: number;
    orgao_id: number;
    titulo: string;
    participantes: IdNomeExibicaoDto[];
    criado_em: Date;
    paineis: IdCodTituloDto[];
}

export class ListGruposPaineisExternosDto {
    linhas: GruposPaineisExternosItemDto[];
}

