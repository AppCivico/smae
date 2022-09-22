import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateIniciativaDto } from './create-iniciativa.dto';

export class UpdateIniciativaDto extends PartialType(OmitType(CreateIniciativaDto, ['meta_id'])) { }
