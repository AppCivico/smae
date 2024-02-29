import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAssessorDto, CreateMandatoDto, CreateMandatoRepresentatividadeDto, CreateParlamentarDto } from './create-parlamentar.dto';

export class UpdateParlamentarDto extends PartialType(CreateParlamentarDto) {}

export class UpdateAssessorDto extends PartialType(CreateAssessorDto) {}

export class UpdateMandatoDto extends PartialType(OmitType(CreateMandatoDto, ['eleicao_id'])) {}

export class UpdateRepresentatividadeDto extends PartialType(CreateMandatoRepresentatividadeDto) {}