import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePainelConteudoDto } from './create-painel-conteudo.dto';

export class UpdatePainelConteudoDto extends PartialType(OmitType(CreatePainelConteudoDto, [
    'meta_id',
    'mostrar_indicador',
    'painel_id'
])) { }