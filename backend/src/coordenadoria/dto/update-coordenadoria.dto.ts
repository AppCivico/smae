import { PartialType } from '@nestjs/swagger';
import { CreateCoordenadoriaDto } from './create-coordenadoria.dto';

export class UpdateCoordenadoriaDto extends PartialType(CreateCoordenadoriaDto) {}
