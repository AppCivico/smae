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
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('pdm', () => {
    let criador: Sessao;
    let editor: Sessao;
    let ativador: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        criador = await criarPessoaComPrivilegios(['CadastroPdm.inserir']);
        editor = await criarPessoaComPrivilegios(['CadastroPdm.editar']);
        ativador = await criarPessoaComPrivilegios(['CadastroPdm.editar', 'CadastroPdm.ativar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('/api/pdm (Programa de Metas legado)', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/pdm'), 401);
            assertStatus(await api().post('/api/pdm').send({ nome: uniq(), prefeito: 'X' }), 401);
        });

        it('403 sem CadastroPdm.inserir e sem perfil de PDM', async () => {
            const criar = await api(semPrivilegio)
                .post('/api/pdm')
                .send({ nome: uniq(), prefeito: 'X', nivel_orcamento: 'Meta' });
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroPdm\.inserir/);

            const listar = await api(semPrivilegio).get('/api/pdm');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /Programa de Metas/);
        });

        it('400 sem nivel_orcamento e com possui_atividade sem possui_iniciativa', async () => {
            const semNivel = await api(criador).post('/api/pdm').send({ nome: uniq(), prefeito: 'X' });
            assertStatus(semNivel, 400);
            assert.match(semNivel.body.message, /Nível de Orçamento é obrigatório/);

            const atividadeSemIniciativa = await api(criador).post('/api/pdm').send({
                nome: uniq(),
                prefeito: 'X',
                nivel_orcamento: 'Meta',
                possui_atividade: true,
                possui_iniciativa: false,
            });
            assertStatus(atividadeSemIniciativa, 400);
            assert.match(atividadeSemIniciativa.body.message, /possui_iniciativa/);
        });

        it('400 sem nome', async () => {
            assertStatus(await api(criador).post('/api/pdm').send({ prefeito: 'X', nivel_orcamento: 'Meta' }), 400);
        });

        it('400 com nome repetido (sem diferenciar maiúsculas)', async () => {
            const nome = uniq('PDM repetido');
            await criarPdmAntigo({ nome });
            const repetido = await api(criador)
                .post('/api/pdm')
                .send({ nome: nome.toUpperCase(), prefeito: 'X', nivel_orcamento: 'Meta' });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /já existe/);
        });

        it('cria, consulta com auxiliares e edita', async () => {
            const nome = uniq('PDM CRUD');
            const criado = await api(criador)
                .post('/api/pdm')
                .send({ nome, prefeito: 'Prefeita E2E', nivel_orcamento: 'Meta' });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(editor).get(`/api/pdm?id=${id}`);
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.equal(linha.nome, nome);
            assert.equal(linha.ativo, false);

            const detalhe = await api(editor).get(`/api/pdm/${id}?incluir_auxiliares=true`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.pdm.id, id);
            assert.equal(detalhe.body.pdm.nome, nome);
            assert.ok(Array.isArray(detalhe.body.tema));

            const semNivel = await api(editor).patch(`/api/pdm/${id}`).send({ nome: uniq() });
            assertStatus(semNivel, 400);
            assert.match(semNivel.body.message, /Nível de Orçamento é obrigatório no PDM/);

            const novoNome = uniq('PDM editado');
            assertStatus(
                await api(editor).patch(`/api/pdm/${id}`).send({ nome: novoNome, nivel_orcamento: 'Meta' }),
                200
            );
            const depois = await api(editor).get(`/api/pdm/${id}`);
            assert.equal(depois.body.nome, novoNome);
        });

        it('403 ao ativar sem CadastroPdm.ativar, e ativar um PDM desativa o anterior', async () => {
            const primeiro = await criarPdmAntigo();
            const segundo = await criarPdmAntigo();

            const semAtivar = await api(editor)
                .patch(`/api/pdm/${primeiro.id}`)
                .send({ ativo: true, nivel_orcamento: 'Meta' });
            assertStatus(semAtivar, 403);
            assert.match(semAtivar.body.message, /ativar Programas de Metas/);

            assertStatus(
                await api(ativador).patch(`/api/pdm/${primeiro.id}`).send({ ativo: true, nivel_orcamento: 'Meta' }),
                200
            );
            assertStatus(
                await api(ativador).patch(`/api/pdm/${segundo.id}`).send({ ativo: true, nivel_orcamento: 'Meta' }),
                200
            );

            const antigo = await prisma().pdm.findUniqueOrThrow({ where: { id: primeiro.id } });
            const novo = await prisma().pdm.findUniqueOrThrow({ where: { id: segundo.id } });
            assert.equal(antigo.ativo, false);
            assert.equal(novo.ativo, true);
        });
    });

    describe('/api/plano-setorial (Plano Setorial e Programa de Metas novo)', () => {
        let admin: Sessao;

        before(async () => {
            admin = await loginAsSuperAdmin();
        });

        it('401 sem token', async () => {
            assertStatus(await api().get('/api/plano-setorial'), 401);
            assertStatus(await api().get('/api/plano-setorial/1'), 401);
        });

        it('403 sem privilégio de Plano Setorial', async () => {
            const res = await api(semPrivilegio, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial')
                .send({
                    nome: uniq('PS'),
                    prefeito: 'X',
                });
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });

        it('400 sem nome e sem órgão administrador para quem não é administrador geral', async () => {
            assertStatus(
                await api(admin, { sistema: 'PlanoSetorial' }).post('/api/plano-setorial').send({ prefeito: 'X' }),
                400
            );

            const administradorDeOrgao = await criarPessoaComPrivilegios(['CadastroPS.administrador_no_orgao']);
            const res = await api(administradorDeOrgao, { sistema: 'PlanoSetorial' })
                .post('/api/plano-setorial')
                .send({ nome: uniq('PS'), prefeito: 'X', equipe_tecnica: null });
            assertStatus(res, 400);
            assert.match(res.body.message, /Órgão Administrador é obrigatório/);
        });

        it('403 com smae-sistemas de outro módulo, pois os privilégios de PS somem da sessão', async () => {
            const res = await api(admin, { sistema: 'Projetos' }).get('/api/plano-setorial');
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroPS\.administrador/);
        });

        it('cria, lista, consulta, edita e remove um Plano Setorial', async () => {
            const ps = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const cliente = api(admin, { sistema: 'PlanoSetorial' });

            const lista = await cliente.get(`/api/plano-setorial?id=${ps.id}`);
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas[0].id, ps.id);
            assert.equal(lista.body.linhas[0].nome, ps.nome);

            const detalhe = await cliente.get(`/api/plano-setorial/${ps.id}?incluir_auxiliares=true`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.pdm.id, ps.id);
            assert.equal(detalhe.body.pdm.prefeito, 'Prefeito E2E');

            const novoPrefeito = uniq('Prefeito novo');
            assertStatus(await cliente.patch(`/api/plano-setorial/${ps.id}`).send({ prefeito: novoPrefeito }), 200);
            const editado = await cliente.get(`/api/plano-setorial/${ps.id}`);
            assert.equal(editado.body.prefeito, novoPrefeito);

            assertStatus(await cliente.delete(`/api/plano-setorial/${ps.id}`), 204);
            const depois = await cliente.get(`/api/plano-setorial?id=${ps.id}`);
            assert.equal(depois.body.linhas.length, 0);
        });

        it('isola Plano Setorial de Programa de Metas pelo smae-sistemas', async () => {
            const dono = await criarPessoaComPrivilegios(['CadastroPS.administrador', 'CadastroPDM.administrador']);
            const ps = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const pdm = await criarPlanoSetorial({ sistema: 'ProgramaDeMetas' });

            const naPS = await api(dono, { sistema: 'PlanoSetorial' }).get('/api/plano-setorial');
            assertStatus(naPS, 200);
            const idsPS = naPS.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(idsPS.includes(ps.id));
            assert.ok(!idsPS.includes(pdm.id));

            const noPDM = await api(dono, { sistema: 'ProgramaDeMetas' }).get('/api/plano-setorial');
            assertStatus(noPDM, 200);
            const idsPDM = noPDM.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(idsPDM.includes(pdm.id));
            assert.ok(!idsPDM.includes(ps.id));

            const soPS = await criarPessoaComPrivilegios(['CadastroPS.administrador']);
            assertStatus(await api(soPS, { sistema: 'ProgramaDeMetas' }).get('/api/plano-setorial'), 400);
        });

        it('400 ao enviar pdm_anteriores que não são Plano Setorial, e 400 ao remover um PS referenciado', async () => {
            const legado = await criarPdmAntigo();
            const invalido = await api(admin, { sistema: 'ProgramaDeMetas' })
                .post('/api/plano-setorial')
                .send({ nome: uniq('PDM novo'), prefeito: 'X', orgao_admin_id: 1, pdm_anteriores: [legado.id] });
            assertStatus(invalido, 400);
            assert.match(invalido.body.message, /Plano Setoriais anteriores não são válidos/);

            const anterior = await criarPlanoSetorial({ sistema: 'PlanoSetorial' });
            const novo = await api(admin, { sistema: 'ProgramaDeMetas' })
                .post('/api/plano-setorial')
                .send({ nome: uniq('PDM novo'), prefeito: 'X', orgao_admin_id: 1, pdm_anteriores: [anterior.id] });
            assertStatus(novo, 201);

            const remocao = await api(admin, { sistema: 'PlanoSetorial' }).delete(`/api/plano-setorial/${anterior.id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /referenciado como anterior/);
        });
    });
});
