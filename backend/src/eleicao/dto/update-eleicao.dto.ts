import { PartialType } from '@nestjs/swagger';
import { CreateEleicaoDto } from './create-eleicao.dto';

export class UpdateEleicaoDto extends PartialType(CreateEleicaoDto) {}
