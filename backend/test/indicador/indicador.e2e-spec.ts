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
    criarIndicadorLegado,
    criarIniciativaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPS,
} from '../pdm/_helpers';

const dadosIndicador = (extra: Record<string, unknown> = {}) => ({
    codigo: uniq('IND'),
    titulo: uniq('Indicador'),
    polaridade: 'Positiva',
    periodicidade: 'Mensal',
    regionalizavel: false,
    casas_decimais: 2,
    inicio_medicao: '2025-01-01',
    fim_medicao: '2025-12-31',
    ...extra,
});

describe('indicador', () => {
    let legado: Sessao;
    let ps: Sessao;
    let semPrivilegio: Sessao;
    let pdm: { id: number };

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        ps = await gestorPS();
        semPrivilegio = await criarPessoaSemPrivilegios();
        pdm = await criarPdmAntigo();
    });

    describe('/api/indicador (Programa de Metas legado)', () => {
        it('401 sem token e 403 sem CadastroMeta.administrador_no_pdm', async () => {
            assertStatus(await api().get('/api/indicador?meta_id=1'), 401);

            const meta = await criarMetaLegado(legado, pdm.id);
            const res = await api(semPrivilegio)
                .post('/api/indicador')
                .send(dadosIndicador({ meta_id: meta }));
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 com polaridade, periodicidade ou casas_decimais inválidos', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            assertStatus(
                await api(legado)
                    .post('/api/indicador')
                    .send(dadosIndicador({ meta_id: meta, polaridade: 'Alta' })),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/indicador')
                    .send(dadosIndicador({ meta_id: meta, periodicidade: 'Diaria' })),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/indicador')
                    .send(dadosIndicador({ meta_id: meta, casas_decimais: 13 })),
                400
            );
        });

        it('400 sem nenhum vínculo (meta, iniciativa ou atividade)', async () => {
            const res = await api(legado).post('/api/indicador').send(dadosIndicador());
            assertStatus(res, 400);
            assert.match(res.body.message, /no mínimo 1 relacionamento/);
        });

        it('400 ao listar sem meta_id, iniciativa_id ou atividade_id', async () => {
            const res = await api(legado).get('/api/indicador');
            assertStatus(res, 400);
            assert.match(res.body.message, /no mínimo 1 relacionamento/);
        });

        it('400 quando a meta já tem indicador', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            await criarIndicadorLegado(legado, meta);
            const segundo = await api(legado)
                .post('/api/indicador')
                .send(dadosIndicador({ meta_id: meta }));
            assertStatus(segundo, 400);
            assert.match(segundo.body.message, /Já existe um indicador/);
        });

        it('cria, lista pela meta e edita, sem enxergar indicador de outra meta', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const outraMeta = await criarMetaLegado(legado, pdm.id);
            const titulo = uniq('Indicador CRUD');
            const id = await criarIndicadorLegado(legado, meta, {
                titulo,
                polaridade: 'Negativa',
                periodicidade: 'Anual',
            });
            const idOutro = await criarIndicadorLegado(legado, outraMeta);

            const lista = await api(legado).get(`/api/indicador?meta_id=${meta}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.ok(linha, 'indicador criado não aparece na listagem da meta');
            assert.equal(linha.titulo, titulo);
            assert.equal(linha.polaridade, 'Negativa');
            assert.equal(linha.periodicidade, 'Anual');
            assert.equal(linha.meta_id, meta);
            assert.ok(!lista.body.linhas.some((l: { id: number }) => l.id === idOutro));

            const porId = await api(legado).get(`/api/indicador?id=${id}`);
            assert.equal(porId.body.linhas[0].meta_id, meta);

            const novoTitulo = uniq('Indicador editado');
            assertStatus(await api(legado).patch(`/api/indicador/${id}`).send({ titulo: novoTitulo }), 200);
            const depois = await api(legado).get(`/api/indicador?meta_id=${meta}`);
            assert.equal(depois.body.linhas.find((l: { id: number }) => l.id === id).titulo, novoTitulo);
        });

        it('serie do indicador responde e a remoção o tira da listagem', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const id = await criarIndicadorLegado(legado, meta);

            const serie = await api(legado).get(`/api/indicador/${id}/serie`);
            assertStatus(serie, 200);
            assert.ok(Array.isArray(serie.body.linhas));
            assert.equal(serie.body.variavel, undefined);

            assertStatus(await api(legado).delete(`/api/indicador/${id}`), 202);
            const lista = await api(legado).get(`/api/indicador?meta_id=${meta}`);
            assert.ok(!lista.body.linhas.some((l: { id: number }) => l.id === id));
        });

        it('indicador de iniciativa é listado pela iniciativa, não pela meta', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);
            const criado = await api(legado)
                .post('/api/indicador')
                .send(dadosIndicador({ iniciativa_id: iniciativa }));
            assertStatus(criado, 201);

            const daIniciativa = await api(legado).get(`/api/indicador?iniciativa_id=${iniciativa}`);
            assert.ok(daIniciativa.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const daMeta = await api(legado).get(`/api/indicador?meta_id=${meta}`);
            assert.ok(!daMeta.body.linhas.some((l: { id: number }) => l.id === criado.body.id));
        });

        it(
            '400 sem inicio_medicao, que a tabela exige',
            {
                todo: 'BUG: inicio_medicao e fim_medicao são IsOptional no DTO, mas NOT NULL no banco: 500 em vez de 400',
            },
            async () => {
                const meta = await criarMetaLegado(legado, pdm.id);
                const dados = dadosIndicador({ meta_id: meta });
                delete (dados as Record<string, unknown>).inicio_medicao;
                assertStatus(await api(legado).post('/api/indicador').send(dados), 400);
            }
        );
    });

    describe('/api/plano-setorial-indicador (Plano Setorial)', () => {
        let psPdm: { id: number };
        let admin: Sessao;

        before(async () => {
            psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            admin = await criarPessoaComPrivilegios(['CadastroPS.administrador']);
        });

        it('403 sem privilégio de Plano Setorial', async () => {
            const res = await api(semPrivilegio, { sistema: 'PlanoSetorial' }).get(
                '/api/plano-setorial-indicador?meta_id=1'
            );
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });

        it('cria, lista e edita indicador de PS', async () => {
            const meta = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const cliente = api(ps, { sistema: 'PlanoSetorial' });

            const criado = await cliente.post('/api/plano-setorial-indicador').send(dadosIndicador({ meta_id: meta }));
            assertStatus(criado, 201);

            const lista = await cliente.get(`/api/plano-setorial-indicador?meta_id=${meta}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === criado.body.id));

            const titulo = uniq('PS indicador editado');
            assertStatus(await cliente.patch(`/api/plano-setorial-indicador/${criado.body.id}`).send({ titulo }), 200);
            const depois = await cliente.get(`/api/plano-setorial-indicador?meta_id=${meta}`);
            assert.equal(depois.body.linhas.find((l: { id: number }) => l.id === criado.body.id).titulo, titulo);
        });

        it('não associa variável a indicador de PDM legado', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const indicador = await criarIndicadorLegado(legado, meta);

            const res = await api(admin, { sistema: 'PlanoSetorial' })
                .patch(`/api/plano-setorial-indicador/${indicador}/associar-variavel`)
                .send({ variavel_ids: [1] });
            assertStatus(res, 400);
            assert.match(res.body.message, /Operação não permitida para PDMs antigos/);
        });

        it('listagem de PS recusa meta de PDM legado', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            await criarIndicadorLegado(legado, meta);

            const res = await api(admin, { sistema: 'PlanoSetorial' }).get(
                `/api/plano-setorial-indicador?meta_id=${meta}`
            );
            assertStatus(res, 400);
            assert.match(res.body.message, /Meta não pode ser encontrada/);
        });
    });
});
