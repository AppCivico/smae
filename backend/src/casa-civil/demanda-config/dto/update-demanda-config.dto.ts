import { PartialType } from '@nestjs/swagger';
import { CreateDemandaConfigDto } from './create-demanda-config.dto';

export class UpdateDemandaConfigDto extends PartialType(CreateDemandaConfigDto) {}
