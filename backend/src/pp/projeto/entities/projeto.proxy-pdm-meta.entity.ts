import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';

export class ProjetoProxyPdmMetaDto {
    id: number;
    nome: string;
    metas: IdCodTituloDto[];
}

export class ListProjetoProxyPdmMetaDto {
    linhas: ProjetoProxyPdmMetaDto[]
}

