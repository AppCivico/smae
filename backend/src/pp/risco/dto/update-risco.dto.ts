import { OmitType, PartialType } from "@nestjs/mapped-types";
import { CreateRiscoDto } from "./create-risco.dto";

export class UpdateRiscoDto extends OmitType(PartialType(CreateRiscoDto), []) {}