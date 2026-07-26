import { ReportColumn, ReportRows } from '../../post-process/report-column.decorator';

/**
 * Colunas do CSV **bruto** de `demandas.csv`.
 *
 * A ordem de declaração é a ordem das colunas no arquivo bruto e também a ordem padrão
 * quando nenhum modelo é aplicado. O schema é plano (uma linha por demanda), então nenhum
 * nome precisa do `__` usado nos relatórios aninhados.
 *
 * Regra geral: valores aqui são "compute store" — números como números, datas em ISO
 * (`YYYY-MM-DD`), sem máscara de moeda e sem o hack `="valor"`. Moeda, separador decimal,
 * `dd/mm/aaaa` e o guard de texto do Excel são aplicados na etapa de pós-processamento.
 *
 * `status` e `finalidade` saem com o valor cru do enum do Prisma (`DemandaStatus` /
 * `DemandaFinalidade`), exatamente como o relatório já fazia — não existe hoje tradução
 * humana desses valores e inventá-la aqui mudaria o conteúdo entregue.
 *
 * Todas as colunas de texto levam `excelTextGuard` porque a extração antiga envolvia
 * **todo** campo string em `="..."` (`formatExcelString`); o guard no schema é o que
 * reproduz esse comportamento agora que a extração emite o valor cru.
 */
@ReportRows({
    arquivo: 'demandas.csv',
    fontes: ['Demandas'],
    descricao: 'Uma linha por demanda, com os dados de responsável, projeto, valor e área temática.',
})
export class RelDemandasCsvRow {
    @ReportColumn({ type: 'BIGINT', label: 'ID', format: { raw: true }, customizavel: false })
    id: number;

    /** Valor cru do enum `DemandaStatus` (ex.: `Registrado`), como já era emitido. */
    @ReportColumn({ type: 'VARCHAR', label: 'Status' })
    status: string;

    @ReportColumn({ type: 'DATE', label: 'Data de Registro' })
    data_registro: string | null;

    @ReportColumn({ type: 'DATE', label: 'Data de Publicação' })
    data_publicado: string | null;

    /** Nome de exibição do órgão gestor (`orgao.descricao`). */
    @ReportColumn({ type: 'VARCHAR', label: 'Gestor Municipal', format: { excelTextGuard: true } })
    orgao_gestor: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Unidade Responsável', format: { excelTextGuard: true } })
    unidade_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Responsável', format: { excelTextGuard: true } })
    nome_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Cargo do Responsável', format: { excelTextGuard: true } })
    cargo_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'E-mail do Responsável', format: { excelTextGuard: true } })
    email_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Telefone do Responsável', format: { excelTextGuard: true } })
    telefone_responsavel: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto', format: { excelTextGuard: true } })
    nome_projeto: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Descrição', format: { excelTextGuard: true } })
    descricao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Justificativa', format: { excelTextGuard: true } })
    justificativa: string | null;

    /**
     * Emitido como string na extração para não perder precisão do `Decimal` do Prisma —
     * o DuckDB relê a coluna como `DECIMAL(18,2)` sem passar por `double`.
     */
    @ReportColumn({ type: 'DECIMAL(18,2)', label: 'Valor', format: { currency: 'R$', decimalPlaces: 2 } })
    valor: string | null;

    /** Valor cru do enum `DemandaFinalidade`, como já era emitido. */
    @ReportColumn({ type: 'VARCHAR', label: 'Finalidade' })
    finalidade: string;

    @ReportColumn({ type: 'VARCHAR', label: 'Observação', format: { excelTextGuard: true } })
    observacao: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Área Temática', format: { excelTextGuard: true } })
    area_tematica: string | null;

    /**
     * Nomes das ações vinculadas à demanda, concatenados por `, `. O rótulo está no
     * singular ('Ação') no relatório entregue hoje; mantido byte-a-byte para não mudar
     * o cabeçalho sem decisão de negócio.
     */
    @ReportColumn({ type: 'VARCHAR', label: 'Ação', format: { excelTextGuard: true } })
    acoes: string | null;
}

/**
 * Colunas do CSV bruto de `enderecos.csv`.
 *
 * Arquivo **condicional**: só é emitido quando há ao menos uma referência de
 * geolocalização nas demandas filtradas. O schema, porém, é sempre declarado — do
 * contrário um modelo salvo não teria como referenciar o arquivo.
 */
@ReportRows({
    arquivo: 'enderecos.csv',
    fontes: ['Demandas'],
    descricao: 'Uma linha por endereço/geolocalização vinculada a uma demanda.',
})
export class RelDemandasEnderecosCsvRow {
    /** Chave de conciliação com `demandas.csv`. */
    @ReportColumn({ type: 'BIGINT', label: 'ID da Demanda', format: { raw: true }, customizavel: false })
    demanda_id: number;

    @ReportColumn({ type: 'VARCHAR', label: 'Nome do Projeto', format: { excelTextGuard: true } })
    nome_projeto: string | null;

    /** Precisa do guard: `01234-567` (e principalmente CEPs só-dígitos) viraria número no Excel. */
    @ReportColumn({ type: 'VARCHAR', label: 'CEP', format: { excelTextGuard: true } })
    cep: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Endereço', format: { excelTextGuard: true } })
    endereco: string | null;

    @ReportColumn({ type: 'VARCHAR', label: 'Bairro', format: { excelTextGuard: true } })
    bairro: string | null;

    /** Regiões de nível 3 do georreferenciamento, concatenadas por `, `. */
    @ReportColumn({ type: 'VARCHAR', label: 'Subprefeitura', format: { excelTextGuard: true } })
    subprefeitura: string | null;

    /** Regiões de nível 4 do georreferenciamento, concatenadas por `, `. */
    @ReportColumn({ type: 'VARCHAR', label: 'Distrito', format: { excelTextGuard: true } })
    distrito: string | null;
}
