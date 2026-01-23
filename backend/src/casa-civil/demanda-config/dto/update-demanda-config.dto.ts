import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDemandaConfigDto } from './create-demanda-config.dto';

export class UpdateDemandaConfigDto extends PartialType(OmitType(CreateDemandaConfigDto, ['upload_tokens'])) {}
