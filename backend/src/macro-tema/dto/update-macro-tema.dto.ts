import { PartialType } from '@nestjs/swagger';
import { CreateEixoDto } from './create-macro-tema.dto';

export class UpdateEixoDto extends PartialType(CreateEixoDto) {}
