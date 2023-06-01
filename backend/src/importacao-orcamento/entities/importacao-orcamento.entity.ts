import { IntersectionType, PickType } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString } from "class-validator"
import { IdNomeDto } from "src/common/dto/IdNome.dto"
import { IdTituloDto } from "src/common/dto/IdTitulo.dto"
import { CreateOrcamentoRealizadoDto, CreateOrcamentoRealizadoItemDto } from "src/orcamento-realizado/dto/create-orcamento-realizado.dto"
import { IdNomeExibicao } from "src/variavel/entities/variavel.entity"

export class InOutArquivoDto {
    token: string
    tamanho_bytes: number
    id: number
}

export class ImportacaoOrcamentoDto {
    id: number
    arquivo: InOutArquivoDto
    saida_arquivo: InOutArquivoDto | null
    pdm: IdNomeDto | null
    portfolio: IdTituloDto | null
    criado_por: IdNomeExibicao | null
    criado_em: Date
    processado_em: Date | null
    processado_errmsg: string | null
    linhas_importadas: number | null
}

export class ListImportacaoOrcamentoDto {
    linhas: ImportacaoOrcamentoDto[]
}

export class LinhaCsvInputDto extends IntersectionType(
    PickType(CreateOrcamentoRealizadoDto,
        [
            'dotacao',
            'ano_referencia',
            'meta_id',
            'iniciativa_id',
            'atividade_id',
            'processo',
            'nota_empenho'
        ]
    ),
    PickType(CreateOrcamentoRealizadoItemDto,
        [
            'mes',
            'valor_empenho',
            'valor_liquidado',
        ]
    )
) {
    @IsOptional()
    @IsInt()
    projeto_id?: string

    @IsOptional()
    @IsString()
    projeto_codigo?: string

    @IsOptional()
    @IsString()
    meta_codigo?: string

    @IsOptional()
    @IsString()
    iniciativa_codigo?: string

    @IsOptional()
    @IsString()
    atividade_codigo?: string
}