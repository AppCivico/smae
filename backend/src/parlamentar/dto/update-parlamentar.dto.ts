import { PartialType } from '@nestjs/swagger';
import { CreateAssessorDto, CreateParlamentarDto } from './create-parlamentar.dto';

export class UpdateParlamentarDto extends PartialType(CreateParlamentarDto) {}

export class UpdateAssessorDto extends PartialType(CreateAssessorDto) {}