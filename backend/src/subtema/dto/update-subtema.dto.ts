import { PartialType } from '@nestjs/swagger';
import { CreateSubTemaDto } from './create-subtema.dto';

export class UpdateSubTemaDto extends PartialType(CreateSubTemaDto) {}
