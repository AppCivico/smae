import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../../lib';
import { casaCivil, criarTransferenciaComOrcamento } from '../../_helpers';

describe('distribuicao-status (cadastro de status)', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroDistribuicaoStatus.inserir',
            'CadastroDistribuicaoStatus.listar',
            'CadastroDistribuicaoStatus.editar',
            'CadastroDistribuicaoStatus.remover',
            'CadastroTransferencia.inserir',
            'CadastroTransferencia.listar',
            'CadastroTransferencia.editar',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/distribuicao-status'), 401);
            assertStatus(await casaCivil().post('/api/distribuicao-status').send({}), 401);
        });

        it('403 sem CadastroDistribuicaoStatus.inserir / listar', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/distribuicao-status').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroDistribuicaoStatus\.inserir/);

            const listar = await casaCivil(semPrivilegio).get('/api/distribuicao-status');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroDistribuicaoStatus\.listar/);
        });
    });

    describe('validação', () => {
        it('400 sem nome ou com tipo fora do enum', async () => {
            assertStatus(await casaCivil(gestor).post('/api/distribuicao-status').send({ tipo: 'EmAndamento' }), 400);
            const tipoInvalido = await casaCivil(gestor)
                .post('/api/distribuicao-status')
                .send({ nome: uniq('Status'), tipo: 'Inexistente' });
            assertStatus(tipoInvalido, 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, edita e remove; nome repetido é recusado', async () => {
            const nome = uniq('Status customizado');
            const criado = await casaCivil(gestor)
                .post('/api/distribuicao-status')
                .send({ nome, tipo: 'EmAndamento', valor_distribuicao_contabilizado: true, permite_novos_registros: true });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const repetido = await casaCivil(gestor).post('/api/distribuicao-status').send({ nome, tipo: 'EmAndamento' });
            assertStatus(repetido, 400);
            assert.match(repetido.body.message, /Nome igual ou semelhante/);

            const detalhe = await casaCivil(gestor).get(`/api/distribuicao-status/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome);
            assert.equal(detalhe.body.valor_distribuicao_contabilizado, true);

            const lista = await casaCivil(gestor).get('/api/distribuicao-status');
            assertStatus(lista, 200);
            assert.ok(lista.body.linhas_customizadas.some((l: { id: number }) => l.id === id));

            const novoNome = uniq('Status editado');
            assertStatus(await casaCivil(gestor).patch(`/api/distribuicao-status/${id}`).send({ nome: novoNome }), 200);
            assert.equal((await casaCivil(gestor).get(`/api/distribuicao-status/${id}`)).body.nome, novoNome);

            assertStatus(await casaCivil(gestor).delete(`/api/distribuicao-status/${id}`), 202);
            const depois = await casaCivil(gestor).get('/api/distribuicao-status');
            assert.equal(
                depois.body.linhas_customizadas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('400 ao remover status já usado no histórico de uma distribuição', async () => {
            const gestorStatus = await criarPessoaComPrivilegios([
                'CadastroDistribuicaoStatus.inserir',
                'CadastroDistribuicaoStatus.listar',
                'CadastroDistribuicaoStatus.remover',
                'CadastroTransferencia.inserir',
                'CadastroTransferencia.listar',
                'CadastroTransferencia.editar',
            ]);
            const criado = await casaCivil(gestor)
                .post('/api/distribuicao-status')
                .send({ nome: uniq('Status em uso'), tipo: 'EmAndamento', valor_distribuicao_contabilizado: true, permite_novos_registros: true });
            assertStatus(criado, 201);
            const { inicial } = await criarTransferenciaComOrcamento(gestorStatus);

            const usado = await casaCivil(gestorStatus)
                .post(`/api/distribuicao-recurso/${inicial.id}/status`)
                .send({
                    status_id: criado.body.id,
                    orgao_responsavel_id: 1,
                    nome_responsavel: uniq('responsavel'),
                    motivo: uniq('motivo'),
                    data_troca: new Date().toISOString().slice(0, 10),
                });
            assertStatus(usado, 201);

            const remocao = await casaCivil(gestor).delete(`/api/distribuicao-status/${criado.body.id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /Remoção indisponível, pois tipo de status já está em uso/);
        });

        it('404 ao buscar status inexistente', async () => {
            assertStatus(await casaCivil(gestor).get('/api/distribuicao-status/999999'), 404);
        });
    });
});
