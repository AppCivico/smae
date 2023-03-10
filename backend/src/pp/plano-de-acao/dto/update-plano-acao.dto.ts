import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreatePlanoAcaoDto } from "./create-plano-acao.dto";

export class UpdatePlanoAcaoDto extends OmitType(PartialType(CreatePlanoAcaoDto), ['projeto_risco_id']) {}