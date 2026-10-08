import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../../lib';
import { casaCivil, criarTipoTransferencia } from '../../_helpers';

describe('workflow (configuração)', () => {
    let gestor: Sessao;
    let leitor: Sessao;
    let semPrivilegio: Sessao;
    let tipoId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroWorkflows.inserir',
            'CadastroWorkflows.listar',
            'CadastroWorkflows.editar',
            'CadastroWorkflows.remover',
        ]);
        leitor = await criarPessoaComPrivilegios(['CadastroWorkflows.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        tipoId = (await criarTipoTransferencia()).id;
    });

    const novoWorkflow = (extra: Record<string, unknown> = {}) => ({
        transferencia_tipo_id: tipoId,
        nome: uniq('Workflow'),
        inicio: '2026-01-01',
        ...extra,
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/workflow'), 401);
        });

        it('403 sem CadastroWorkflows.inserir / listar', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/workflow').send(novoWorkflow());
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroWorkflows\.inserir/);

            const listar = await casaCivil(semPrivilegio).get('/api/workflow/1');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroWorkflows\.listar/);
        });
    });

    describe('validação', () => {
        it('400 quando tipo de transferência não existe', async () => {
            const res = await casaCivil(gestor).post('/api/workflow').send(novoWorkflow({ transferencia_tipo_id: 999999 }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Tipo de transferência não existe/);
        });

        it('400 com inicio fora do formato de data', async () => {
            assertStatus(await casaCivil(gestor).post('/api/workflow').send(novoWorkflow({ inicio: 'ontem' })), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, busca, edita e remove', async () => {
            const nome = uniq('Workflow CRUD');
            const criado = await casaCivil(gestor).post('/api/workflow').send(novoWorkflow({ nome }));
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const detalhe = await casaCivil(leitor).get(`/api/workflow/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome);

            const novoNome = uniq('Workflow editado');
            assertStatus(await casaCivil(gestor).patch(`/api/workflow/${id}`).send({ nome: novoNome }), 200);
            assert.equal((await casaCivil(leitor).get(`/api/workflow/${id}`)).body.nome, novoNome);

            assertStatus(await casaCivil(gestor).delete(`/api/workflow/${id}`), 202);
        });

        it('404 ao buscar workflow inexistente', async () => {
            assertStatus(await casaCivil(leitor).get('/api/workflow/999999'), 404);
        });
    });
});
