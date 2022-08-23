import { PartialType } from '@nestjs/swagger';
import { CreateDepartamentoDto } from './create-departamento.dto';

export class UpdateDepartamentoDto extends PartialType(CreateDepartamentoDto) {}
