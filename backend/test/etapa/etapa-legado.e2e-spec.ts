import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPdmAntigo, criarPessoaComPrivilegios, prisma, Sessao, uniq } from '../lib';
import { criarCronogramaLegado, criarMetaLegado, gestorLegado } from '../pdm/_helpers';

describe('etapa (PDM legado): responsáveis e consolidação das datas', () => {
    let legado: Sessao;
    let outra: Sessao;
    let cronograma: number;

    const criar = async (dados: Record<string, unknown> = {}): Promise<number> => {
        const res = await api(legado)
            .post(`/api/cronograma/${cronograma}/etapa`)
            .send({ titulo: uniq('Etapa'), ...dados });
        assertStatus(res, 201);
        return res.body.id;
    };
    const responsaveisNoBanco = async (etapa_id: number) =>
        (await prisma().etapaResponsavel.findMany({ where: { etapa_id } })).map((r) => r.pessoa_id).sort();

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        outra = await criarPessoaComPrivilegios(['CadastroMeta.listar']);
        const pdm = await criarPdmAntigo();
        cronograma = await criarCronogramaLegado(legado, await criarMetaLegado(legado, pdm.id));
    });

    it('grava, troca e limpa responsáveis, e a listagem do cronograma reflete', async () => {
        const e = await criar({ responsaveis: [legado.pessoa.id] });
        assert.deepEqual(await responsaveisNoBanco(e), [legado.pessoa.id]);

        const lista = async () => {
            const res = await api(legado).get(`/api/cronograma-etapa?cronograma_id=${cronograma}`);
            assertStatus(res, 200);
            return res.body.linhas.find((l: { etapa_id: number }) => l.etapa_id === e).etapa.responsaveis;
        };
        assert.deepEqual(
            (await lista()).map((r: { id: number }) => r.id),
            [legado.pessoa.id]
        );

        const ids = [legado.pessoa.id, outra.pessoa.id].sort((a, b) => a - b);
        assertStatus(await api(legado).patch(`/api/etapa/${e}`).send({ responsaveis: ids }), 200);
        assert.deepEqual(await responsaveisNoBanco(e), ids);

        assertStatus(await api(legado).patch(`/api/etapa/${e}`).send({ responsaveis: [outra.pessoa.id] }), 200);
        assert.deepEqual(await responsaveisNoBanco(e), [outra.pessoa.id]);
        assert.deepEqual(
            (await lista()).map((r: { id: number }) => r.id),
            [outra.pessoa.id]
        );

        assertStatus(await api(legado).patch(`/api/etapa/${e}`).send({ titulo: uniq('Só título') }), 200);
        assert.deepEqual(await responsaveisNoBanco(e), [outra.pessoa.id], 'sem o campo, responsáveis não mudam');

        assertStatus(await api(legado).patch(`/api/etapa/${e}`).send({ responsaveis: [] }), 200);
        assert.deepEqual(await responsaveisNoBanco(e), []);
    });

    it('as datas e o percentual também sobem de fase para etapa e cronograma no PDM legado', async () => {
        const meta = await criarMetaLegado(legado, (await criarPdmAntigo()).id);
        const crono = await criarCronogramaLegado(legado, meta);
        const mk = async (dados: Record<string, unknown>) => {
            const res = await api(legado)
                .post(`/api/cronograma/${crono}/etapa`)
                .send({ titulo: uniq('E'), ...dados });
            assertStatus(res, 201);
            return res.body.id as number;
        };
        const e = await mk({ peso: 1 });
        await mk({
            etapa_pai_id: e,
            peso: 1,
            percentual_execucao: 20,
            inicio_previsto: '2031-02-01',
            termino_previsto: '2031-02-10',
        });
        await mk({
            etapa_pai_id: e,
            peso: 1,
            percentual_execucao: 60,
            inicio_previsto: '2031-01-01',
            termino_previsto: '2031-03-10',
        });

        const pai = await prisma().etapa.findUniqueOrThrow({ where: { id: e } });
        assert.equal(pai.percentual_execucao, 40);
        assert.equal(pai.inicio_previsto?.toISOString().slice(0, 10), '2031-01-01');
        const c = await prisma().cronograma.findUniqueOrThrow({ where: { id: crono } });
        assert.equal(c.percentual_execucao, 40);
        assert.equal(c.termino_previsto?.toISOString().slice(0, 10), '2031-03-10');
    });
});
