import { ApiProperty } from "@nestjs/swagger"
import { IdCodTituloDto } from "../../../common/dto/IdCodTitulo.dto"

export class RelPrevisaoCustoDto {
    meta: IdCodTituloDto | null
    iniciativa: IdCodTituloDto | null
    atividade: IdCodTituloDto | null

    custo_previsto: string;
    projeto_atividade: string;
    parte_dotacao: string;
    ano_referencia: number;
    id: number;
    criado_em: Date;
    atualizado_em: Date;
}

export class ListPrevisaoCustoDto {
    linhas: RelPrevisaoCustoDto[]
}
