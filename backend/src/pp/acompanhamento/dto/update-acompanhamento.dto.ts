import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateProjetoAcompanhamentoDto } from "./create-acompanhamento.dto";

export class UpdateProjetoAcompanhamentoDto extends OmitType(PartialType(CreateProjetoAcompanhamentoDto), []) {}