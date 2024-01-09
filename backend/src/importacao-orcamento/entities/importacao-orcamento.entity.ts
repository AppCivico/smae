import { IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { IdNomeDto } from 'src/common/dto/IdNome.dto';
import { IdTituloDto } from 'src/common/dto/IdTitulo.dto';
import {
    CreateOrcamentoRealizadoDto,
    CreateOrcamentoRealizadoItemDto,
} from 'src/orcamento-realizado/dto/create-orcamento-realizado.dto';
import { IdNomeExibicaoDto } from '../../common/dto/IdNomeExibicao.dto';

export class InOutArquivoDto {
    token: string;
    nome_original: string;
    tamanho_bytes: number;
    id: number;
}

export class ImportacaoOrcamentoDto {
    id: number;
    arquivo: InOutArquivoDto;
    saida_arquivo: InOutArquivoDto | null;
    pdm: IdNomeDto | null;
    portfolio: IdTituloDto | null;
    criado_por: IdNomeExibicaoDto;
    criado_em: Date;
    processado_em: Date | null;
    processado_errmsg: string | null;
    linhas_importadas: number | null;
    linhas_recusadas: number | null;
}

export class ListImportacaoOrcamentoDto {
    linhas: ImportacaoOrcamentoDto[];
}

export class LinhaCsvInputDto extends IntersectionType(
    PickType(CreateOrcamentoRealizadoDto, [
        'ano_referencia',
        'meta_id',
        'iniciativa_id',
        'atividade_id',
        'processo',
        'nota_empenho',
    ]),
    PartialType(PickType(CreateOrcamentoRealizadoDto, ['dotacao'])),
    PickType(CreateOrcamentoRealizadoItemDto, ['mes', 'valor_empenho', 'valor_liquidado'])
) {
    @IsOptional()
    @IsInt({ message: 'ID do projeot precisa ser um número' })
    projeto_id?: number;

    @IsOptional()
    @IsString({ message: 'código do projeto precisa ser um texto' })
    @Type(() => String) // XLSX fica maluco e manda number se for digitado só um digito
    projeto_codigo?: string;

    @IsOptional()
    @IsString({ message: 'código da meta precisa ser um texto' })
    @Type(() => String) // XLSX fica maluco e manda number se for digitado só um digito
    meta_codigo?: string;

    @IsOptional()
    @IsString({ message: 'código do iniciativa precisa ser um texto' })
    @Type(() => String) // XLSX fica maluco e manda number se for digitado só um digito
    iniciativa_codigo?: string;

    @IsOptional()
    @IsString({ message: 'código do atividiade precisa ser um texto' })
    @Type(() => String) // XLSX fica maluco e manda number se for digitado só um digito
    atividade_codigo?: string;
}
