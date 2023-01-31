import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVariavelDto } from './create-variavel.dto';

export class UpdateVariavelDto extends OmitType(PartialType(CreateVariavelDto), ['indicador_id'] as const) {}
