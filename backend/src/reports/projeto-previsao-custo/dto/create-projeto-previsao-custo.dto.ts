import { OmitType } from "@nestjs/swagger";
import { SuperCreateRelPrevisaoCustoDto } from "src/reports/previsao-custo/dto/create-previsao-custo.dto";

export class CreateRelProjetoPrevisaoCustoDto extends OmitType(
    SuperCreateRelPrevisaoCustoDto,
    ['atividade_id', 'iniciativa_id', 'meta_id', 'pdm_id'] as const
) { }
