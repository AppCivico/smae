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

describe('empreendimento', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroEmpreendimentoMDO.inserir',
            'CadastroEmpreendimentoMDO.editar',
            'CadastroEmpreendimentoMDO.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    const novo = () => ({ nome: uniq('Conjunto'), identificador: uniq('EMP') });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/empreendimento'), 401);
            assertStatus(await api().post('/api/empreendimento').send(novo()), 401);
        });

        it('403 sem CadastroEmpreendimentoMDO.inserir / editar / remover', async () => {
            const criado = await api(gestor).post('/api/empreendimento').send(novo());
            assertStatus(criado, 201);

            const criar = await api(semPrivilegio).post('/api/empreendimento').send(novo());
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroEmpreendimentoMDO\.inserir/);
            assertStatus(
                await api(semPrivilegio).patch(`/api/empreendimento/${criado.body.id}`).send({ nome: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).delete(`/api/empreendimento/${criado.body.id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem identificador', async () => {
            assertStatus(await api(gestor).post('/api/empreendimento').send({ nome: uniq() }), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lê e edita o identificador', async () => {
            const dados = novo();
            const criado = await api(gestor).post('/api/empreendimento').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/empreendimento/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, dados.nome);
            assert.equal(lido.body.identificador, dados.identificador);

            const novoId = uniq('EMP-NOVO');
            assertStatus(await api(gestor).patch(`/api/empreendimento/${id}`).send({ identificador: novoId }), 200);
            assert.equal((await api(gestor).get(`/api/empreendimento/${id}`)).body.identificador, novoId);
        });

        it('400 com nome ou identificador já usados', async () => {
            const dados = novo();
            assertStatus(await api(gestor).post('/api/empreendimento').send(dados), 201);

            const nomeIgual = await api(gestor)
                .post('/api/empreendimento')
                .send({ nome: dados.nome.toUpperCase(), identificador: uniq() });
            assertStatus(nomeIgual, 400);

            const idIgual = await api(gestor)
                .post('/api/empreendimento')
                .send({ nome: uniq(), identificador: dados.identificador });
            assertStatus(idIgual, 400);
        });

        it(
            'mensagem de identificador repetido no create fala do identificador',
            async () => {
                const dados = novo();
                assertStatus(await api(gestor).post('/api/empreendimento').send(dados), 201);
                const idIgual = await api(gestor)
                    .post('/api/empreendimento')
                    .send({ nome: uniq(), identificador: dados.identificador });
                assert.match(idIgual.body.message, /identificador igual ou semelhante/);
            }
        );

        it('remove (202) e depois 404 ao ler', async () => {
            const criado = await api(gestor).post('/api/empreendimento').send(novo());
            assertStatus(await api(gestor).delete(`/api/empreendimento/${criado.body.id}`), 202);
            assertStatus(await api(gestor).get(`/api/empreendimento/${criado.body.id}`), 404);
        });
    });

    describe('com obra vinculada', () => {
        let empreendimento: { id: number };

        before(async () => {
            empreendimento = (await api(gestor).post('/api/empreendimento').send(novo())).body;
            await criarProjeto(obras.adminMdo, 'MDO', {
                portfolio_id: obras.portfolio.id,
                empreendimento_id: empreendimento.id,
            });
        });

        it('não remove empreendimento em uso por obra (400)', async () => {
            const res = await api(gestor).delete(`/api/empreendimento/${empreendimento.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /em uso/);
        });
    });
});
