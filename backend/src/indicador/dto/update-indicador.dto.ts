import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateIndicadorDto } from './create-indicador.dto';

export class UpdateIndicadorDto extends OmitType(PartialType(CreateIndicadorDto), ['meta_id'] as const) { }
