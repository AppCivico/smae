import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../../lib';
import { casaCivil, criarTransferencia } from '../../_helpers';

describe('transferencia-tipo', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroTransferenciaTipo.inserir',
            'CadastroTransferenciaTipo.editar',
            'CadastroTransferenciaTipo.remover',
            'CadastroTransferencia.inserir',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const novoTipo = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Tipo'),
        categoria: 'Discricionaria',
        esfera: 'Federal',
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().post('/api/transferencia-tipo').send({}), 401);
        });

        it('403 sem CadastroTransferenciaTipo.inserir', async () => {
            const res = await casaCivil(semPrivilegio).post('/api/transferencia-tipo').send(novoTipo());
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroTransferenciaTipo\.inserir/);
        });
    });

    describe('validação', () => {
        it('400 com categoria ou esfera fora do enum', async () => {
            assertStatus(await casaCivil(gestor).post('/api/transferencia-tipo').send(novoTipo({ categoria: 'X' })), 400);
            assertStatus(await casaCivil(gestor).post('/api/transferencia-tipo').send(novoTipo({ esfera: 'Municipal' })), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, edita e remove', async () => {
            const nome = uniq('Tipo CRUD');
            const criado = await casaCivil(gestor).post('/api/transferencia-tipo').send(novoTipo({ nome, esfera: 'Estadual' }));
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await casaCivil(gestor).get('/api/transferencia-tipo');
            assertStatus(lista, 200);
            const linha = lista.body.linhas.find((l: { id: number }) => l.id === id);
            assert.ok(linha, 'tipo criado não aparece na listagem');
            assert.equal(linha.nome, nome);

            const novoNome = uniq('Tipo editado');
            assertStatus(await casaCivil(gestor).patch(`/api/transferencia-tipo/${id}`).send({ nome: novoNome }), 200);
            const depois = await casaCivil(gestor).get('/api/transferencia-tipo');
            assert.equal(depois.body.linhas.find((l: { id: number }) => l.id === id).nome, novoNome);

            assertStatus(await casaCivil(gestor).delete(`/api/transferencia-tipo/${id}`), 202);
        });

        it('400 ao remover tipo usado por transferência', async () => {
            const criado = await casaCivil(gestor).post('/api/transferencia-tipo').send(novoTipo());
            assertStatus(criado, 201);
            await criarTransferencia(gestor, { tipo_id: criado.body.id, esfera: 'Federal' });

            const remocao = await casaCivil(gestor).delete(`/api/transferencia-tipo/${criado.body.id}`);
            assertStatus(remocao, 400);
        });
    });
});
