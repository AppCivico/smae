import { OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber } from 'class-validator';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreatePainelConteudoDto } from './create-painel-conteudo.dto';

export class UpdatePainelConteudoVisualizacaoDto extends PartialType(OmitType(CreatePainelConteudoDto, [
    'meta_id',
    'mostrar_indicador',
    'painel_id'
])) { }

export class UpdatePainelConteudoDetalheDto {
    @IsBoolean()
    mostrar_indicador?: boolean | null

    @IsNumber()
    id: number

    @IsArray()
    filhos?: UpdatePainelConteudoDetalheDto[] | null
}
export class PainelConteudoIdAndMeta {
    id: number
    meta_id: number
}

export class PainelConteudoUpsertRet {
    created: PainelConteudoIdAndMeta[]
    deleted: PainelConteudoIdAndMeta[]
}
export class PainelConteudoDetalheUpdateRet {
    updated: RecordWithId[]
}