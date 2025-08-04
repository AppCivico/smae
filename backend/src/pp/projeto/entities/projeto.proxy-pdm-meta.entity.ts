import { TipoPdm } from 'src/generated/prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';

export class ProjetoProxyPdmMetaDto {
    id: number;
    nome: string;
    rotulo_iniciativa: string;
    rotulo_atividade: string;
    ativo: boolean;
    tipo: TipoPdm;
    metas: IdCodTituloDto[];
}

export class ListProjetoProxyPdmMetaDto {
    linhas: ProjetoProxyPdmMetaDto[];
}
