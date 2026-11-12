import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas dos CSVs **brutos** da fonte `PSMonitoramentoMensal` (usada tanto pelo módulo
 * Plano Setorial quanto pelo Programa de Metas).
 *
 * A ordem de declaração de cada classe é a ordem das colunas no arquivo bruto e também a
 * ordem padrão quando nenhum modelo é aplicado. Todos os schemas são planos (uma linha por
 * registro), então nenhum nome precisa do `__` usado nos relatórios aninhados.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD` para `DATE`, `YYYY-MM-DDTHH:MM:SS.sssZ` para `TIMESTAMP`), `null` para
 * ausência de valor, sem máscara e sem o hack `="valor"`. Separador decimal, `dd/mm/aaaa`
 * e rótulos são aplicados na etapa de pós-processamento.
 *
 * Os rótulos de `monitoramento-mensal-variaveis-ps.csv` reproduzem **exatamente** os cabeçalhos que o relatório já emitia,
 * incluindo os que estão sem acento ('Serie', 'Data de Referencia', 'Analise Qualitativa
 * ...'): são cabeçalhos já entregues ao usuário e corrigi-los é decisão de negócio.
 */

/**
 * `monitoramento-mensal-variaveis-ps.csv` — uma linha por série de variável coletada no
 * mês/ano do filtro.
 */
@ReportRows({
    arquivo: 'monitoramento-mensal-variaveis-ps.csv',
    fontes: ['PSMonitoramentoMensal'],
    descricao: 'Uma linha por série de variável (Previsto/Realizado/…) do ciclo mensal filtrado.',
})
export class RelPsMonitoramentoMensalVariaveisCsvRow {
    @ReportColumn({ type: 'VARCHAR', label: 'Código do Indicador' })
    codigo_indicador: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título do Indicador' })
    titulo_indicador: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Indicador', format: { raw: true } })
    indicador_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Variável' })
    codigo_variavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Variável' })
    titulo_variavel: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Variável', format: { raw: true } })
    variavel_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Município' })
    municipio: string | null;

    /**
     * Rótulo 'Código do Município' embora o valor seja o `id` da região de nível 1 — é o
     * cabeçalho que o relatório sempre entregou.
     *
     * IDs de região são descritivos (acompanham o nome ao lado), não chave de conciliação:
     * seguem customizáveis, ao contrário de `indicador_id`/`variavel_id`.
     */
    @ReportColumn({ type: 'BIGINT', label: 'Código do Município', format: { raw: true } })
    municipio_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Região' })
    regiao: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Região', format: { raw: true } })
    regiao_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Subprefeitura' })
    subprefeitura: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Subprefeitura', format: { raw: true } })
    subprefeitura_id: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Distrito' })
    distrito: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID do Distrito', format: { raw: true } })
    distrito_id: number | null;

    /** Enum `Serie` do banco (Previsto/PrevistoAcumulado/Realizado/RealizadoAcumulado). */
    // Rótulo sem acento ('Serie') igual ao original — ver nota no topo do arquivo.
    @ReportColumn({ type: 'VARCHAR', label: 'Serie' })
    serie: string;

    // Rótulo sem acento ('Referencia') igual ao original — ver nota no topo do arquivo.
    @ReportColumn({ type: 'DATE', label: 'Data de Referencia' })
    data_referencia: string | null;

    /**
     * `round(serie_variavel.valor_nominal, variavel.casas_decimais)` — `numeric` no banco,
     * que o Prisma devolve como `Decimal`. Sai como **string** na extração para não passar
     * por `double`; o DuckDB relê como `DECIMAL(18,4)`, então a conversão é exata.
     *
     * `decimalPlaces: 4` porque a casa decimal é por variável (`casas_decimais`) e uma
     * coluna de CSV só tem uma formatação: 4 é o teto que o tipo declarado comporta.
     * Valores com menos casas ganham zeros à direita — nada é arredondado aqui, o
     * arredondamento de negócio já aconteceu no `round()` do SQL.
     */
    @ReportColumn({ type: 'DECIMAL(18,4)', label: 'Valor Nominal', format: { decimalPlaces: 4 } })
    valor_nominal: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Valor Categórica' })
    valor_categorica: string | null;

    /**
     * Booleano que sairia como `Sim`/`Não` — tradução de domínio, por isso `VARCHAR`.
     *
     * ATENÇÃO: esta coluna **sempre sai vazia**, e isso não é um erro de nome/seleção que
     * dê para consertar aqui: o conceito de "prévia" não existe no nível de variável.
     *
     * Levantamento feito no modelo de dados:
     * - `eh_previa` existe **apenas** em `SerieIndicador` (`serie_indicador.eh_previa`,
     *   `prisma/schema.prisma`), com o sentido "este valor de *indicador* foi preenchido a
     *   partir de uma `Serie = 'Previa'`" (ver o fallback em
     *   `prisma/manual-copy/0021-monta_serie_indicador.pgsql`).
     * - `SerieVariavel` (`serie_variavel`), que é a tabela desta consulta, não tem o campo —
     *   e a função `valor_variavel_em_json` (`prisma/manual-copy/0041-valor_em.pgsql`) não
     *   emite `eh_previa`, ao contrário da irmã `valor_indicador_em_json`. O próprio DTO
     *   registra isso: `SerieValorNomimal.eh_previa` em `src/variavel/entities/variavel.entity.ts`
     *   está anotado como "apenas em indicadores no momento".
     * - O `IndicadoresService` obtém o campo do `valor_json` produzido por
     *   `valor_indicador_em_json`, e só no arquivo `indicadores.csv` (nível indicador);
     *   o `regioes.csv` (nível variável) do mesmo relatório também não tem a coluna.
     *
     * Preencher exigiria escolher entre candidatos com semânticas diferentes (o `eh_previa`
     * do indicador da linha, replicado em todas as variáveis dele; ou `serie_variavel.conferida`
     * lido como "valor ainda preliminar"), o que é decisão de produto — ver o PR.
     */
    @ReportColumn({
        type: 'VARCHAR',
        label: 'É Prévia',
        descricao:
            'Sempre vazia nesta fonte: `eh_previa` só existe em `serie_indicador` (nível indicador), ' +
            'e esta consulta lê `serie_variavel`. Mantida pelo layout histórico.',
    })
    eh_previa: string | null;

    /** `serie_variavel.atualizado_em` (timestamptz, gravado em UTC). */
    @ReportColumn({ type: 'TIMESTAMP', label: 'Data da Coleta' })
    data_preenchimento: string | null;

    // Os três rótulos abaixo estão sem acento em 'Analise' no relatório original.
    @ReportColumn({ type: 'VARCHAR', label: 'Analise Qualitativa Coleta' })
    analise_qualitativa_coleta: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Analise Qualitativa Conferidor' })
    analise_qualitativa_aprovador: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Analise Qualitativa Liberador' })
    analise_qualitativa_liberador: string | null;
}

/**
 * `monitoramento-mensal-fases-ps.csv`: uma linha por (meta, fase, bloco); fase sem bloco de texto (tags) sai em uma linha.
 */
@ReportRows({
    arquivo: 'monitoramento-mensal-fases-ps.csv',
    fontes: ['PSMonitoramentoMensal'],
    descricao:
        'Uma linha por meta, fase e bloco do monitoramento do ciclo, com a última revisão de cada fase. ' +
        'Fases sem blocos de texto (fases de tags) saem em uma linha só.',
})
export class RelPsMonitoramentoMensalFasesCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID da Meta', format: { raw: true } })
    meta_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Código da Meta' })
    meta_codigo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Título da Meta' })
    meta_titulo: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data do Ciclo' })
    data_ciclo: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Ciclo Fechado' })
    ciclo_fechado: string;

    @ReportColumn({ type: 'INTEGER', label: 'Ordem da Fase', format: { raw: true } })
    fase_ordem: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Fase' })
    fase_rotulo: string;

    @ReportColumn({ type: 'INTEGER', label: 'Ordem do Bloco', format: { raw: true } })
    bloco_ordem: number | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Bloco' })
    bloco_rotulo: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Conteúdo', descricao: 'Conteúdo do bloco convertido de HTML para texto.' })
    conteudo: string | null;

    @ReportColumn({ type: 'BIGINT', label: 'ID da Revisão', format: { raw: true } })
    revisao_id: number | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Referência' })
    referencia_data: string | null;

    @ReportColumn({ type: 'TIMESTAMP', label: 'Criado Em' })
    criado_em: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Criador' })
    criador: string | null;

    @ReportColumn({ type: 'TIMESTAMP', label: 'Reaberto Em' })
    reaberto_em: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Tags', descricao: 'Descrições separadas por "; ".' })
    tags: string | null;

    @ReportColumn({ type: 'INTEGER', label: 'Quantidade de Documentos', format: { raw: true } })
    documentos_qtde: number;
}
