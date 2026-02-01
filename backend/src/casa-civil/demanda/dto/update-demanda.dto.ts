import { PartialType } from '@nestjs/swagger';
import { CreateDemandaDto } from './create-demanda.dto';

export class UpdateDemandaDto extends PartialType(CreateDemandaDto) {}
