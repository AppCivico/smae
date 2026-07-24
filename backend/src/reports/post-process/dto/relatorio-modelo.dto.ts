import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';

export enum RelatorioModeloFiltroOp {
    eq = 'eq',
    ne = 'ne',
    gt = 'gt',
    gte = 'gte',
    lt = 'lt',
    lte = 'lte',
    contains = 'contains',
    starts_with = 'starts_with',
    in = 'in',
    is_null = 'is_null',
    is_not_null = 'is_not_null',
}

export enum RelatorioModeloDirecao {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class RelatorioModeloColunaDto {
    /** Nome da coluna, precisa existir no schema do arquivo. */
    @IsString()
    @MaxLength(200)
    coluna: string;

    /** Sobrescreve o label declarado no schema. */
    @IsOptional()
    @IsString()
    @MaxLength(200)
    label?: string;

    /** Casas decimais (sobrescreve o schema). */
    @IsOptional()
    @IsInt()
    decimais?: number;

    /** Formato strftime (sobrescreve o schema). */
    @IsOptional()
    @IsString()
    @MaxLength(50)
    formato_data?: string;
}

/**
 * Filtro estruturado — **nunca** SQL livre.
 *
 * O DuckDB do pós-processamento pode ler arquivos locais (`read_csv`) e, com httpfs,
 * fazer requisições de rede. Aceitar fragmentos de WHERE vindos do usuário abriria uma
 * via de leitura/exfiltração arbitrária. Por isso o filtro é declarativo e o SQL é
 * montado no servidor, com identificadores validados contra o schema e literais
 * escapados por tipo.
 */
export class RelatorioModeloFiltroDto {
    @IsString()
    @MaxLength(200)
    coluna: string;

    @ApiProperty({ enum: RelatorioModeloFiltroOp, enumName: 'RelatorioModeloFiltroOp' })
    @IsEnum(RelatorioModeloFiltroOp)
    op: RelatorioModeloFiltroOp;

    /** Valor único, para os operadores escalares. */
    @IsOptional()
    valor?: string | number | boolean | null;

    /** Lista de valores, para o operador `in`. */
    @IsOptional()
    @IsArray()
    valores?: (string | number)[];
}

export class RelatorioModeloOrdemDto {
    @IsString()
    @MaxLength(200)
    coluna: string;

    @ApiProperty({ enum: RelatorioModeloDirecao, enumName: 'RelatorioModeloDirecao' })
    @IsEnum(RelatorioModeloDirecao)
    direcao: RelatorioModeloDirecao;
}

export class RelatorioModeloArquivoDto {
    /** Arquivo alvo, conforme `ReportFileSchema.arquivo` (ex.: 'transferencias.csv'). */
    @IsString()
    @MaxLength(200)
    arquivo: string;

    /**
     * Colunas a exportar, na ordem desejada. Ausente/vazio = todas as colunas do
     * schema, na ordem declarada.
     */
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RelatorioModeloColunaDto)
    colunas?: RelatorioModeloColunaDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RelatorioModeloFiltroDto)
    filtros?: RelatorioModeloFiltroDto[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RelatorioModeloOrdemDto)
    order_by?: RelatorioModeloOrdemDto[];
}

export class RelatorioModeloConfigDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RelatorioModeloArquivoDto)
    arquivos: RelatorioModeloArquivoDto[];

    /**
     * Gera o XLSX com tipos nativos (DECIMAL/DATE) em vez das strings formatadas do CSV.
     * Default `true`: o XLSX fica somável/ordenável no Excel, enquanto o CSV mantém a
     * apresentação pt-BR.
     */
    @IsOptional()
    @IsBoolean()
    xlsx_tipado?: boolean;
}
