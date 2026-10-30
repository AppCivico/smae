import * as fs from 'node:fs';
import * as path from 'node:path';
import { after, before, describe, it } from 'node:test';
import * as ts from 'typescript';
import { assert, bootApp, criarOrgao, criarPessoaComPrivilegios, getApp, prisma, Sessao } from '../lib';
import { criaGlobal, gravaSerie } from './_helpers';
// depois de ../lib: importar o service antes do AppModule quebra a ordem das dependências circulares
import { VariavelService } from '../../src/variavel/variavel.service';

// S05.08: variável suspensa em 03/26 seguiu aparecendo no ciclo de abr/26 (o job noturno não fechava a Liberação)
describe('job noturno de variáveis globais suspensas (S05.08)', () => {
    let admin: Sessao;
    let orgaoId: number;

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });

        // cada spec tem o próprio clone do banco, então trocar a função aqui não afeta os outros
        await prisma().$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS utils`);
        await prisma().$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS utils.replaceable_now (the_time timestamptz)`);
        await prisma().$executeRawUnsafe(`
            CREATE OR REPLACE FUNCTION replaceable_now() RETURNS timestamptz AS $$
                SELECT coalesce((SELECT the_time FROM utils.replaceable_now LIMIT 1), now())
            $$ LANGUAGE sql STABLE`);
    });

    after(() => congela(null));

    const congela = async (instante: string | null) => {
        await prisma().$executeRaw`DELETE FROM utils.replaceable_now`;
        if (instante) await prisma().$executeRaw`INSERT INTO utils.replaceable_now VALUES (${instante}::timestamptz)`;
    };

    const rodaJob = () => getApp().get(VariavelService).processVariaveisGlobaisSuspensasSync();

    const mes = async (atras: number): Promise<string> => {
        const [{ d }] = await prisma().$queryRaw<{ d: string }[]>`
            select to_char(date_trunc('month', now() at time zone 'America/Sao_Paulo') - (${atras}::int || ' months')::interval, 'YYYY-MM-DD') d`;
        return d;
    };

    const ymd = (datas: (Date | null)[]) => [...new Set(datas.map((d) => d!.toISOString().slice(0, 10)))].sort();

    const ciclosControle = async (variavel_id: number) =>
        ymd(
            (
                await prisma().variavelSuspensaControle.findMany({
                    where: { variavel_id, serie: 'Realizado', removido_em: null },
                    select: { ciclo_referencia: true },
                })
            ).map((c) => c.ciclo_referencia)
        );

    const ciclosLiberados = async (variavel_id: number) =>
        ymd(
            (
                await prisma().variavelGlobalCicloAnalise.findMany({
                    where: { variavel_id, fase: 'Liberacao', ultima_revisao: true, removido_em: null },
                    select: { referencia_data: true },
                })
            ).map((a) => a.referencia_data)
        );

    // 3 donas de ciclo: com o bug, o fuso da query de fechamento virava '$N' (N = nº de ids antes dele)
    const criaSuspensas = async (inicio: string, suspendida_em: string): Promise<number[]> => {
        const vars: number[] = [];
        for (let i = 0; i < 3; i++) {
            const v = await criaGlobal(admin, orgaoId, { inicio_medicao: inicio, fim_medicao: undefined });
            await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
                { periodo: inicio, tipo: 'R_', valor: String(5 + i) },
            ]);
            vars.push(v);
        }
        // direto no banco: o PATCH dispara o caminho de variável única, que não reproduz o bug
        await prisma().variavel.updateMany({
            where: { id: { in: vars } },
            data: { suspendida_em: new Date(suspendida_em) },
        });
        return vars;
    };

    const confereLote = async (vars: number[], controleEsperado: string[], quando: string) => {
        for (const v of vars) {
            const controle = await ciclosControle(v);
            const liberados = await ciclosLiberados(v);
            assert.deepEqual(controle, controleEsperado, `${quando}, var ${v}: ciclos processados`);
            for (const ciclo of controle) {
                assert.ok(
                    liberados.includes(ciclo),
                    `${quando}, var ${v}: ciclo ${ciclo} tem controle de suspensão mas ficou sem Liberação (liberados=${liberados})`
                );
            }
            const ultimo = controleEsperado[controleEsperado.length - 1];
            assert.ok(
                liberados.every((l) => l <= ultimo),
                `${quando}, var ${v}: Liberação adiantada (liberados=${liberados})`
            );
        }
    };

    it('com 3+ variáveis no lote, todo ciclo processado ganha a Liberação automática', async () => {
        const [m3, m2, m1] = [await mes(3), await mes(2), await mes(1)];
        const vars = await criaSuspensas(m3, m2);

        await rodaJob();

        for (const v of vars) {
            const controle = await ciclosControle(v);
            const liberados = await ciclosLiberados(v);
            assert.ok(
                controle.includes(m1),
                `var ${v}: ciclo ${m1} deveria ter sido processado (controle=${controle})`
            );
            assert.ok(
                controle.includes(m2),
                `var ${v}: ciclo ${m2} deveria ter sido processado (controle=${controle})`
            );
            for (const ciclo of controle) {
                assert.ok(
                    liberados.includes(ciclo),
                    `var ${v}: ciclo ${ciclo} tem controle de suspensão mas ficou sem Liberação (liberados=${liberados})`
                );
            }
        }

        const reprocessa = await rodaJob();
        assert.deepEqual(
            reprocessa.filter((v) => vars.includes(v)),
            [],
            'segunda execução não reprocessa ciclos já tratados'
        );
    });

    it('relógio congelado na madrugada do incidente: o ciclo de abr/26 só entra quando 01/04 já passou em SP', async () => {
        const vars = await criaSuspensas('2026-01-01', '2026-03-15');

        try {
            // execução real do incidente: 00:00:37 de 01/04 em SP
            await congela('2026-04-01T03:00:37Z');
            await rodaJob();
            await confereLote(vars, ['2026-02-01', '2026-03-01'], '01/04 00:00 SP');

            // 23:59 de 01/04 em SP, mas já 02/04 em UTC e em UTC−1 (fuso efetivo da query A com o bug)
            await congela('2026-04-02T02:59:00Z');
            await rodaJob();
            await confereLote(vars, ['2026-02-01', '2026-03-01'], '01/04 23:59 SP');

            await congela('2026-04-02T03:00:37Z');
            await rodaJob();
            await confereLote(vars, ['2026-02-01', '2026-03-01', '2026-04-01'], '02/04 00:00 SP');

            // dados de abr/26 coletados em mai/26: nada novo além do ciclo de abril
            await congela('2026-05-01T03:00:37Z');
            await rodaJob();
            await confereLote(vars, ['2026-02-01', '2026-03-01', '2026-04-01'], '01/05 00:00 SP');
        } finally {
            await congela(null);
        }
    });

    it("nenhuma tagged template SQL interpola ${} dentro de aspas (vira o literal '$N')", () => {
        const ofensas: string[] = [];
        // __dirname aponta para o build em dist-test; o runner roda com cwd na raiz do backend
        const srcDir = path.resolve(process.cwd(), 'src');
        const ehSql = (tag: string) => /(\$queryRaw|\$executeRaw|Prisma\.sql|\bsql)$/.test(tag);

        const varre = (dir: string) => {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
                const p = path.join(dir, e.name);
                if (e.isDirectory()) varre(p);
                else if (e.name.endsWith('.ts') && !e.name.endsWith('.d.ts') && !e.name.endsWith('.spec.ts')) {
                    const sf = ts.createSourceFile(p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true);
                    const visita = (n: ts.Node) => {
                        if (
                            ts.isTaggedTemplateExpression(n) &&
                            ehSql(n.tag.getText(sf)) &&
                            ts.isTemplateExpression(n.template)
                        ) {
                            let antes = n.template.head.text;
                            for (const span of n.template.templateSpans) {
                                const depois = span.literal.text;
                                if (/'$/.test(antes) && /^'/.test(depois)) {
                                    const { line } = sf.getLineAndCharacterOfPosition(span.getStart(sf));
                                    ofensas.push(
                                        `${path.relative(srcDir, p)}:${line + 1} '\${${span.expression.getText(sf)}}'`
                                    );
                                }
                                antes = depois;
                            }
                        }
                        ts.forEachChild(n, visita);
                    };
                    visita(sf);
                }
            }
        };
        varre(srcDir);

        assert.deepEqual(ofensas, [], "use ${valor}::text no lugar de '${valor}'");
    });
});
