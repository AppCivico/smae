import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    Sessao,
    uniq,
} from '../lib';
import {
    criarCronogramaLegado,
    criarIniciativaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPS,
    liberaCronogramas,
} from '../pdm/_helpers';

describe('cronograma', () => {
    let legado: Sessao;
    let ps: Sessao;
    let semPrivilegio: Sessao;
    let semAdminCp: Sessao;
    let pdm: { id: number };

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        ps = await gestorPS();
        semPrivilegio = await criarPessoaSemPrivilegios();
        semAdminCp = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm', 'CadastroPdm.editar']);
        pdm = await criarPdmAntigo();
    });

    describe('/api/cronograma (Programa de Metas legado)', () => {
        it('401 sem token e 403 sem CadastroMeta.administrador_no_pdm', async () => {
            assertStatus(await api().get('/api/cronograma'), 401);

            const meta = await criarMetaLegado(legado, pdm.id);
            const res = await api(semPrivilegio).post('/api/cronograma').send({ meta_id: meta, regionalizavel: false });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 sem meta, iniciativa ou atividade, e sem regionalizavel', async () => {
            const semVinculo = await api(legado).post('/api/cronograma').send({ regionalizavel: false });
            assertStatus(semVinculo, 400);
            assert.match(semVinculo.body.message, /Cronograma precisa ter 1 relacionamento/);

            const meta = await criarMetaLegado(legado, pdm.id);
            assertStatus(await api(legado).post('/api/cronograma').send({ meta_id: meta }), 400);
        });

        it('404 com meta inexistente', async () => {
            assertStatus(
                await api(legado).post('/api/cronograma').send({ meta_id: 999999, regionalizavel: false }),
                404
            );
        });

        it('400 para quem não enxerga a meta', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const res = await api(semAdminCp).post('/api/cronograma').send({ meta_id: meta, regionalizavel: false });
            assertStatus(res, 400);
            assert.match(res.body.message, /Meta não pode ser encontrada para cronograma/);
        });

        it('cria, lista pela meta, edita e remove', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const descricao = uniq('Cronograma CRUD');
            await liberaCronogramas();
            const criado = await api(legado)
                .post('/api/cronograma')
                .send({ meta_id: meta, regionalizavel: true, descricao, observacao: 'obs E2E' });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(legado).get(`/api/cronograma?meta_id=${meta}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.ok(linha, 'cronograma criado não aparece na listagem');
            assert.equal(linha.meta_id, meta);
            assert.equal(linha.descricao, descricao);
            assert.equal(linha.regionalizavel, true);

            const novaDescricao = uniq('Cronograma editado');
            assertStatus(await api(legado).patch(`/api/cronograma/${id}`).send({ descricao: novaDescricao }), 200);
            const depois = await api(legado).get(`/api/cronograma?meta_id=${meta}`);
            assert.equal(depois.body.linhas.find((l: { id: number }) => l.id === id).descricao, novaDescricao);

            assertStatus(await api(legado).delete(`/api/cronograma/${id}`), 202);
            const removido = await api(legado).get(`/api/cronograma?meta_id=${meta}`);
            assert.ok(!removido.body.linhas.some((l: { id: number }) => l.id === id));
        });

        it('cronograma de iniciativa não aparece na listagem da meta', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);
            await liberaCronogramas();
            const criado = await api(legado)
                .post('/api/cronograma')
                .send({ iniciativa_id: iniciativa, regionalizavel: false });
            assertStatus(criado, 201);

            const daIniciativa = await api(legado).get(`/api/cronograma?iniciativa_id=${iniciativa}`);
            assert.ok(daIniciativa.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const daMeta = await api(legado).get(`/api/cronograma?meta_id=${meta}`);
            assert.ok(!daMeta.body.linhas.some((l: { id: number }) => l.id === criado.body.id));
        });

        it(
            '201 ao criar um segundo cronograma com outro ativo',
            {
                todo: 'BUG: índice único parcial cronograma_ativo_idx (migração 20220928131618) aceita um só cronograma ativo no banco inteiro, o segundo vira 423',
            },
            async () => {
                await liberaCronogramas();
                const meta = await criarMetaLegado(legado, pdm.id);
                try {
                    assertStatus(
                        await api(legado).post('/api/cronograma').send({ meta_id: meta, regionalizavel: false }),
                        201
                    );
                    assertStatus(
                        await api(legado).post('/api/cronograma').send({ meta_id: meta, regionalizavel: false }),
                        201
                    );
                } finally {
                    await liberaCronogramas();
                }
            }
        );

        it('400 quando a listagem passa de 10 cronogramas', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            for (let i = 0; i < 11; i++) await criarCronogramaLegado(legado, meta);

            const res = await api(legado).get(`/api/cronograma?meta_id=${meta}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /limite de 10 registros/);
        });

        it('meta de Plano Setorial não aceita cronograma pela rota de PDM legado', async () => {
            const psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const res = await api(legado).post('/api/cronograma').send({ meta_id: metaPS, regionalizavel: false });
            assertStatus(res, 404);
        });
    });

    describe('/api/plano-setorial-cronograma (Plano Setorial)', () => {
        it('cria, lista e remove cronograma de PS, e não enxerga o de PDM legado', async () => {
            const psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const cliente = api(ps, { sistema: 'PlanoSetorial' });

            await liberaCronogramas();
            const criado = await cliente
                .post('/api/plano-setorial-cronograma')
                .send({ meta_id: metaPS, regionalizavel: false, descricao: uniq('Cronograma PS') });
            assertStatus(criado, 201);

            const lista = await cliente.get(`/api/plano-setorial-cronograma?meta_id=${metaPS}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const metaLegado = await criarMetaLegado(legado, pdm.id);
            await criarCronogramaLegado(legado, metaLegado);
            const naPS = await cliente.get(`/api/plano-setorial-cronograma?meta_id=${metaLegado}`);
            assertStatus(naPS, 400);

            assertStatus(await cliente.delete(`/api/plano-setorial-cronograma/${criado.body.id}`), 202);
        });

        it('403 sem privilégio de Plano Setorial', async () => {
            const res = await api(semPrivilegio, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial-cronograma')
                .send({ meta_id: 1, regionalizavel: false });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });
    });
});
