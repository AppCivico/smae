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
    loginAsSuperAdmin,
    Sessao,
    uniq,
} from '../lib';
import {
    criarCronogramaLegado,
    criarIndicadorLegado,
    criarIniciativaLegado,
    criarMetaLegado,
    criarMetaPS,
    gestorLegado,
    gestorPDM,
    gestorPS,
    responsaveisLegado,
} from '../pdm/_helpers';

describe('meta', () => {
    let legado: Sessao;
    let ps: Sessao;
    let semPrivilegio: Sessao;
    let pdmLegado: { id: number };

    before(async () => {
        await bootApp();
        legado = await gestorLegado();
        ps = await gestorPS();
        semPrivilegio = await criarPessoaSemPrivilegios();
        pdmLegado = await criarPdmAntigo();
    });

    describe('/api/meta (Programa de Metas legado)', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/meta'), 401);
            assertStatus(await api().post('/api/meta').send({}), 401);
        });

        it('403 sem CadastroMeta.administrador_no_pdm', async () => {
            const res = await api(semPrivilegio)
                .post('/api/meta')
                .send({ codigo: uniq(), titulo: uniq(), pdm_id: pdmLegado.id, ...responsaveisLegado(semPrivilegio) });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroMeta\.administrador_no_pdm/);
        });

        it('400 sem codigo, titulo ou pdm_id', async () => {
            assertStatus(
                await api(legado)
                    .post('/api/meta')
                    .send({ titulo: uniq(), pdm_id: pdmLegado.id, ...responsaveisLegado(legado) }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/meta')
                    .send({ codigo: uniq(), pdm_id: pdmLegado.id, ...responsaveisLegado(legado) }),
                400
            );
            assertStatus(
                await api(legado)
                    .post('/api/meta')
                    .send({ codigo: uniq(), titulo: uniq(), ...responsaveisLegado(legado) }),
                400
            );
        });

        it('400 sem orgaos_participantes ou coordenadores_cp, que são obrigatórios no PDM', async () => {
            const semOrgaos = await api(legado)
                .post('/api/meta')
                .send({ codigo: uniq(), titulo: uniq(), pdm_id: pdmLegado.id, coordenadores_cp: [legado.pessoa.id] });
            assertStatus(semOrgaos, 400);
            assert.match(semOrgaos.body.message, /orgaos_participantes é obrigatório para PDM/);

            const semCoordenadores = await api(legado)
                .post('/api/meta')
                .send({
                    codigo: uniq(),
                    titulo: uniq(),
                    pdm_id: pdmLegado.id,
                    ...responsaveisLegado(legado),
                    coordenadores_cp: [],
                });
            assertStatus(semCoordenadores, 400);
            assert.match(semCoordenadores.body.message, /coordenadores_cp é obrigatório para PDM/);
        });

        it('400 com codigo ou titulo repetidos no mesmo PDM (sem diferenciar maiúsculas)', async () => {
            const codigo = uniq('COD');
            const titulo = uniq('Titulo');
            await criarMetaLegado(legado, pdmLegado.id, { codigo, titulo });

            const codigoRepetido = await api(legado)
                .post('/api/meta')
                .send({
                    codigo: codigo.toUpperCase(),
                    titulo: uniq(),
                    pdm_id: pdmLegado.id,
                    ...responsaveisLegado(legado),
                });
            assertStatus(codigoRepetido, 400);
            assert.match(codigoRepetido.body.message, /Já existe meta com este código/);

            const tituloRepetido = await api(legado)
                .post('/api/meta')
                .send({
                    codigo: uniq('COD'),
                    titulo: titulo.toUpperCase(),
                    pdm_id: pdmLegado.id,
                    ...responsaveisLegado(legado),
                });
            assertStatus(tituloRepetido, 400);
            assert.match(tituloRepetido.body.message, /Já existe meta com este título/);
        });

        it('cria, consulta, edita e lista só as metas do PDM pedido', async () => {
            const outroPdm = await criarPdmAntigo();
            const metaOutro = await criarMetaLegado(legado, outroPdm.id);

            const titulo = uniq('Meta CRUD');
            const codigo = uniq('CRUD');
            const criada = await api(legado)
                .post('/api/meta')
                .send({
                    codigo,
                    titulo,
                    pdm_id: pdmLegado.id,
                    contexto: 'Contexto E2E',
                    ...responsaveisLegado(legado),
                });
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            const consulta = await api(legado).get(`/api/meta/${id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.id, id);
            assert.equal(consulta.body.codigo, codigo);
            assert.equal(consulta.body.titulo, titulo);
            assert.equal(consulta.body.pdm_id, pdmLegado.id);
            assert.equal(consulta.body.contexto, 'Contexto E2E');
            assert.deepEqual(
                consulta.body.coordenadores_cp.map((c: { id: number }) => c.id),
                [legado.pessoa.id]
            );
            assert.equal(consulta.body.orgaos_participantes[0].orgao.id, legado.pessoa.orgao_id);

            const lista = await api(legado).get(`/api/meta?pdm_id=${pdmLegado.id}`);
            assertStatus(lista, 200);
            const ids = lista.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(id));
            assert.ok(!ids.includes(metaOutro));

            const novoTitulo = uniq('Meta editada');
            assertStatus(await api(legado).patch(`/api/meta/${id}`).send({ titulo: novoTitulo }), 200);
            const depois = await api(legado).get(`/api/meta/${id}`);
            assert.equal(depois.body.titulo, novoTitulo);
        });

        it('404 ao consultar meta inexistente ou removida', async () => {
            const meta = await criarMetaLegado(legado, pdmLegado.id);
            assertStatus(await api(legado).delete(`/api/meta/${meta}`), 202);

            const res = await api(legado).get(`/api/meta/${meta}`);
            assertStatus(res, 404);
            assert.match(res.body.message, /Meta não encontrada/);
        });

        it('400 ao remover meta com indicador ativo, e libera depois de remover o indicador', async () => {
            const meta = await criarMetaLegado(legado, pdmLegado.id);
            const indicador = await criarIndicadorLegado(legado, meta);

            const bloqueada = await api(legado).delete(`/api/meta/${meta}`);
            assertStatus(bloqueada, 400);
            assert.match(bloqueada.body.message, /indicadores ativos associados/);

            assertStatus(await api(legado).delete(`/api/indicador/${indicador}`), 202);
            assertStatus(await api(legado).delete(`/api/meta/${meta}`), 202);
        });

        it('400 ao remover meta com cronograma ativo', async () => {
            const meta = await criarMetaLegado(legado, pdmLegado.id);
            await criarCronogramaLegado(legado, meta);

            const res = await api(legado).delete(`/api/meta/${meta}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /cronogramas ativos associados/);
        });

        it('devolve iniciativas e atividades pelo iniciativas-atividades', async () => {
            const meta = await criarMetaLegado(legado, pdmLegado.id);
            const iniciativa = await criarIniciativaLegado(legado, meta);

            const res = await api(legado).get(`/api/meta/iniciativas-atividades?meta_ids=${meta}`);
            assertStatus(res, 200);
            assert.equal(res.body.linhas.length, 1);
            assert.equal(res.body.linhas[0].id, meta);
            assert.equal(res.body.linhas[0].iniciativas[0].id, iniciativa);
        });
    });

    describe('/api/plano-setorial-meta (Plano Setorial e Programa de Metas novo)', () => {
        let psPdm: { id: number };
        let admin: Sessao;

        before(async () => {
            psPdm = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            admin = await loginAsSuperAdmin();
        });

        it('401 sem token e 403 sem privilégio de Plano Setorial', async () => {
            assertStatus(await api(undefined, { sistema: 'PlanoSetorial' }).get('/api/plano-setorial-meta'), 401);

            const res = await api(semPrivilegio, { sistema: 'PlanoSetorial' }).get('/api/plano-setorial-meta');
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });

        it('400 sem codigo, titulo ou pdm_id', async () => {
            assertStatus(
                await api(ps, { sistema: 'PlanoSetorial' })
                    .post('/api/plano-setorial-meta')
                    .send({ codigo: uniq(), pdm_id: psPdm.id }),
                400
            );
        });

        it('cria, consulta, edita e remove uma meta de PS sem orgãos participantes', async () => {
            const id = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const cliente = api(ps, { sistema: 'PlanoSetorial' });

            const consulta = await cliente.get(`/api/plano-setorial-meta/${id}`);
            assertStatus(consulta, 200);
            assert.equal(consulta.body.id, id);
            assert.equal(consulta.body.pdm_id, psPdm.id);

            const lista = await cliente.get(`/api/plano-setorial-meta?pdm_id=${psPdm.id}`);
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas.some((l: { id: number }) => l.id === id));

            const titulo = uniq('PS editada');
            assertStatus(await cliente.patch(`/api/plano-setorial-meta/${id}`).send({ titulo }), 200);
            assert.equal((await cliente.get(`/api/plano-setorial-meta/${id}`)).body.titulo, titulo);

            assertStatus(await cliente.delete(`/api/plano-setorial-meta/${id}`), 202);
            assertStatus(await cliente.get(`/api/plano-setorial-meta/${id}`), 404);
        });

        it('400 com codigo repetido no mesmo Plano Setorial', async () => {
            const codigo = uniq('PSCOD');
            await criarMetaPS(ps, psPdm.id, 'PlanoSetorial', { codigo });
            const res = await api(ps, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial-meta')
                .send({ codigo, titulo: uniq(), pdm_id: psPdm.id });
            assertStatus(res, 400);
            assert.match(res.body.message, /Já existe meta com este código/);
        });

        it('isola Programa de Metas novo de Plano Setorial pelo smae-sistemas', async () => {
            const pdmNovo = await criarPlanoSetorial({ sistema: 'ProgramaDeMetas' });
            const metaPDM = await criarMetaPS(await gestorPDM(), pdmNovo.id, 'ProgramaDeMetas');
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');
            const dono = await criarPessoaComPrivilegios(['CadastroPS.administrador', 'CadastroPDM.administrador']);

            const gestorPdmNoPdm = await gestorPDM();
            assertStatus(
                await api(gestorPdmNoPdm, { sistema: 'ProgramaDeMetas' }).get(`/api/plano-setorial-meta/${metaPDM}`),
                200
            );
            assertStatus(
                await api(dono, { sistema: 'ProgramaDeMetas' }).get(`/api/plano-setorial-meta/${metaPDM}`),
                200
            );
            assertStatus(await api(dono, { sistema: 'PlanoSetorial' }).get(`/api/plano-setorial-meta/${metaPDM}`), 404);
            assertStatus(
                await api(dono, { sistema: 'ProgramaDeMetas' }).get(`/api/plano-setorial-meta/${metaPS}`),
                404
            );
            assertStatus(await api(dono, { sistema: 'PlanoSetorial' }).get(`/api/plano-setorial-meta/${metaPS}`), 200);
        });

        it('isola metas: meta de PDM legado não aparece no Plano Setorial, e o contrário', async () => {
            const metaLegado = await criarMetaLegado(legado, pdmLegado.id);
            const metaPS = await criarMetaPS(ps, psPdm.id, 'PlanoSetorial');

            const naPS = await api(admin, { sistema: 'PlanoSetorial' }).get(`/api/plano-setorial-meta/${metaLegado}`);
            assertStatus(naPS, 404);

            const criarNoLegado = await api(admin, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial-meta')
                .send({ codigo: uniq(), titulo: uniq(), pdm_id: pdmLegado.id });
            assertStatus(criarNoLegado, 404);

            const naLista = await api(legado).get(`/api/meta?pdm_id=${pdmLegado.id}`);
            assert.ok(!naLista.body.linhas.some((l: { id: number }) => l.id === metaPS));
        });
    });
});
