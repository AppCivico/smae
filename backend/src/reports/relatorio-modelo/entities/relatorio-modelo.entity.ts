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

    /** Cabeçalho padrão. Pode ser sobrescrito pelo modelo. */
    @ApiProperty()
    label: string;

    /** Tipo DuckDB da coluna (VARCHAR, DATE, DECIMAL(18,2), ...). */
    @ApiProperty()
    type: ReportColumnType;

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

    /**
     * `false` (padrão): união das variantes da fonte, com os rótulos padrão. **É a lista para
     * montar um modelo** — ele é criado antes de se saber os parâmetros da execução, e o
     * recorte para o que existe em cada execução acontece no pós-processamento.
     *
     * `true`: pré-visualização de uma combinação de parâmetros — mesmas colunas e mesmos
     * rótulos que aquela execução vai produzir.
     */
    @ApiProperty()
    parametrizado: boolean;

    /** Arquivos que a fonte produz, na ordem de registro, com as colunas de cada um. */
    @ApiProperty({ type: RelatorioArquivoColunasDto, isArray: true })
    arquivos: RelatorioArquivoColunasDto[];
}

/** Referência do modelo que o schema consultado não tem. */
export class ModeloReferenciaIgnoradaDto {
    @ApiProperty()
    arquivo: string;

    @ApiProperty({ enum: ['colunas', 'filtros', 'order_by'] })
    onde: 'colunas' | 'filtros' | 'order_by';

    @ApiProperty()
    coluna: string;
}

/**
 * O que um modelo **entrega**: por arquivo, as colunas na ordem e com os rótulos que o modelo
 * define — já recortadas contra o schema, exatamente como o pós-processamento faz na execução
 * (mesma função, `resolverColunasDoModelo`).
 *
 * É a resposta para quem vai *rodar* o relatório ("o que este modelo vai me dar?"), enquanto
 * `GET /relatorio-modelo/colunas` responde para quem vai *montar* um ("o que posso escolher?").
 * Por isso a visibilidade aqui é a de leitura do modelo, não a de gerenciá-lo.
 */
export class RelatorioModeloColunasDto {
    @ApiProperty()
    modelo_id: number;

    @ApiProperty()
    modelo_nome: string;

    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    fonte: FonteRelatorio;

    /**
     * `false`: recorte contra a união das variantes da fonte — é o superconjunto do que sairá.
     *
     * `true`: recorte contra o schema de uma combinação de parâmetros, ou seja, exatamente as
     * colunas e os rótulos que aquela execução vai produzir.
     */
    @ApiProperty()
    parametrizado: boolean;

    /** Arquivos que o modelo entrega, cada um com as colunas finais na ordem final. */
    @ApiProperty({ type: RelatorioArquivoColunasDto, isArray: true })
    arquivos: RelatorioArquivoColunasDto[];

    /** Arquivos que o modelo pediu para não entregar (`incluir: false`). */
    @ApiProperty({ type: String, isArray: true })
    arquivos_descartados: string[];

    /**
     * Referências que a fonte **não declara mais** — modelo salvo antes de a coluna sair do
     * relatório. Diferente de `colunas_recortadas`: aqui é deriva de schema, e merece correção
     * do modelo.
     */
    @ApiProperty({ type: ModeloReferenciaIgnoradaDto, isArray: true })
    referencias_ignoradas: ModeloReferenciaIgnoradaDto[];

    /**
     * Referências recortadas por não se aplicarem a estes parâmetros (meta/iniciativa/atividade
     * num orçamento de projeto, `mes`/`ano` fora do Analítico). Situação normal — o modelo cobre
     * a união das variantes —, listada para responder "por que a coluna que escolhi não veio?".
     *
     * Só é preenchida com `parametrizado: true`: sem parâmetros o recorte é contra a própria
     * união, então não há o que recortar.
     */
    @ApiProperty({ type: ModeloReferenciaIgnoradaDto, isArray: true })
    colunas_recortadas: ModeloReferenciaIgnoradaDto[];
}

/**
 * Fontes que aceitam modelo no sistema da requisição, já com as colunas de cada uma — resolve o
 * ovo-e-galinha do `GET /colunas`, que exige `fonte` mas não tinha de onde a tela tirar a lista de
 * fontes. Mesmo formato de item do `/colunas`, então a tela pode indexar por `fonte` e não precisa
 * de uma segunda chamada por fonte escolhida.
 */
export class ListRelatorioFontesDto {
    @ApiProperty({ type: ListRelatorioColunasDto, isArray: true })
    linhas: ListRelatorioColunasDto[];
}
