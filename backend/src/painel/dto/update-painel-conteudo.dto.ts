import { ApiHideProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreatePainelConteudoDto } from './create-painel-conteudo.dto';

export class UpdatePainelConteudoVisualizacaoDto extends PartialType(OmitType(CreatePainelConteudoDto, [
    'meta_id',
    'mostrar_indicador',
    'painel_id'
])) { }

export class UpdatePainelConteudoDetalheDto {
    @IsBoolean()
    @IsOptional()
    mostrar_indicador_meta?: boolean | null

    @IsArray()
    @IsOptional()
    detalhes?: UpdatePainelConteudoDetalheRowsDto[] | null
}

export class UpdatePainelConteudoDetalheRowsDto {
    @IsBoolean()
    @IsOptional()
    mostrar_indicador?: boolean | null

    @IsNumber()
    id: number
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
