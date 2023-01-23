import { PartialType } from '@nestjs/swagger';
import { CreateProjetoDto } from './create-projeto.dto';

export class UpdateProjetoDto extends PartialType(CreateProjetoDto) {}
