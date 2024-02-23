import { PartialType } from '@nestjs/swagger';
import { CreatePartidoDto } from './create-partido.dto';

export class UpdatePartidoDto extends PartialType(CreatePartidoDto) {}
