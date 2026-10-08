import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../lib';
import { casaCivil } from '../_helpers';

describe('tipo-vinculo', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTipoVinculo.inserir',
            'CadastroTipoVinculo.editar',
            'CadastroTipoVinculo.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().post('/api/tipo-vinculo').send({}), 401);
        });

        it('403 sem CadastroTipoVinculo.inserir; listagem não exige privilégio', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/tipo-vinculo').send({ nome: uniq() });
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroTipoVinculo\.inserir/);
            assertStatus(await casaCivil(semPrivilegio).get('/api/tipo-vinculo'), 200);
        });
    });

    describe('validação', () => {
        it('400 sem nome', async () => {
            assertStatus(await casaCivil(gestor).post('/api/tipo-vinculo').send({}), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, busca, edita e remove; nome repetido é recusado', async () => {
            const nome = uniq('Vinculo');
            const criado = await casaCivil(gestor).post('/api/tipo-vinculo').send({ nome });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const repetido = await casaCivil(gestor).post('/api/tipo-vinculo').send({ nome });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Nome igual ou semelhante/);

            const detalhe = await casaCivil(gestor).get(`/api/tipo-vinculo/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome);

            const novoNome = uniq('Vinculo editado');
            assertStatus(await casaCivil(gestor).patch(`/api/tipo-vinculo/${id}`).send({ nome: novoNome }), 200);
            assert.equal((await casaCivil(gestor).get(`/api/tipo-vinculo/${id}`)).body.nome, novoNome);

            assertStatus(await casaCivil(gestor).delete(`/api/tipo-vinculo/${id}`), 202);
            const lista = await casaCivil(gestor).get('/api/tipo-vinculo');
            assert.equal(
                lista.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('BUG GET de tipo removido responde 404', { todo: 'BUG: tipo-vinculo.service findOne usa findUniqueOrThrow sem removido_em: null, então o registro removido continua legível' }, async () => {
            const criado = await casaCivil(gestor).post('/api/tipo-vinculo').send({ nome: uniq('Removido') });
            assertStatus(criado, 201);
            assertStatus(await casaCivil(gestor).delete(`/api/tipo-vinculo/${criado.body.id}`), 202);
            assertStatus(await casaCivil(gestor).get(`/api/tipo-vinculo/${criado.body.id}`), 404);
        });

        it('404 ao buscar tipo inexistente', async () => {
            assertStatus(await casaCivil(gestor).get('/api/tipo-vinculo/999999'), 404);
        });
    });
});
