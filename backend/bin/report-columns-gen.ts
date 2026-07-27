/**
 * Gerador da documentação de colunas dos relatórios (CSV bruto).
 *
 * Lê o registro alimentado pelos decoradores `@ReportRows` / `@ReportColumn`
 * (src/reports/post-process/report-column.decorator.ts) e renderiza:
 *
 *   - docs/report-columns.md               — índice: um arquivo de relatório por linha
 *   - docs/report-columns/<arquivo>.md     — uma página por arquivo, com a tabela
 *                                            `Coluna | Tipo | Rótulo | Customizável |
 *                                             Formatação | Descrição`
 *
 * O registro só é preenchido como **efeito colateral do import** das classes de
 * linha. Em vez de manter uma lista de imports explícita (que envelhece calada e
 * gera doc incompleta a cada nova entidade), a descoberta é feita varrendo
 * `src/reports/**\/entities/*.ts` e importando apenas os arquivos que citam
 * `@ReportRows`. É a opção mais robusta aqui: o repositório já concentra as
 * classes de linha nas pastas `entities/`, novas entidades entram na doc sem
 * tocar neste script, e o filtro por conteúdo evita importar dezenas de DTOs sem
 * relação (que puxariam módulos pesados sem necessidade).
 *
 * O app Nest **não** é inicializado — a doc não depende de banco.
 *
 * Usage:
 *   npm run docs:report-columns              — escreve os arquivos em docs/
 *   npm run docs:report-columns -- --stdout  — imprime na saída padrão
 *   npm run docs:report-columns -- <arq.ts>  — importa módulos extras (testes locais)
 *
 * `-r tsconfig-paths/register` é necessário: as entidades usam os imports absolutos
 * `src/...` habilitados pelo `baseUrl` do tsconfig.
 */
import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import {
    getReportRowColumns,
    getReportRowsOptions,
    listReportRowClasses,
    type ReportRowClass,
} from '../src/reports/post-process/report-column.decorator';
import type { ReportColumnFormat } from '../src/reports/post-process/report-schema';

const SRC_REPORTS = path.resolve(__dirname, '../src/reports');
const INDEX_FILE = path.resolve(__dirname, '../docs/report-columns.md');
const FILES_DIR = path.resolve(__dirname, '../docs/report-columns');

// ---------------------------------------------------------------------------
// Descoberta / carregamento das classes decoradas
// ---------------------------------------------------------------------------

/** Todos os `entities/*.ts` sob src/reports (sem .d.ts / .spec.ts). */
function entityFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...entityFiles(full));
        } else if (
            path.basename(dir) === 'entities' &&
            entry.name.endsWith('.ts') &&
            !entry.name.endsWith('.d.ts') &&
            !entry.name.endsWith('.spec.ts')
        ) {
            out.push(full);
        }
    }
    return out;
}

/** Importa os arquivos que citam `@ReportRows`, populando o registro global. */
function carregarClasses(extras: string[]): void {
    const candidatos = entityFiles(SRC_REPORTS).filter((f) =>
        fs.readFileSync(f, 'utf8').includes('@ReportRows')
    );

    for (const file of [...candidatos, ...extras.map((e) => path.resolve(process.cwd(), e))]) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require(file);
    }
}

// ---------------------------------------------------------------------------
// Helpers de renderização
// ---------------------------------------------------------------------------

/**
 * Extrai o bloco JSDoc imediatamente acima da declaração `class` no arquivo-fonte
 * (as notas de projeto que o time escreve ali), para dar contexto na página do
 * arquivo. Retorna '' quando não há comentário.
 */
function classComment(cls: ReportRowClass): string {
    const file = arquivoFonte(cls);
    if (!file) return '';
    const src = fs.readFileSync(file, 'utf8');
    const classIdx = src.search(new RegExp(`class\\s+${cls.name}\\b`));
    if (classIdx < 0) return '';
    // Último bloco /** ... */ antes da classe (os decoradores podem ficar no meio).
    const blocks = src.slice(0, classIdx).match(/\/\*\*[\s\S]*?\*\//g);
    if (!blocks?.length) return '';
    return blocks[blocks.length - 1]
        .replace(/^\/\*\*\s?/, '')
        .replace(/\s*\*\/$/, '')
        .split('\n')
        .map((line) => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
}

/** Arquivo-fonte onde a classe está declarada (procura pelo nome nos candidatos). */
function arquivoFonte(cls: ReportRowClass): string | undefined {
    for (const file of entityFiles(SRC_REPORTS)) {
        const src = fs.readFileSync(file, 'utf8');
        if (new RegExp(`class\\s+${cls.name}\\b`).test(src)) return file;
    }
    return undefined;
}

const STRFTIME_HUMANO: [RegExp, string][] = [
    [/%Y/g, 'aaaa'],
    [/%y/g, 'aa'],
    [/%m/g, 'mm'],
    [/%d/g, 'dd'],
    [/%H/g, 'hh'],
    [/%M/g, 'mi'],
    [/%S/g, 'ss'],
];

/** `%d/%m/%Y` -> `dd/mm/aaaa`. Formatos desconhecidos saem como estão. */
function humanizarData(fmt: string): string {
    return STRFTIME_HUMANO.reduce((acc, [re, sub]) => acc.replace(re, sub), fmt);
}

/** Renderiza o `ReportColumnFormat` de forma compacta para a tabela. */
function formatoCompacto(format?: ReportColumnFormat): string {
    if (!format) return '—';
    const partes: string[] = [];
    if (format.currency) partes.push(format.currency);
    if (format.decimalPlaces !== undefined) {
        partes.push(`${format.decimalPlaces} ${format.decimalPlaces === 1 ? 'casa' : 'casas'}`);
    }
    if (format.unit) partes.push(`unidade \`${format.unit}\``);
    if (format.dateFormat) partes.push(humanizarData(format.dateFormat));
    if (format.raw) partes.push('sem formatação');
    if (format.excelTextGuard) partes.push('guard Excel');
    return partes.length ? partes.join(', ') : '—';
}

/** Escapa o que quebraria uma célula de tabela markdown. */
function celula(valor: string): string {
    return valor.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

/** `transferencias.csv` -> `transferencias-csv` (nome de arquivo/anchor seguro). */
function slug(arquivo: string): string {
    return arquivo
        .replace(/[^A-Za-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

// ---------------------------------------------------------------------------
// Agrupamento por arquivo
// ---------------------------------------------------------------------------

type Grupo = {
    arquivo: string;
    fontes: string[];
    descricoes: string[];
    classes: ReportRowClass[];
};

function agrupar(classes: ReportRowClass[]): Grupo[] {
    const grupos = new Map<string, Grupo>();
    for (const cls of classes) {
        const opts = getReportRowsOptions(cls);
        if (!opts) continue;
        const g = grupos.get(opts.arquivo) ?? {
            arquivo: opts.arquivo,
            fontes: [],
            descricoes: [],
            classes: [],
        };
        for (const f of opts.fontes ?? []) if (!g.fontes.includes(f)) g.fontes.push(f);
        if (opts.descricao && !g.descricoes.includes(opts.descricao)) g.descricoes.push(opts.descricao);
        g.classes.push(cls);
        grupos.set(opts.arquivo, g);
    }
    return [...grupos.values()].sort((a, b) => a.arquivo.localeCompare(b.arquivo));
}

function totalColunas(g: Grupo): number {
    const nomes = new Set<string>();
    for (const cls of g.classes) for (const c of getReportRowColumns(cls)) nomes.add(c.propriedade);
    return nomes.size;
}

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

function tabelaColunas(cls: ReportRowClass): string[] {
    const colunas = getReportRowColumns(cls);
    if (!colunas.length) return ['_Nenhuma coluna declarada._'];

    return [
        '| Coluna | Tipo | Rótulo | Customizável | Formatação | Descrição |',
        '| --- | --- | --- | --- | --- | --- |',
        ...colunas.map(({ propriedade, options }) => {
            const cols = [
                `\`${propriedade}\``,
                `\`${options.type}\``,
                celula(options.label ?? ''),
                options.customizavel === false ? 'não' : 'sim',
                formatoCompacto(options.format),
                celula(options.descricao ?? '') || '—',
            ];
            return `| ${cols.join(' | ')} |`;
        }),
    ];
}

function paginaArquivo(g: Grupo): string {
    const linhas: string[] = [`# ${g.arquivo}`, ''];

    if (g.descricoes.length) linhas.push(...g.descricoes, '');

    linhas.push(
        `Fontes que produzem este arquivo: ${
            g.fontes.length ? g.fontes.map((f) => `\`${f}\``).join(', ') : '_nenhuma declarada_'
        }`,
        '',
        `${totalColunas(g)} colunas.`,
        ''
    );

    for (const cls of g.classes) {
        if (g.classes.length > 1) linhas.push(`## \`${cls.name}\``, '');
        else linhas.push(`Classe de linha: \`${cls.name}\``, '');

        const comment = classComment(cls);
        if (comment) linhas.push(comment, '');

        linhas.push(...tabelaColunas(cls), '');
    }

    linhas.push('[← todos os arquivos](../report-columns.md)', '');
    return linhas.join('\n');
}

/** Diagrama fonte -> arquivo, para ver de relance quem produz o quê. */
function diagramaFontes(grupos: Grupo[]): string[] {
    const edges: string[] = [];
    for (const g of grupos) {
        for (const f of g.fontes) edges.push(`    ${slug(f)}["${f}"] --> ${slug(g.arquivo)}["${g.arquivo}"]`);
    }
    if (!edges.length) return [];
    return ['```mermaid', 'flowchart LR', ...edges, '```', ''];
}

function paginaIndice(grupos: Grupo[]): string {
    return [
        '# Colunas dos relatórios',
        '',
        '<!-- Gerado por bin/report-columns-gen.ts — não edite à mão. -->',
        '',
        `${grupos.length} ${grupos.length === 1 ? 'arquivo' : 'arquivos'} de relatório com schema de colunas declarado.`,
        '',
        '## Arquivos',
        '',
        '| Arquivo | Fontes | Colunas | Doc |',
        '| --- | --- | --- | --- |',
        ...grupos.map(
            (g) =>
                `| \`${g.arquivo}\` | ${
                    g.fontes.map((f) => `\`${f}\``).join(', ') || '—'
                } | ${totalColunas(g)} | [detalhes](./report-columns/${slug(g.arquivo)}.md) |`
        ),
        '',
        '## Fontes por arquivo',
        '',
        ...diagramaFontes(grupos),
    ].join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
    const args = process.argv.slice(2);
    const paraStdout = args.includes('--stdout');
    carregarClasses(args.filter((a) => !a.startsWith('--')));

    const classes = listReportRowClasses();
    if (!classes.length) {
        console.error(
            'Nenhuma classe @ReportRows registrada.\n' +
                `Nada foi encontrado/importado a partir de ${path.relative(process.cwd(), SRC_REPORTS)}/**/entities/*.ts.\n` +
                'Isso normalmente significa que os imports falharam ou que ainda não existe nenhuma classe decorada — ' +
                'gerar uma doc vazia seria pior que falhar, então nada foi escrito.'
        );
        process.exit(1);
    }

    const grupos = agrupar(classes);
    const index = paginaIndice(grupos);

    if (paraStdout) {
        process.stdout.write([index, ...grupos.map(paginaArquivo)].join('\n\n---\n\n'));
        return;
    }

    // Recria o diretório do zero para arquivos removidos não deixarem doc órfã.
    fs.rmSync(FILES_DIR, { recursive: true, force: true });
    fs.mkdirSync(FILES_DIR, { recursive: true });
    for (const g of grupos) fs.writeFileSync(path.join(FILES_DIR, `${slug(g.arquivo)}.md`), paginaArquivo(g));
    fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
    fs.writeFileSync(INDEX_FILE, index);

    console.log(
        `Escritos ${grupos.length} arquivo(s) em ${path.relative(process.cwd(), FILES_DIR)}/ e o índice ${path.relative(
            process.cwd(),
            INDEX_FILE
        )}`
    );
}

main();
