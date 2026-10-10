import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
} from '../../lib';

// supertest só entende JSON único: o corpo jsonlines é lido como texto cru
const lerTexto = (res: unknown, cb: (err: Error | null, body: unknown) => void) => {
    const stream = res as NodeJS.ReadableStream;
    let texto = '';
    stream.setEncoding('utf8');
    stream.on('data', (parte: string) => (texto += parte));
    stream.on('end', () => cb(null, texto));
};

const linhasJson = (texto: string) =>
    texto
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, any>);

describe('relatorio/indicadores', () => {
    let executor: Sessao;
    let administrador: Sessao;
    let semPrivilegio: Sessao;
    let pdmId: number;
    let pdmVazioId: number;
    let indicadorId: number;

    before(async () => {
        await bootApp();
        executor = await criarPessoaComPrivilegios(['Reports.executar.PDM']);
        administrador = await criarPessoaComPrivilegios([
            'Reports.executar.PDM',
            'CadastroMeta.administrador_no_pdm_admin_cp',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();

        pdmId = (await criarPdmAntigo()).id;
        pdmVazioId = (await criarPdmAntigo()).id;
        const meta = await prisma().meta.create({
            data: { pdm_id: pdmId, status: 'Ativo', codigo: 'M-IND', titulo: 'Meta do relatório de indicadores' },
        });
        const indicador = await prisma().indicador.create({
            data: {
                meta_id: meta.id,
                codigo: 'I-IND',
                titulo: 'Indicador mensal',
                periodicidade: 'Mensal',
                inicio_medicao: new Date('2027-01-01'),
                fim_medicao: new Date('2027-12-01'),
            },
        });
        indicadorId = indicador.id;
    });

    const url = '/api/relatorio/indicadores';
    const rotas = [url, `${url}/stream-linhas`, `${url}/stream-regioes`];
    const params = (extra: Record<string, unknown> = {}) => ({
        tipo: 'Analitico',
        periodo: 'Anual',
        ano: 2027,
        pdm_id: pdmId,
        ...extra,
    });

    const stream = (sessao: Sessao, rota: string, corpo: Record<string, unknown>) =>
        api(sessao).post(rota).send(corpo).buffer(true).parse(lerTexto);

    it('401 sem token', async () => {
        for (const rota of rotas) assertStatus(await api().post(rota).send(params()), 401);
    });

    it('403 sem Reports.executar.PDM', async () => {
        for (const rota of rotas) {
            const res = await api(semPrivilegio).post(rota).send(params());
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.executar\.PDM/);
        }
    });

    it('400 sem tipo/periodo/ano, com enum inválido ou analitico_desde_o_inicio não booleano', async () => {
        for (const rota of rotas) {
            const enviar = (corpo: Record<string, unknown>) => api(executor).post(rota).send(corpo);
            assertStatus(await enviar({}), 400);
            assertStatus(await enviar(params({ tipo: 'Foo' })), 400);
            assertStatus(await enviar(params({ periodo: 'Mensal' })), 400);
            assertStatus(await enviar(params({ periodo: 'Semestral', semestre: 'Terceiro' })), 400);
            assertStatus(await enviar(params({ ano: 'x' })), 400);
            assertStatus(await enviar(params({ analitico_desde_o_inicio: 'x' })), 400);
        }
    });

    it('400 em Semestral sem semestre', async () => {
        const res = await api(executor)
            .post(url)
            .send(params({ periodo: 'Semestral' }));
        assertStatus(res, 400);
        assert.match(res.body.message, /semestre/);
    });

    it('201 em PDM sem metas devolve linhas e regioes vazias', async () => {
        const res = await api(executor)
            .post(url)
            .send(params({ pdm_id: pdmVazioId }));
        assertStatus(res, 201);
        assert.deepEqual(res.body, { linhas: [], regioes: [] });
    });

    it('Analitico anual devolve uma linha por mês e série do indicador visível', async () => {
        const res = await api(administrador).post(url).send(params());
        assertStatus(res, 201);

        const doIndicador = (res.body.linhas as Record<string, any>[]).filter((l) => l.indicador.id === indicadorId);
        assert.equal(doIndicador[0].indicador.codigo, 'I-IND');
        assert.equal(doIndicador[0].meta.codigo, 'M-IND');
        assert.deepEqual([...new Set(doIndicador.map((l) => l.serie))].sort(), ['Realizado', 'RealizadoAcumulado']);

        const datas = doIndicador.filter((l) => l.serie === 'Realizado').map((l) => l.data);
        assert.ok(datas.includes('2027-01-01'));
        assert.ok(datas.includes('2027-12-01'));
        assert.equal(doIndicador[0].valor, null);
        assert.deepEqual(res.body.regioes, []);
    });

    it('Consolidado anual agrupa o ano numa única data do tipo inicio/fim', async () => {
        const res = await api(administrador)
            .post(url)
            .send(params({ tipo: 'Consolidado' }));
        assertStatus(res, 201);

        const doIndicador = (res.body.linhas as Record<string, any>[]).filter((l) => l.indicador.id === indicadorId);
        assert.ok(doIndicador.length > 0);
        assert.ok(doIndicador.every((l) => l.data === '2027-01-01/2027-12-01'));
    });

    it('quem não enxerga a meta recebe o PDM sem linhas', async () => {
        const res = await api(executor).post(url).send(params());
        assertStatus(res, 201);
        assert.deepEqual(res.body, { linhas: [], regioes: [] });
    });

    it('stream-linhas devolve jsonlines com as mesmas linhas', async () => {
        const res = await stream(administrador, `${url}/stream-linhas`, params());
        assertStatus(res, 200);
        assert.match(res.headers['content-type'], /application\/jsonlines\+json/);

        const doIndicador = linhasJson(res.body as string).filter((l) => l.indicador.id === indicadorId);
        assert.ok(doIndicador.length > 0);
        assert.ok(doIndicador.some((l) => l.serie === 'Realizado' && l.data === '2027-06-01'));
    });

    it('stream-regioes devolve jsonlines sem linhas para indicador não regionalizado', async () => {
        const res = await stream(administrador, `${url}/stream-regioes`, params());
        assertStatus(res, 200);
        assert.match(res.headers['content-type'], /application\/jsonlines\+json/);
        assert.deepEqual(linhasJson(res.body as string), []);
    });

    it(
        'stream-linhas com Semestral sem semestre responde 400',
        {
            todo: 'BUG: POST /api/relatorio/indicadores/stream-linhas: esperado 400 (como no POST sem stream), veio 200 com {"error":...} no corpo (https://github.com/AppCivico/smae/issues/695)',
        },
        async () => {
            const res = await stream(executor, `${url}/stream-linhas`, params({ periodo: 'Semestral' }));
            assertStatus(res, 400);
        }
    );

    it(
        'responde (sem travar) com tipo Geral',
        {
            timeout: 8000,
        },
        async () => {
            const res = await api(administrador)
                .post(url)
                .send(params({ tipo: 'Geral' }));
            assert.ok(res.status === 201 || res.status === 400);
        }
    );

    it(
        'responde (sem travar) com tipo Mensal e mes',
        {
            timeout: 8000,
        },
        async () => {
            const res = await api(administrador)
                .post(url)
                .send(params({ tipo: 'Mensal', mes: 3 }));
            assertStatus(res, 201);
        }
    );
});
