import { PartialType } from '@nestjs/swagger';
import { CreateProjetoTagDto } from './create-tag.dto';

export class UpdateTagDto extends PartialType(CreateProjetoTagDto) {}
