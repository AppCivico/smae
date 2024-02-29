import { PartialType } from '@nestjs/swagger';
import { CreateAssessorDto, CreateMandatoRepresentatividadeDto, CreateParlamentarDto } from './create-parlamentar.dto';

export class UpdateParlamentarDto extends PartialType(CreateParlamentarDto) {}

export class UpdateAssessorDto extends PartialType(CreateAssessorDto) {}

export class UpdateRepresentatividadeDto extends PartialType(CreateMandatoRepresentatividadeDto) {}