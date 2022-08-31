import { PartialType } from '@nestjs/swagger';
import { CreateObjetivoEstrategicoDto } from './create-objetivo-estrategico.dto';

export class UpdateObjetivoEstrategicoDto extends PartialType(CreateObjetivoEstrategicoDto) {}
