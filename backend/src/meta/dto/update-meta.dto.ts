import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMetaDto } from './create-meta.dto';

export class UpdateMetaDto extends PartialType(OmitType(CreateMetaDto, ['pdm_id'])) {}
