import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTagDto } from './create-tag.dto';

export class UpdateTagDto extends OmitType(PartialType(CreateTagDto), ['pdm_id']) {}
