import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../lib';
import { casaCivil } from '../_helpers';

describe('area-tematica', () => {
    let gestor: Sessao;
    let leitor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroAreaTematica.inserir',
            'CadastroAreaTematica.listar',
            'CadastroAreaTematica.editar',
            'CadastroAreaTematica.remover',
        ]);
        leitor = await criarPessoaComPrivilegios(['CadastroAreaTematica.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/area-tematica'), 401);
        });

        it('403 sem CadastroAreaTematica.inserir / listar', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/area-tematica').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroAreaTematica\.inserir/);

            const listar = await casaCivil(semPrivilegio).get('/api/area-tematica');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroAreaTematica\.listar/);
        });

        it('leitor não cria nem edita', async () => {
            assertStatus(await casaCivil(leitor).get('/api/area-tematica'), 200);
            const res = await casaCivil(leitor).post('/api/area-tematica').send({ nome: uniq(), ativo: true });
            assertStatus(res, 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome', async () => {
            assertStatus(await casaCivil(gestor).post('/api/area-tematica').send({ ativo: true }), 400);
        });

        it('400 com ações de nome repetido na mesma requisição', async () => {
            const nome = uniq('Area');
            const res = await casaCivil(gestor)
                .post('/api/area-tematica')
                .send({ nome, ativo: true, acoes: [{ nome: 'Acao X', ativo: true }, { nome: 'Acao X', ativo: true }] });
            assertStatus(res, 400);
            assert.match(res.body.message, /Nomes de ações duplicados na requisição/);
        });
    });

    describe('CRUD', () => {
        it('cria com ações, lista, edita e remove; nome repetido é recusado', async () => {
            const nome = uniq('Area CRUD');
            const criada = await casaCivil(gestor)
                .post('/api/area-tematica')
                .send({ nome, ativo: true, acoes: [{ nome: 'Acao um', ativo: true }] });
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            const repetida = await casaCivil(gestor).post('/api/area-tematica').send({ nome, ativo: true });
            assertStatus(repetida, 400);
            assert.match(repetida.body.message, /já existe/);

            const detalhe = await casaCivil(leitor).get(`/api/area-tematica/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome);
            assert.equal(detalhe.body.acoes.length, 1);
            assert.equal(detalhe.body.acoes[0].nome, 'Acao um');

            const lista = await casaCivil(leitor).get('/api/area-tematica');
            assertStatus(lista, 200);
            assert.ok(JSON.stringify(lista.body).includes(`"id":${id}`));

            const novoNome = uniq('Area editada');
            assertStatus(await casaCivil(gestor).patch(`/api/area-tematica/${id}`).send({ nome: novoNome, ativo: false }), 200);
            const depois = await casaCivil(leitor).get(`/api/area-tematica/${id}`);
            assert.equal(depois.body.nome, novoNome);
            assert.equal(depois.body.ativo, false);

            assertStatus(await casaCivil(gestor).delete(`/api/area-tematica/${id}`), 204);
        });

        it('404 ao buscar área inexistente', async () => {
            assertStatus(await casaCivil(leitor).get('/api/area-tematica/999999'), 404);
        });
    });
});
