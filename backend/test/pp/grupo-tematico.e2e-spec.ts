import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
    uniq,
} from '../lib';
import { cenarioObras, criarProjeto } from './_helpers';

describe('grupo-tematico', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'GrupoTematicoMDO.inserir',
            'GrupoTematicoMDO.editar',
            'GrupoTematicoMDO.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/grupo-tematico'), 401);
            assertStatus(await api().post('/api/grupo-tematico').send({ nome: uniq() }), 401);
        });

        it('GET não exige privilégio, só sessão', async () => {
            assertStatus(await api(semPrivilegio).get('/api/grupo-tematico'), 200);
        });

        it('403 sem GrupoTematicoMDO.inserir / editar / remover', async () => {
            const criado = await api(gestor).post('/api/grupo-tematico').send({ nome: uniq() });
            assertStatus(criado, 201);
            const id = criado.body.id;

            const criar = await api(semPrivilegio).post('/api/grupo-tematico').send({ nome: uniq() });
            assertStatus(criar, 403);
            assert.match(criar.body.message, /GrupoTematicoMDO\.inserir/);
            assertStatus(await api(semPrivilegio).patch(`/api/grupo-tematico/${id}`).send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/grupo-tematico/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome', async () => {
            assertStatus(await api(gestor).post('/api/grupo-tematico').send({ programa_habitacional: true }), 400);
        });

        it('400 com flag que não é booleano', async () => {
            const res = await api(gestor)
                .post('/api/grupo-tematico')
                .send({ nome: uniq(), unidades_atendidas: 'sim' });
            assertStatus(res, 400);
        });

        it('400 com :id não numérico', async () => {
            assertStatus(await api(gestor).get('/api/grupo-tematico/abc'), 400);
        });
    });

    describe('CRUD', () => {
        it('cria com as flags, lê com o criador e edita o nome', async () => {
            const nome = uniq('Habitação');
            const criado = await api(gestor).post('/api/grupo-tematico').send({
                nome,
                programa_habitacional: true,
                unidades_habitacionais: true,
                familias_beneficiadas: false,
                unidades_atendidas: true,
            });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/grupo-tematico/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, nome);
            assert.equal(lido.body.programa_habitacional, true);
            assert.equal(lido.body.familias_beneficiadas, false);
            assert.equal(lido.body.criado_por.nome_exibicao, gestor.pessoa.nome_exibicao);

            const novoNome = uniq('Saúde');
            assertStatus(await api(gestor).patch(`/api/grupo-tematico/${id}`).send({ nome: novoNome }), 200);
            const lista = await api(gestor).get('/api/grupo-tematico');
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.equal(linha.nome, novoNome);
            assert.equal(linha.programa_habitacional, true);
        });

        it('400 com nome igual, sem diferenciar maiúsculas', async () => {
            const nome = uniq('Mobilidade');
            assertStatus(await api(gestor).post('/api/grupo-tematico').send({ nome }), 201);
            const dup = await api(gestor).post('/api/grupo-tematico').send({ nome: nome.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /já existe/);
        });

        it('remove (202) e depois 404 ao ler', async () => {
            const criado = await api(gestor).post('/api/grupo-tematico').send({ nome: uniq() });
            assertStatus(await api(gestor).delete(`/api/grupo-tematico/${criado.body.id}`), 202);
            assertStatus(await api(gestor).get(`/api/grupo-tematico/${criado.body.id}`), 404);
        });

        it('404 ao remover id inexistente', async () => {
            assertStatus(await api(gestor).delete('/api/grupo-tematico/999999'), 404);
        });
    });

    describe('com obra vinculada', () => {
        let grupo: { id: number };

        before(async () => {
            const res = await api(gestor)
                .post('/api/grupo-tematico')
                .send({ nome: uniq('Vinculado'), programa_habitacional: false });
            assertStatus(res, 201);
            grupo = { id: res.body.id };
            await criarProjeto(obras.adminMdo, 'MDO', {
                portfolio_id: obras.portfolio.id,
                grupo_tematico_id: grupo.id,
            });
        });

        it('não altera as flags do grupo com obra vinculada (400)', async () => {
            const res = await api(gestor)
                .patch(`/api/grupo-tematico/${grupo.id}`)
                .send({ nome: uniq('Flags'), programa_habitacional: true });
            assertStatus(res, 400);
            assert.match(res.body.message, /Não é possível alterar configurações/);
        });

        it(
            'PATCH só com as flags, sem nome, é aceito',
            {
                todo: 'BUG: PATCH /api/grupo-tematico/:id usa CreateGrupoTematicoDto (nome obrigatório) e ignora UpdateGrupoTematicoDto, então devolve 400 sem nome, embora o service trate nome como opcional',
            },
            async () => {
                assertStatus(await api(gestor).patch(`/api/grupo-tematico/${grupo.id}`).send({ unidades_atendidas: true }), 200);
            }
        );

        it('mas renomeia normalmente', async () => {
            assertStatus(await api(gestor).patch(`/api/grupo-tematico/${grupo.id}`).send({ nome: uniq('Renomeado') }), 200);
        });

        it('não remove grupo com obra vinculada (400)', async () => {
            const res = await api(gestor).delete(`/api/grupo-tematico/${grupo.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /tem obras vinculadas/);
        });
    });
});
