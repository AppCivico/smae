import { TipoPdm } from '@prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';

export class ProjetoProxyPdmMetaDto {
    id: number;
    nome: string;
    ativo: boolean;
    tipo: TipoPdm;
    metas: IdCodTituloDto[];
}

export class ListProjetoProxyPdmMetaDto {
    linhas: ProjetoProxyPdmMetaDto[];
}
