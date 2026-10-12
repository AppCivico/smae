import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaSemPrivilegios,
    criarPlanoSetorial,
    Sessao,
    uniq,
} from '../lib';
import {
    criarIniciativaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPS,
    responsaveisLegado,
} from '../pdm/_helpers';

describe('iniciativa', () => {
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

    describe('/api/iniciativa (Programa de Metas legado)', () => {
        it('401 sem token e 403 sem CadastroMeta.administrador_no_pdm', async () => {
            assertStatus(await api().get('/api/iniciativa'), 401);

            const meta = await criarMetaLegado(legado, pdm.id);
            const res = await api(semPrivilegio)
                .post('/api/iniciativa')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    meta_id: meta,
                    compoe_indicador_meta: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 sem meta_id, titulo ou compoe_indicador_meta booleano', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const base = { codigo: uniq(), titulo: uniq(), ...responsaveisLegado(legado) };

            assertStatus(
                await api(legado)
                    .post('/api/iniciativa')
                    .send({ ...base, compoe_indicador_meta: false }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/iniciativa')
                    .send({ ...base, meta_id: meta, titulo: undefined, compoe_indicador_meta: false }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/iniciativa')
                    .send({ ...base, meta_id: meta, compoe_indicador_meta: 'sim' }),
                400
            );
        });

        it('400 sem orgaos_participantes, que é obrigatório no PDM', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const res = await api(legado)
                .post('/api/iniciativa')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    meta_id: meta,
                    compoe_indicador_meta: false,
                    coordenadores_cp: [legado.pessoa.id],
                });
            assertStatus(res, 400);
            assert.match(res.body.message, /orgaos_participantes é obrigatório para PDM/);
        });

        it('400 com codigo ou titulo repetidos dentro da mesma meta, mas não em outra meta', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const outraMeta = await criarMetaLegado(legado, pdm.id);
            const codigo = uniq('INI');
            const titulo = uniq('Iniciativa');
            await criarIniciativaLegado(legado, meta, { codigo, titulo });

            const codigoRepetido = await api(legado)
                .post('/api/iniciativa')
                .send({
                    codigo,
                    titulo: uniq(),
                    meta_id: meta,
                    compoe_indicador_meta: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(codigoRepetido, 400);
            assert.match(codigoRepetido.body.message, /Já existe iniciativa com este código nesta meta/);

            const tituloRepetido = await api(legado)
                .post('/api/iniciativa')
                .send({
                    codigo: uniq('INI'),
                    titulo: titulo.toUpperCase(),
                    meta_id: meta,
                    compoe_indicador_meta: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(tituloRepetido, 400);
            assert.match(tituloRepetido.body.message, /Já existe iniciativa com este título nesta meta/);

            await criarIniciativaLegado(legado, outraMeta, { codigo, titulo });
        });

        it('cria, consulta, lista por meta e edita', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const outraMeta = await criarMetaLegado(legado, pdm.id);
            const codigo = uniq('INI');
            const titulo = uniq('Iniciativa CRUD');
            const id = await criarIniciativaLegado(legado, meta, { codigo, titulo, contexto: 'Contexto' });
            const idOutra = await criarIniciativaLegado(legado, outraMeta);

            const consulta = await api(legado).get(`/api/iniciativa/${id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.id, id);
            assert.equal(consulta.body.meta_id, meta);
            assert.equal(consulta.body.codigo, codigo);
            assert.equal(consulta.body.titulo, titulo);
            assert.equal(consulta.body.compoe_indicador_meta, false);

            const lista = await api(legado).get(`/api/iniciativa?meta_id=${meta}`);
            assertStatus(lista, 200);
            const ids = lista.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(id));
            assert.ok(!ids.includes(idOutra));

            const novoTitulo = uniq('Iniciativa editada');
            assertStatus(await api(legado).patch(`/api/iniciativa/${id}`).send({ titulo: novoTitulo }), 200);
            assert.equal((await api(legado).get(`/api/iniciativa/${id}`)).body.titulo, novoTitulo);
        });

        it('desativada não aceita atividade nova, e removida some das listagens', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const id = await criarIniciativaLegado(legado, meta);

            assertStatus(await api(legado).patch(`/api/iniciativa/${id}`).send({ ativo: false }), 200);
            const desativada = await api(legado).get(`/api/iniciativa/${id}`);
            assert.equal(desativada.body.ativo, false);

            const atividade = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: uniq('ATV'),
                    titulo: uniq('Atividade'),
                    iniciativa_id: id,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(atividade, 400);
            assert.match(atividade.body.message, /Iniciativa está desativada/);

            assertStatus(await api(legado).delete(`/api/iniciativa/${id}`), 202);
            assertStatus(await api(legado).get(`/api/iniciativa/${id}`), 404);
            const lista = await api(legado).get(`/api/iniciativa?meta_id=${meta}`);
            assert.ok(!lista.body.linhas.some((l: { id: number }) => l.id === id));
        });

        it('400 ao remover iniciativa com indicador ativo', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const id = await criarIniciativaLegado(legado, meta);
            const indicador = await api(legado)
                .post('/api/indicador')
                .send({
                    codigo: uniq('IND'),
                    titulo: uniq('Indicador da iniciativa'),
                    polaridade: 'Neutra',
                    periodicidade: 'Mensal',
                    regionalizavel: false,
                    casas_decimais: 0,
                    inicio_medicao: '2025-01-01',
                    fim_medicao: '2025-12-31',
                    iniciativa_id: id,
                });
            assertStatus(indicador, 201);

            const res = await api(legado).delete(`/api/iniciativa/${id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /indicadores ativos associados/);
        });
    });

    describe('/api/plano-setorial-iniciativa (Plano Setorial)', () => {
        let psPdm: { id: number };

        before(async () => {
            psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
        });

        it('cria e consulta iniciativa de PS sem orgaos participantes', async () => {
            const meta = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const cliente = api(ps, { sistema: 'PlanoSetorial' });
            const criada = await cliente.post('/api/plano-setorial-iniciativa').send({
                meta_id: meta,
                codigo: uniq('PSI'),
                titulo: uniq('Iniciativa PS'),
                compoe_indicador_meta: true,
            });
            assertStatus(criada, 201);

            const consulta = await cliente.get(`/api/plano-setorial-iniciativa/${criada.body.id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.meta_id, meta);
            assert.equal(consulta.body.compoe_indicador_meta, true);
        });

        it('iniciativa de PDM legado não é encontrada pela rota de PS', async () => {
            const metaLegado = await criarMetaLegado(legado, pdm.id);
            const iniciativaLegado = await criarIniciativaLegado(legado, metaLegado);

            const res = await api(ps, { sistema: 'PlanoSetorial' }).get(
                `/api/plano-setorial-iniciativa/${iniciativaLegado}`
            );
            assertStatus(res, 404);
            assert.match(res.body.message, /Iniciativa não encontrada/);
        });
    });
});
