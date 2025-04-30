import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { ModuloSistema, StatusAtualizacaoEmLote, TipoAtualizacaoEmLote } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { NumberTransformOrUndef } from '../../auth/transforms/number.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { IdSiglaDescricao } from '../../common/dto/IdSigla.dto';
import { PaginatedWithPagesDto } from '../../common/dto/paginated.dto';
import { IdNomeExibicao } from '../../meta/entities/meta.entity';
import { CreateRunUpdateDto } from 'src/task/run_update/dto/create-run-update.dto';

export class AtualizacaoEmLoteResumoDto {
    id: number;

    @ApiProperty({ enum: TipoAtualizacaoEmLote })
    tipo: TipoAtualizacaoEmLote;

    @ApiProperty({ enum: StatusAtualizacaoEmLote })
    status: StatusAtualizacaoEmLote;

    @ApiProperty({ enum: ModuloSistema })
    modulo_sistema: ModuloSistema;

    n_total: number;
    n_sucesso: number;
    n_erro: number;
    n_ignorado: number;

    @IsDateString()
    criado_em: Date;

    criador: IdNomeExibicao;

    @IsDateString()
    iniciou_em: Date | null;

    @IsDateString()
    terminou_em: Date | null;

    @IsOptional()
    orgao: IdSiglaDescricao | null;
}

export class ListAtualizacaoEmLoteDto extends PaginatedWithPagesDto<AtualizacaoEmLoteResumoDto> {}

export class AtualizacaoEmLoteDetalheDto extends AtualizacaoEmLoteResumoDto {
    @ApiProperty({ description: 'Lista de IDs dos registros que foram alvo da atualização.' })
    target_ids: number[];

    @ApiProperty({ description: 'JSON descrevendo a operação solicitada.' })
    operacao: any;

    @ApiPropertyOptional({ description: 'JSON contendo o log detalhado dos resultados, especialmente falhas.' })
    results_log?: any;

    operacao_processada: OperacaoProcessadaDto | null;
}

export class FilterAtualizacaoEmLoteDto {
    @IsEnum(TipoAtualizacaoEmLote)
    tipo: TipoAtualizacaoEmLote;

    @IsOptional()
    @IsEnum(StatusAtualizacaoEmLote, { each: true })
    @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
    status?: StatusAtualizacaoEmLote[];

    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    criado_por?: number;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransformOrUndef)
    orgao_id?: number;

    @ApiPropertyOptional({ description: 'Data de início da criação (YYYY-MM-DD)', example: '2024-01-01' })
    @IsOptional()
    @IsOnlyDate()
    criado_em_de?: string;

    @ApiPropertyOptional({ description: 'Data de fim da criação (YYYY-MM-DD)', example: '2024-01-31' })
    @IsOptional()
    @IsOnlyDate()
    criado_em_ate?: string;

    /**
     * Token para buscar próxima página
     */
    @ApiPropertyOptional({ description: 'Token para buscar a próxima página de resultados' })
    token_proxima_pagina?: string;

    /**
     * Itens por página, padrão 50
     * @example "50"
     */
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform(NumberTransformOrUndef)
    ipp?: number;
}

export class CreateAtualizacaoEmLoteDto extends OmitType(CreateRunUpdateDto, ['atualizacao_em_lote_id']) {}

export class OperacaoProcessadaItemDto {
    col: string;
    col_label: string;
    tipo_operacao: string;
    valor: any;
    valor_formatado?: string;
}

export class OperacaoProcessadaDto {
    tipo: TipoAtualizacaoEmLote;
    items: OperacaoProcessadaItemDto[];
}
