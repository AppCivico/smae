import { PartialType } from '@nestjs/swagger';
import { CreateProjetoTagDto } from './create-tag.dto';

export class ProjetoUpdateTagDto extends PartialType(CreateProjetoTagDto) {}
