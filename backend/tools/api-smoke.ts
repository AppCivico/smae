/**
 * Varredura de todos os GETs da API contra uma instância rodando, com baseline versionável.
 *
 * Para que serve: depois de subir dependências (Prisma, pg, Nest, class-validator) o risco não
 * é o build, é a query que passou a estourar em runtime num endpoint que ninguém abriu. O
 * script faz login de verdade, lê a lista de rotas do próprio Swagger e chama cada GET,
 * resolvendo os `{id}` de path com um id real vindo do endpoint de listagem correspondente.
 *
 * Precisa de uma API no ar e de um banco com dados. Endpoint que depende de serviço externo
 * ausente (SEI, metabase) responde 500 e é isso que o baseline serve para registrar: grave o
 * baseline num estado tido como bom e a partir daí só o que *mudou de classe* falha.
 *
 * A comparação é por classe (ok / erro-cliente / erro-servidor), não por código exato, porque
 * o código exato depende da linha que o endpoint de listagem devolveu primeiro, e isso muda
 * conforme o banco. A pergunta que o baseline responde é "algo passou a estourar", não
 * "o 404 virou 403".
 *
 * Usage:
 *   npx ts-node -T tools/api-smoke.ts --url http://127.0.0.1:3001 --email x@y.z --senha ... --write
 *   npx ts-node -T tools/api-smoke.ts --url http://127.0.0.1:3001 --email x@y.z --senha ...
 *
 * Credenciais também via env: SMOKE_URL, SMOKE_EMAIL, SMOKE_SENHA.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const SISTEMAS = ['SMAE', 'PDM', 'ProgramaDeMetas', 'PlanoSetorial', 'CasaCivil', 'Projetos', 'MDO'];
const DOCS = [
    'swagger',
    'swagger-pdm',
    'swagger-projetos',
    'swagger-casa-civil',
    'swagger-workflow',
    'swagger-orcamento',
    'swagger-bloco-notas',
    'swagger-sysadmin',
];
const BASELINE_PADRAO = resolve(__dirname, 'api-smoke.baseline.json');

type Classe = 'ok' | 'erro-cliente' | 'erro-servidor' | 'sem-id' | 'falhou';
type Resultado = { rota: string; url: string; sistema: string; status: number | null; classe: Classe; corpo: string };

function arg(nome: string, envVar: string, padrao?: string): string {
    const i = process.argv.indexOf(`--${nome}`);
    return (i >= 0 ? process.argv[i + 1] : undefined) ?? process.env[envVar] ?? padrao ?? '';
}

function classifica(status: number): Classe {
    if (status >= 500) return 'erro-servidor';
    if (status >= 400) return 'erro-cliente';
    return 'ok';
}

async function main() {
    const base = arg('url', 'SMOKE_URL', 'http://127.0.0.1:3001').replace(/\/$/, '');
    const email = arg('email', 'SMOKE_EMAIL');
    const senha = arg('senha', 'SMOKE_SENHA');
    const escrever = process.argv.includes('--write');
    const iBase = process.argv.indexOf('--baseline');
    const arquivoBaseline = iBase >= 0 ? resolve(process.argv[iBase + 1]) : BASELINE_PADRAO;

    if (!email || !senha) {
        console.error('informe --email e --senha (ou SMOKE_EMAIL / SMOKE_SENHA).');
        process.exit(2);
    }

    const login = await fetch(`${base}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
    });
    if (login.status !== 200) {
        console.error(`login falhou: ${login.status} ${(await login.text()).slice(0, 200)}`);
        process.exit(2);
    }
    const { access_token: token } = (await login.json()) as { access_token: string };
    if (!token) {
        console.error('login não devolveu access_token (conta bloqueada devolve reduced_access_token).');
        process.exit(2);
    }
    const headers = (sistema: string) => ({ Authorization: `Bearer ${token}`, 'smae-sistemas': sistema });

    // Une as rotas de todos os documentos: cada um expõe um subconjunto dos módulos
    const rotas = new Map<string, any>();
    for (const doc of DOCS) {
        const r = await fetch(`${base}/api/${doc}-json`, { headers: headers('SMAE') });
        if (r.status !== 200) continue;
        const json = (await r.json()) as { paths: Record<string, any> };
        for (const [rota, metodos] of Object.entries(json.paths)) {
            if (metodos.get && !rotas.has(rota)) rotas.set(rota, metodos.get);
        }
    }
    if (rotas.size === 0) {
        console.error('nenhuma rota lida do Swagger. A API está no ar nessa URL?');
        process.exit(2);
    }

    /** Primeiro id real do endpoint de listagem pai, com o sistema que aceitou a chamada. */
    const cacheId = new Map<string, { id: unknown; sistema: string } | null>();
    async function idReal(rotaLista: string) {
        if (cacheId.has(rotaLista)) return cacheId.get(rotaLista)!;
        let achado: { id: unknown; sistema: string } | null = null;
        for (const sistema of SISTEMAS) {
            try {
                const r = await fetch(base + rotaLista, { headers: headers(sistema) });
                if (r.status !== 200) continue;
                const j: any = await r.json();
                const linhas = Array.isArray(j) ? j : (j?.linhas ?? j?.rows ?? null);
                if (linhas?.length && linhas[0]?.id != null) {
                    achado = { id: linhas[0].id, sistema };
                    break;
                }
            } catch {
                /* próximo sistema */
            }
        }
        cacheId.set(rotaLista, achado);
        return achado;
    }

    /** Query obrigatória preenchida com o primeiro enum, ou o id resolvido quando numérica. */
    function queryObrigatoria(get: any, id: unknown): string {
        const obrigatorias = (get.parameters ?? []).filter((p: any) => p.required && p.in === 'query');
        if (!obrigatorias.length) return '';
        const pares = obrigatorias.map((p: any) => {
            const enumerado = p.schema?.enum;
            const tipo = p.schema?.type;
            const valor = enumerado
                ? enumerado[0]
                : tipo === 'number' || tipo === 'integer'
                  ? (id ?? 1)
                  : tipo === 'boolean'
                    ? 'true'
                    : 'x';
            return `${p.name}=${encodeURIComponent(String(valor))}`;
        });
        return '?' + pares.join('&');
    }

    /**
     * 403 e "apenas um smae-sistema por vez" morrem no guard: o service nem roda, e é
     * justamente o código do service que um upgrade de Prisma/pg quebra. Então tenta os
     * sistemas em ordem e fica com a primeira resposta que passou do guard.
     */
    function barradoNoGuard(status: number, corpo: string): boolean {
        if (status === 403) return true;
        return status === 400 && /smae-sistema|mais de um sistema/.test(corpo);
    }

    const resultados: Resultado[] = [];
    for (const [rota, get] of [...rotas].sort(([a], [b]) => (a < b ? -1 : 1))) {
        let id: unknown = null;
        let candidatos = SISTEMAS;

        if (rota.includes('{')) {
            const partes = rota.split('/');
            const rotaLista = partes.slice(0, partes.findIndex((p) => p.startsWith('{'))).join('/');
            const achado = await idReal(rotaLista);
            if (!achado) {
                resultados.push({ rota, url: rota, sistema: '-', status: null, classe: 'sem-id', corpo: '' });
                continue;
            }
            id = achado.id;
            // O sistema que enxergou a linha vai primeiro, mas os outros seguem como alternativa
            candidatos = [achado.sistema, ...SISTEMAS.filter((s) => s !== achado.sistema)];
        }

        const url = rota.replace(/\{[^}]+\}/g, String(id)) + queryObrigatoria(get, id);
        let melhor: Resultado | null = null;

        for (const sistema of candidatos) {
            let atualResultado: Resultado;
            try {
                const r = await fetch(base + url, { headers: headers(sistema) });
                const corpo = (await r.text()).slice(0, 300);
                atualResultado = { rota, url, sistema, status: r.status, classe: classifica(r.status), corpo };
            } catch (e) {
                atualResultado = { rota, url, sistema, status: null, classe: 'falhou', corpo: String(e).slice(0, 200) };
            }

            melhor ??= atualResultado;
            if (atualResultado.classe === 'falhou') {
                melhor = atualResultado;
                break;
            }
            if (!barradoNoGuard(atualResultado.status!, atualResultado.corpo)) {
                melhor = atualResultado;
                break;
            }
        }

        resultados.push(melhor!);
    }

    const contagem: Record<string, number> = {};
    for (const r of resultados) contagem[r.classe] = (contagem[r.classe] ?? 0) + 1;
    console.log(`${resultados.length} GETs em ${base}`);
    console.log(
        Object.entries(contagem)
            .sort()
            .map(([k, v]) => `  ${k}: ${v}`)
            .join('\n')
    );

    const problemas = resultados.filter((r) => r.classe === 'erro-servidor' || r.classe === 'falhou');
    if (problemas.length) {
        console.log('\nerro de servidor:');
        for (const p of problemas) {
            console.log(`  ${p.status ?? 'ERR'} [${p.sistema}] ${p.url}\n      ${p.corpo.replace(/\s+/g, ' ').slice(0, 180)}`);
        }
    }

    // Baseline guarda só a classe: corpo e código exato dependem dos dados do banco
    const atual: Record<string, Classe> = {};
    for (const r of resultados) atual[r.rota] = r.classe;

    if (escrever) {
        writeFileSync(arquivoBaseline, JSON.stringify(atual, null, 1) + '\n');
        console.log(`\nbaseline gravado em ${arquivoBaseline} (${problemas.length} erro(s) de servidor registrado(s) como conhecidos)`);
        return;
    }

    if (!existsSync(arquivoBaseline)) {
        console.log(`\nsem baseline em ${arquivoBaseline}; gere com --write.`);
        process.exit(problemas.length ? 1 : 0);
    }

    const baseline: Record<string, Classe> = JSON.parse(readFileSync(arquivoBaseline, 'utf8'));
    const regressoes: string[] = [];
    for (const rota of [...new Set([...Object.keys(baseline), ...Object.keys(atual)])].sort()) {
        const antes = baseline[rota];
        const depois = atual[rota];
        if (antes === undefined) {
            if (depois === 'erro-servidor' || depois === 'falhou') regressoes.push(`+ ${rota}: rota nova já em ${depois}`);
            continue;
        }
        if (depois === undefined) {
            regressoes.push(`- ${rota}: rota desapareceu do Swagger (era ${antes})`);
            continue;
        }
        if (antes !== depois) regressoes.push(`~ ${rota}: ${antes} -> ${depois}`);
    }

    if (regressoes.length === 0) {
        console.log('\nOK: nenhuma rota mudou de classe em relação ao baseline.');
        return;
    }
    console.error(`\n${regressoes.length} mudança(s) em relação ao baseline:\n`);
    for (const r of regressoes) console.error(`  ${r}`);
    console.error('\nSe a mudança é esperada, regrave com --write e revise o diff.');
    process.exit(1);
}

main();
