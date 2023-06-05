import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEtapaDto } from './create-etapa.dto';
import { IsNumber, IsOptional, Max, Min, ValidateIf } from 'class-validator';

export class UpdateEtapaDto extends PartialType(OmitType(CreateEtapaDto, ['etapa_pai_id', 'ordem'])) {}
