import { PartialType } from '@nestjs/swagger';
import { CreateDivisaoTecnicaDto } from './create-divisao-tecnica.dto';

export class UpdateDivisaoTecnicaDto extends PartialType(CreateDivisaoTecnicaDto) {}
