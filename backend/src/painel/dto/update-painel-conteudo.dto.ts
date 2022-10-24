import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePainelConteudoDto } from './create-painel-conteudo.dto';

export class UpdatePainelConteudoDto extends PartialType(OmitType(CreatePainelConteudoDto, [
])) { }