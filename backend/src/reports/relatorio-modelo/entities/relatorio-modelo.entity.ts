import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonteRelatorio, ModuloSistema } from '@prisma/client';
import { RelatorioModeloConfigDto } from '../../post-process/dto/relatorio-modelo.dto';
import { VISIBILIDADE_TIPOS, VisibilidadeTipo } from '../../relatorios/helpers/visibilidade-templates';
import { ReportColumnFormat, ReportColumnType } from '../../post-process/report-schema';

export class RelatorioModeloCriadorDto {
    @ApiProperty()
    nome_exibicao: string;
}

/**
 * Item da listagem — deliberadamente sem a `config`, que é o payload grande. A tela de
 * "novo relatório" só precisa de id/nome/descricao para montar o seletor de modelo; quem
 * abre o editor busca o detalhe em `GET /relatorio-modelo/:id`.
 */
export class RelatorioModeloItemDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nome: string;

    @ApiProperty({ nullable: true, type: String })
    descricao: string | null;

    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    fonte: FonteRelatorio;

    @ApiProperty({ enum: ModuloSistema, enumName: 'ModuloSistema' })
    sistema: ModuloSistema;

    @ApiProperty({ enum: VISIBILIDADE_TIPOS, enumName: 'VisibilidadeTipo', nullable: true })
    visibilidade_tipo: VisibilidadeTipo | null;

    /** Rótulo pronto para exibição (ex.: badge na listagem). */
    @ApiProperty({ nullable: true, type: String })
    visibilidade_tipo_label: string | null;

    @ApiProperty()
    criado_em: Date;

    @ApiProperty({ type: RelatorioModeloCriadorDto })
    criador: RelatorioModeloCriadorDto;

    @ApiProperty()
    pode_editar: boolean;

    @ApiProperty()
    pode_remover: boolean;
}

export class RelatorioModeloDetailDto extends RelatorioModeloItemDto {
    @ApiProperty({ type: RelatorioModeloConfigDto })
    config: RelatorioModeloConfigDto;
}

export class ListRelatorioModeloDto {
    @ApiProperty({ type: RelatorioModeloItemDto, isArray: true })
    linhas: RelatorioModeloItemDto[];
}

/** Uma coluna disponível para customização, derivada dos decoradores `@ReportColumn`. */
export class RelatorioColunaDisponivelDto {
    /** Nome técnico da coluna — é o valor a enviar em `config.arquivos[].colunas[].coluna`. */
    @ApiProperty()
    name: string;

    /** Cabeçalho padrão. Pode ser sobrescrito pelo modelo (quando `customizavel`). */
    @ApiProperty()
    label: string;

    /** Tipo DuckDB da coluna (VARCHAR, DATE, DECIMAL(18,2), ...). */
    @ApiProperty()
    type: ReportColumnType;

    /** Quando `false`, a coluna não pode ser removida nem renomeada por um modelo. */
    @ApiProperty()
    customizavel: boolean;

    @ApiProperty({ nullable: true, type: String })
    descricao: string | null;

    /** Regras de apresentação padrão (casas decimais, moeda, formato de data...). */
    @ApiPropertyOptional({ type: ReportColumnFormat, nullable: true })
    format: ReportColumnFormat | null;
}

export class RelatorioArquivoColunasDto {
    /** Nome do arquivo gerado (ex.: 'transferencias.csv'). Chave de `config.arquivos[].arquivo`. */
    @ApiProperty()
    arquivo: string;

    @ApiProperty({ nullable: true, type: String })
    descricao: string | null;

    @ApiProperty({ type: RelatorioColunaDisponivelDto, isArray: true })
    colunas: RelatorioColunaDisponivelDto[];
}

export class ListRelatorioColunasDto {
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    fonte: FonteRelatorio;

    /** Arquivos que a fonte produz, na ordem de registro, com as colunas de cada um. */
    @ApiProperty({ type: RelatorioArquivoColunasDto, isArray: true })
    arquivos: RelatorioArquivoColunasDto[];
}
