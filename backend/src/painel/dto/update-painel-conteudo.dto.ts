import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePainelConteudoDto } from './create-painel-conteudo.dto';

export class UpdatePainelConteudoDto extends PartialType(OmitType(CreatePainelConteudoDto, [
    'meta_id',
    'mostrar_indicador',
    'painel_id'
])) { }

export class PainelConteudoIdAndMeta {
    id: number
    meta_id: number
}

export class PainelConteudoUpsertRet {
    created: PainelConteudoIdAndMeta[]
    deleted: PainelConteudoIdAndMeta[]
}