import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, ValidateIf, ValidateNested } from 'class-validator';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
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
    @ValidateNested()
    @Type(() => UpdatePainelConteudoDetalheRowsDto)
    @ValidateIf((object, value) => value !== null)
    detalhes?: UpdatePainelConteudoDetalheRowsDto[] | null
}

export class UpdatePainelConteudoDetalheRowsDto {
    @IsBoolean()
    mostrar_indicador: boolean

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
