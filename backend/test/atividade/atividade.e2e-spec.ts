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
    criarAtividadeLegado,
    criarIniciativaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPS,
    responsaveisLegado,
} from '../pdm/_helpers';

describe('atividade', () => {
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

    describe('/api/atividade (Programa de Metas legado)', () => {
        it('401 sem token e 403 sem CadastroMeta.administrador_no_pdm', async () => {
            assertStatus(await api().get('/api/atividade'), 401);

            const iniciativa = await criarIniciativaLegado(legado, await criarMetaLegado(legado, pdm.id));
            const res = await api(semPrivilegio)
                .post('/api/atividade')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    iniciativa_id: iniciativa,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 sem iniciativa_id, codigo ou compoe_indicador_iniciativa', async () => {
            const iniciativa = await criarIniciativaLegado(legado, await criarMetaLegado(legado, pdm.id));
            const base = { codigo: uniq(), titulo: uniq(), ...responsaveisLegado(legado) };

            assertStatus(
                await api(legado)
                    .post('/api/atividade')
                    .send({ ...base, compoe_indicador_iniciativa: false }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/atividade')
                    .send({
                        ...base,
                        codigo: undefined,
                        iniciativa_id: iniciativa,
                        compoe_indicador_iniciativa: false,
                    }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/atividade')
                    .send({ ...base, iniciativa_id: iniciativa }),
                400
            );
        });

        it('400 sem orgaos_participantes ou coordenadores_cp, que são obrigatórios no PDM', async () => {
            const iniciativa = await criarIniciativaLegado(legado, await criarMetaLegado(legado, pdm.id));
            const semOrgaos = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    iniciativa_id: iniciativa,
                    compoe_indicador_iniciativa: false,
                    coordenadores_cp: [legado.pessoa.id],
                });
            assertStatus(semOrgaos, 400);
            assert.match(semOrgaos.body.message, /Precisa ter pelo menos um orgão participante/);

            const semCoordenadores = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    iniciativa_id: iniciativa,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                    coordenadores_cp: [],
                });
            assertStatus(semCoordenadores, 400);
            assert.match(semCoordenadores.body.message, /coordenador responsável/);
        });

        it('404 com iniciativa inexistente', async () => {
            const res = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    iniciativa_id: 999999,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(res, 404);
        });

        it('400 com codigo ou titulo repetidos na mesma iniciativa, mas não em outra', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);
            const outra = await criarIniciativaLegado(legado, meta);
            const codigo = uniq('ATV');
            const titulo = uniq('Atividade');
            await criarAtividadeLegado(legado, iniciativa, { codigo, titulo });

            const codigoRepetido = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: codigo.toUpperCase(),
                    titulo: uniq(),
                    iniciativa_id: iniciativa,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(codigoRepetido, 400);
            assert.match(codigoRepetido.body.message, /Já existe atividade com este código nesta iniciativa/);

            const tituloRepetido = await api(legado)
                .post('/api/atividade')
                .send({
                    codigo: uniq('ATV'),
                    titulo: titulo.toUpperCase(),
                    iniciativa_id: iniciativa,
                    compoe_indicador_iniciativa: false,
                    ...responsaveisLegado(legado),
                });
            assertStatus(tituloRepetido, 400);
            assert.match(tituloRepetido.body.message, /Já existe atividade com este título nesta iniciativa/);

            await criarAtividadeLegado(legado, outra, { codigo, titulo });
        });

        it('cria, consulta, lista por iniciativa, edita e remove', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);
            const outra = await criarIniciativaLegado(legado, meta);
            const codigo = uniq('ATV');
            const titulo = uniq('Atividade CRUD');
            const id = await criarAtividadeLegado(legado, iniciativa, { codigo, titulo, contexto: 'Contexto E2E' });
            const idOutra = await criarAtividadeLegado(legado, outra);

            const consulta = await api(legado).get(`/api/atividade/${id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.id, id);
            assert.equal(consulta.body.iniciativa_id, iniciativa);
            assert.equal(consulta.body.codigo, codigo);
            assert.equal(consulta.body.titulo, titulo);
            assert.equal(consulta.body.compoe_indicador_iniciativa, false);

            const lista = await api(legado).get(`/api/atividade?iniciativa_id=${iniciativa}`);
            assertStatus(lista, 200);
            const ids = lista.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(id));
            assert.ok(!ids.includes(idOutra));

            const novoTitulo = uniq('Atividade editada');
            const semResponsaveis = await api(legado).patch(`/api/atividade/${id}`).send({ titulo: novoTitulo });
            assertStatus(semResponsaveis, 400);
            assert.match(semResponsaveis.body.message, /Precisa ter pelo menos um orgão participante/);
            assertStatus(
                await api(legado)
                    .patch(`/api/atividade/${id}`)
                    .send({ titulo: novoTitulo, ...responsaveisLegado(legado) }),
                200
            );
            assert.equal((await api(legado).get(`/api/atividade/${id}`)).body.titulo, novoTitulo);

            assertStatus(await api(legado).delete(`/api/atividade/${id}`), 202);
            assertStatus(await api(legado).get(`/api/atividade/${id}`), 404);
            const depois = await api(legado).get(`/api/atividade?iniciativa_id=${iniciativa}`);
            assert.ok(!depois.body.linhas.some((l: { id: number }) => l.id === id));
        });

        it('400 ao editar ou remover atividade de iniciativa desativada', async () => {
            const meta = await criarMetaLegado(legado, pdm.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);
            const id = await criarAtividadeLegado(legado, iniciativa);

            assertStatus(await api(legado).patch(`/api/iniciativa/${iniciativa}`).send({ ativo: false }), 200);

            const edicao = await api(legado).patch(`/api/atividade/${id}`).send({ titulo: uniq() });
            assertStatus(edicao, 400);
            assert.match(edicao.body.message, /Iniciativa está desativada/);

            const remocao = await api(legado).delete(`/api/atividade/${id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /Iniciativa está desativada/);
        });
    });

    describe('/api/plano-setorial-atividade (Plano Setorial)', () => {
        let psPdm: { id: number };

        before(async () => {
            psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
        });

        it('cria atividade de PS e não enxerga atividade de PDM legado', async () => {
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const cliente = api(ps, { sistema: 'PlanoSetorial' });
            const iniciativaPS = await cliente.post('/api/plano-setorial-iniciativa').send({
                meta_id: metaPS,
                codigo: uniq('PSI'),
                titulo: uniq('Iniciativa PS'),
                compoe_indicador_meta: false,
            });
            assertStatus(iniciativaPS, 201);

            const criada = await cliente.post('/api/plano-setorial-atividade').send({
                iniciativa_id: iniciativaPS.body.id,
                codigo: uniq('PSA'),
                titulo: uniq('Atividade PS'),
                compoe_indicador_iniciativa: true,
            });
            assertStatus(criada, 201);

            const consulta = await cliente.get(`/api/plano-setorial-atividade/${criada.body.id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.iniciativa_id, iniciativaPS.body.id);

            const metaLegado = await criarMetaLegado(legado, pdm.id);
            const atividadeLegado = await criarAtividadeLegado(legado, await criarIniciativaLegado(legado, metaLegado));
            const naPS = await cliente.get(`/api/plano-setorial-atividade/${atividadeLegado}`);
            assertStatus(naPS, 404);
        });
    });
});
