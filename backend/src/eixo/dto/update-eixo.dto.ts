import { PartialType } from '@nestjs/swagger';
import { CreateEixoDto } from './create-eixo.dto';

export class UpdateEixoDto extends PartialType(CreateEixoDto) {}
