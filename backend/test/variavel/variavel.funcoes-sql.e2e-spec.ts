import { before, describe, it } from 'node:test';
import { assert, bootApp, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';
import { criaGlobal, gravaSerie, serieVariavelDb } from './_helpers';

describe('funções SQL de variável e série (chamadas direto no banco)', () => {
    let admin: Sessao;
    let orgaoId: number;

    before(async () => {
        await bootApp();
        orgaoId = (await criarOrgao()).id;
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador'], { orgao_id: orgaoId });
    });

    const mes = async (delta: number): Promise<string> => {
        const [{ d }] = await prisma().$queryRaw<{ d: string }[]>`
            select to_char(date_trunc('month', now() at time zone 'America/Sao_Paulo') + (${delta}::int || ' months')::interval, 'YYYY-MM-DD') d`;
        return d;
    };

    it('periodicidade_intervalo converte cada periodicidade', async () => {
        const rows = await prisma().$queryRaw<{ p: string; i: string }[]>`
            select p::text p, periodicidade_intervalo(p)::text i
            from unnest(enum_range(null::"Periodicidade")) p`;
        const por = Object.fromEntries(rows.map((r) => [r.p, r.i]));
        assert.equal(por.Mensal, '1 mon');
        assert.equal(por.Bimestral, '2 mons');
        assert.equal(por.Trimestral, '3 mons');
        assert.equal(por.Quadrimestral, '4 mons');
        assert.equal(por.Semestral, '6 mons');
        assert.equal(por.Anual, '1 year');
        assert.equal(por.Quinquenal, '5 years');
        assert.equal(por.Secular, '100 years');
    });

    it('ultimo_periodo_valido respeita o atraso e alinha ao início da medição', async () => {
        const agora = await mes(0);
        const q = async (per: string, atraso: number, inicio: string) =>
            (
                await prisma().$queryRaw<{ d: string }[]>`
                    select to_char(ultimo_periodo_valido(${per}::"Periodicidade", ${atraso}::int, ${inicio}::date), 'YYYY-MM-DD') d`
            )[0].d;

        assert.equal(await q('Mensal', 0, '2020-01-01'), agora);
        assert.equal(await q('Mensal', 1, '2020-01-01'), await mes(-1));
        assert.equal(await q('Mensal', 3, '2020-01-01'), await mes(-3));

        const tri = await q('Trimestral', 1, '2020-02-01');
        const [, mesTri] = tri.split('-').map(Number);
        assert.equal((mesTri - 2 + 12) % 3, 0, `${tri} precisa cair em fev/mai/ago/nov`);
        const limite = await mes(-1);
        assert.ok(tri <= limite, 'não passa do último mês permitido');
        const [yl, ml] = limite.split('-').map(Number);
        const [yt, mt] = tri.split('-').map(Number);
        assert.ok((yl - yt) * 12 + (ml - mt) < 3, 'é o período mais recente do alinhamento');

        const anual = await q('Anual', 1, '1999-12-01');
        assert.match(anual, /-12-01$/);
    });

    it('busca_periodos_variavel usa o último período válido quando a global não tem fim_medicao', async () => {
        const inicio = await mes(-3);
        const v = await criaGlobal(admin, orgaoId, { inicio_medicao: inicio, fim_medicao: undefined });
        const [linha] = await prisma().$queryRaw<{ i: string; min: string; max: string }[]>`
            select periodicidade::text i, to_char(min, 'YYYY-MM-DD') min, to_char(max, 'YYYY-MM-DD') max
            from busca_periodos_variavel(${v}::int)`;
        assert.equal(linha.i, '1 mon');
        assert.equal(linha.min, inicio);
        assert.equal(linha.max, await mes(-1));

        const comFim = await criaGlobal(admin, orgaoId);
        const [fixa] = await prisma().$queryRaw<{ min: string; max: string }[]>`
            select to_char(min, 'YYYY-MM-DD') min, to_char(max, 'YYYY-MM-DD') max from busca_periodos_variavel(${comFim}::int)`;
        assert.deepEqual(fixa, { min: '2024-01-01', max: '2024-03-01' });
    });

    it('valor_variavel_em ignora não conferidos e usa a janela para repetir o último valor', async () => {
        const v = await criaGlobal(admin, orgaoId, { acumulativa: false });
        await prisma().serieVariavel.createMany({
            data: [
                {
                    variavel_id: v,
                    serie: 'Realizado',
                    data_valor: new Date('2024-01-01'),
                    valor_nominal: 4,
                    conferida: true,
                },
                {
                    variavel_id: v,
                    serie: 'Realizado',
                    data_valor: new Date('2024-02-01'),
                    valor_nominal: 9,
                    conferida: false,
                },
            ],
        });
        const em = async (periodo: string, janela: number): Promise<number | null> => {
            const [{ v: valor }] = await prisma().$queryRaw<{ v: string | null }[]>`
                select valor_variavel_em(${v}::int, 'Realizado'::"Serie", ${periodo}::date, ${janela}::int)::text v`;
            return valor === null ? null : Number(valor);
        };

        assert.equal(await em('2024-01-01', 1), 4);
        assert.equal(await em('2024-02-01', 1), null, 'fevereiro não está conferido');
        assert.equal(await em('2024-02-01', 2), 4, 'janela 2 enxerga janeiro');
        assert.equal(await em('2024-03-01', 2), null, 'janela 2 em março não alcança janeiro');
    });

    it('f_marca_serie_variavel_conferida confere o Realizado, remonta o acumulado e marca a análise para sincronizar', async () => {
        const v = await criaGlobal(admin, orgaoId, { acumulativa: true, valor_base: '1' });
        await prisma().serieVariavel.create({
            data: {
                variavel_id: v,
                serie: 'Realizado',
                data_valor: new Date('2024-02-01'),
                valor_nominal: 5,
                conferida: false,
            },
        });
        const analise = await prisma().variavelGlobalCicloAnalise.create({
            data: {
                variavel_id: v,
                fase: 'Liberacao',
                referencia_data: new Date('2024-02-01'),
                aprovada: true,
                ultima_revisao: true,
                criado_por: admin.pessoa.id,
                valores: [],
            },
        });

        await prisma().$queryRaw`select f_marca_serie_variavel_conferida(${v}::int, '2024-02-01'::date)::text`;

        const linha = await prisma().serieVariavel.findFirstOrThrow({
            where: { variavel_id: v, serie: 'Realizado' },
        });
        assert.equal(linha.conferida, true);
        assert.equal(linha.conferida_por, -1);
        assert.notEqual(linha.conferida_em, null);
        assert.deepEqual(await serieVariavelDb(v, 'RealizadoAcumulado'), {
            '2024-01-01': 1,
            '2024-02-01': 6,
            '2024-03-01': 6,
        });
        const depois = await prisma().variavelGlobalCicloAnalise.findUniqueOrThrow({ where: { id: analise.id } });
        assert.equal(depois.sincronizar_serie_variavel, true);
    });

    it('flag ACUMULADO_REALIZADO_APENAS_PASSADO corta o acumulado realizado no mês atual', async () => {
        const inicio = await mes(-2);
        const fim = await mes(4);
        const v = await criaGlobal(admin, orgaoId, { acumulativa: true, inicio_medicao: inicio, fim_medicao: fim });
        await gravaSerie(admin, '/api/variavel-serie', `/api/variavel/${v}/serie`, [
            { periodo: inicio, tipo: 'R_', valor: '2' },
        ]);
        const sem = Object.keys(await serieVariavelDb(v, 'RealizadoAcumulado'));
        assert.equal(sem.length, 7);
        assert.equal(sem[6], fim);

        await prisma().smaeConfig.create({ data: { key: 'ACUMULADO_REALIZADO_APENAS_PASSADO', value: 'true' } });
        try {
            await prisma().$queryRaw`select monta_serie_acumulada(${v}::int, true)::text`;
            const com = await serieVariavelDb(v, 'RealizadoAcumulado');
            assert.deepEqual(Object.keys(com), [inicio, await mes(-1), await mes(0)]);
            assert.equal(com[inicio], 2);
            const previsto = Object.keys(await serieVariavelDb(v, 'PrevistoAcumulado'));
            assert.equal(previsto.length, 7, 'só o realizado é cortado');
        } finally {
            await prisma().smaeConfig.delete({ where: { key: 'ACUMULADO_REALIZADO_APENAS_PASSADO' } });
        }
        await prisma().$queryRaw`select monta_serie_acumulada(${v}::int, true)::text`;
        assert.equal(Object.keys(await serieVariavelDb(v, 'RealizadoAcumulado')).length, 7);
    });
});
