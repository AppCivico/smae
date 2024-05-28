import { PartialType } from '@nestjs/swagger';
import { CreateObjetivoEstrategicoDto } from './create-tema.dto';

export class UpdateObjetivoEstrategicoDto extends PartialType(CreateObjetivoEstrategicoDto) {}
