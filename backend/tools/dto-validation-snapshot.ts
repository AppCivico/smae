/**
 * Snapshot do comportamento de validação de todos os DTOs do projeto.
 *
 * Para que serve: subir class-validator / class-transformer é a mudança de dependência com
 * maior superfície do backend, porque todo endpoint passa pelo ValidationPipe global. O `tsc`
 * não detecta mudança de comportamento (a assinatura continua igual), e testar endpoint por
 * endpoint não escala. Este script roda `validate()` em todas as classes decoradas contra um
 * conjunto fixo de payloads e grava quais restrições dispararam em cada caso.
 *
 * Fluxo ao subir a lib:
 *   1. npm run build && npm run test:dto-snapshot          (na versão atual, confirma verde)
 *   2. sobe a lib, npm run build
 *   3. npm run test:dto-snapshot                            (falha = comportamento mudou)
 *
 * Para aceitar uma mudança intencional: npm run test:dto-snapshot:write e revise o diff.
 *
 * Só o nome da restrição entra no snapshot, não a mensagem: mensagem é texto de UI e mudaria
 * o arquivo a cada ajuste de copy, afogando a diferença que importa.
 *
 * Usage: npx ts-node -T tools/dto-validation-snapshot.ts [--write] [--snapshot <arquivo>]
 */
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { getMetadataStorage, validate } from 'class-validator';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const DIST = resolve(__dirname, '..', 'dist', 'src');
const SNAPSHOT_PADRAO = resolve(__dirname, 'dto-validation.snapshot.json');

/**
 * Um valor por "forma" de payload. Sem inferir tipo do DTO de propósito: cada propriedade
 * recebe as oito formas, então para um campo `@IsInt()` o caso `numero` é o payload válido e
 * os outros sete são as rejeições. Inferir o tipo daria menos cobertura e mais acoplamento.
 */
const FORMAS: Record<string, unknown> = {
    vazio: undefined,
    nulo: null,
    texto: 'texto',
    numero: 12345,
    numeroTexto: '1',
    boolTexto: 'true',
    lista: [],
    objeto: {},
};

type Snapshot = Record<string, string[]>;
type ClasseDto = new (...args: any[]) => object;

function arquivosDeDto(dir: string): string[] {
    const encontrados: string[] = [];
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
        const caminho = join(dir, entrada.name);
        if (entrada.isDirectory()) encontrados.push(...arquivosDeDto(caminho));
        else if (/\.(dto|entity)\.js$/.test(entrada.name)) encontrados.push(caminho);
    }
    return encontrados;
}

function classesDecoradas(): Map<string, ClasseDto> {
    const storage = getMetadataStorage();
    const classes = new Map<string, ClasseDto>();

    for (const arquivo of arquivosDeDto(DIST)) {
        let mod: Record<string, unknown>;
        try {
            mod = require(arquivo);
        } catch {
            continue; // DTO que não carrega isolado não é regressão de validação
        }
        for (const [nome, exportado] of Object.entries(mod)) {
            if (typeof exportado !== 'function' || !/^[A-Z]/.test(nome)) continue;
            if (classes.has(nome)) continue;
            // Sem metadata de validação não há o que comparar: entidade de resposta, enum, helper
            if (storage.getTargetValidationMetadatas(exportado, '', true, false).length === 0) continue;
            classes.set(nome, exportado as ClasseDto);
        }
    }
    return classes;
}

function propriedadesValidadas(cls: ClasseDto): string[] {
    const metas = getMetadataStorage().getTargetValidationMetadatas(cls, '', true, false);
    return [...new Set(metas.map((m) => m.propertyName).filter(Boolean))].sort();
}

/** Remove caminho absoluto para o snapshot não depender de onde o repo está clonado. */
function normalizaErro(e: unknown): string {
    const err = e as Error;
    const msg = String(err?.message ?? e)
        .split('\n')[0]
        .replace(/\/[\w./@-]+/g, '<path>')
        .slice(0, 120);
    return `THREW:${err?.constructor?.name ?? 'Error'}:${msg}`;
}

/**
 * Validators customizados do projeto logam e montam exceções durante a validação
 * (ex.: task.validator.ts). Rodando 4 mil casos isso enterra a saída do script.
 */
function semRuido<T>(fn: () => Promise<T>): Promise<T> {
    const original = { log: console.log, error: console.error, warn: console.warn, debug: console.debug };
    Object.assign(console, { log: () => {}, error: () => {}, warn: () => {}, debug: () => {} });
    return fn().finally(() => Object.assign(console, original));
}

async function gerarSnapshot(): Promise<Snapshot> {
    const classes = [...classesDecoradas()].sort(([a], [b]) => (a < b ? -1 : 1));
    const snapshot: Snapshot = {};

    for (const [nome, cls] of classes) {
        const props = propriedadesValidadas(cls);

        for (const [forma, valor] of Object.entries(FORMAS)) {
            const payload: Record<string, unknown> = {};
            if (forma !== 'vazio') for (const p of props) payload[p] = valor;

            const chave = `${nome}::${forma}`;
            try {
                // Mesmas opções do ValidationPipe global (app.module.ts)
                const instancia = plainToInstance(cls, payload);
                const erros = await validate(instancia as object, { whitelist: true });

                const achatados: string[] = [];
                const percorre = (erro: any, prefixo: string) => {
                    const caminho = prefixo ? `${prefixo}.${erro.property}` : erro.property;
                    for (const restricao of Object.keys(erro.constraints ?? {}).sort()) {
                        achatados.push(`${caminho}:${restricao}`);
                    }
                    for (const filho of erro.children ?? []) percorre(filho, caminho);
                };
                for (const erro of erros) percorre(erro, '');

                snapshot[chave] = achatados.sort();
            } catch (e) {
                snapshot[chave] = [normalizaErro(e)];
            }
        }
    }
    return snapshot;
}

/** Um caso por linha: o valor deste arquivo é o diff, e 24 mil linhas de array quebrado não se lê. */
function serializa(snapshot: Snapshot): string {
    const linhas = Object.keys(snapshot)
        .sort()
        .map((chave) => `${JSON.stringify(chave)}: ${JSON.stringify(snapshot[chave])}`);
    return `{\n${linhas.join(',\n')}\n}\n`;
}

function compara(esperado: Snapshot, obtido: Snapshot): string[] {
    const problemas: string[] = [];
    const chaves = [...new Set([...Object.keys(esperado), ...Object.keys(obtido)])].sort();

    for (const chave of chaves) {
        const antes = esperado[chave];
        const depois = obtido[chave];

        if (antes === undefined) {
            problemas.push(`+ ${chave} (caso novo: ${JSON.stringify(depois)})`);
            continue;
        }
        if (depois === undefined) {
            problemas.push(`- ${chave} (caso desapareceu, esperava ${JSON.stringify(antes)})`);
            continue;
        }
        if (JSON.stringify(antes) !== JSON.stringify(depois)) {
            const removidas = antes.filter((x) => !depois.includes(x));
            const adicionadas = depois.filter((x) => !antes.includes(x));
            problemas.push(
                `~ ${chave}\n    deixou de acusar: ${JSON.stringify(removidas)}\n    passou a acusar: ${JSON.stringify(adicionadas)}`
            );
        }
    }
    return problemas;
}

async function main() {
    const escrever = process.argv.includes('--write');
    const idxSnap = process.argv.indexOf('--snapshot');
    const arquivoSnapshot = idxSnap >= 0 ? resolve(process.argv[idxSnap + 1]) : SNAPSHOT_PADRAO;

    if (!existsSync(DIST)) {
        console.error(`dist/src não existe em ${DIST}. Rode 'npm run build' antes.`);
        process.exit(2);
    }

    const versoes = ['class-validator', 'class-transformer']
        .map((n) => `${n}@${require(`${n}/package.json`).version}`)
        .join(' ');

    const obtido = await semRuido(gerarSnapshot);
    const casos = Object.keys(obtido).length;
    const restricoes = Object.values(obtido).reduce((acc, v) => acc + v.length, 0);
    console.log(`${versoes} | ${casos / Object.keys(FORMAS).length} classes | ${casos} casos | ${restricoes} restrições`);

    if (escrever) {
        writeFileSync(arquivoSnapshot, serializa(obtido));
        console.log(`snapshot gravado em ${arquivoSnapshot}`);
        return;
    }

    if (!existsSync(arquivoSnapshot)) {
        console.error(`snapshot não encontrado em ${arquivoSnapshot}. Gere com --write.`);
        process.exit(2);
    }

    const problemas = compara(JSON.parse(readFileSync(arquivoSnapshot, 'utf8')), obtido);
    if (problemas.length === 0) {
        console.log('OK: comportamento de validação idêntico ao snapshot.');
        return;
    }

    console.error(`\n${problemas.length} divergência(s) de validação:\n`);
    for (const p of problemas.slice(0, 60)) console.error(p);
    if (problemas.length > 60) console.error(`\n... e outras ${problemas.length - 60}.`);
    console.error('\nSe a mudança é esperada, regrave com --write e revise o diff.');
    process.exit(1);
}

main();
