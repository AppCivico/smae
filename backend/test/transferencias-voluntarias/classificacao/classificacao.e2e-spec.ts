import { before, describe, it } from 'node:test';
import { assert, assertStatus, bootApp, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, Sessao, uniq } from '../../lib';
import { casaCivil, criarTipoTransferencia } from '../../casa-civil/_helpers';

describe('classificacao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let tipoId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroClassificacao.inserir',
            'CadastroClassificacao.listar',
            'CadastroClassificacao.editar',
            'CadastroClassificacao.remover',
            'CadastroTransferencia.inserir',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        tipoId = (await criarTipoTransferencia()).id;
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await casaCivil().get('/api/classificacao'), 401);
        });

        it('403 sem CadastroClassificacao.inserir / listar', async () => {
            const criar = await casaCivil(semPrivilegio).post('/api/classificacao').send({});
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroClassificacao\.inserir/);

            const listar = await casaCivil(semPrivilegio).get('/api/classificacao');
            assertStatus(listar, 403);
            assert.match(listar.body.message, /CadastroClassificacao\.listar/);
        });
    });

    describe('validação', () => {
        it('400 sem nome ou com transferencia_tipo_id que não é número', async () => {
            assertStatus(await casaCivil(gestor).post('/api/classificacao').send({ transferencia_tipo_id: tipoId }), 400);
            const res = await casaCivil(gestor)
                .post('/api/classificacao')
                .send({ nome: uniq('Classif'), transferencia_tipo_id: 'x' });
            assertStatus(res, 400);
        });
    });

    describe('CRUD', () => {
        it('cria, busca, lista, edita e remove; nome repetido é recusado', async () => {
            const nome = uniq('Classificacao');
            const criada = await casaCivil(gestor)
                .post('/api/classificacao')
                .send({ nome, transferencia_tipo_id: tipoId });
            assertStatus(criada, 201);
            const id: number = criada.body.id;

            const repetida = await casaCivil(gestor)
                .post('/api/classificacao')
                .send({ nome, transferencia_tipo_id: tipoId });
            assertStatus(repetida, 400);
            assert.match(repetida.body.message, /Nome igual ou semelhante/);

            const detalhe = await casaCivil(gestor).get(`/api/classificacao/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.nome, nome);

            const lista = await casaCivil(gestor).get('/api/classificacao');
            assertStatus(lista, 200);
            assert.ok(JSON.stringify(lista.body).includes(`"id":${id}`));

            const novoNome = uniq('Classificacao editada');
            assertStatus(await casaCivil(gestor).patch(`/api/classificacao/${id}`).send({ nome: novoNome }), 200);
            assert.equal((await casaCivil(gestor).get(`/api/classificacao/${id}`)).body.nome, novoNome);

            assertStatus(await casaCivil(gestor).delete(`/api/classificacao/${id}`), 202);
        });

        it('400 ao remover classificação usada por transferência', async () => {
            const criada = await casaCivil(gestor)
                .post('/api/classificacao')
                .send({ nome: uniq('Em uso'), transferencia_tipo_id: tipoId });
            assertStatus(criada, 201);
            assertStatus(
                await casaCivil(gestor).post('/api/transferencia').send({
                    tipo_id: tipoId,
                    orgao_concedente_id: 1,
                    esfera: 'Estadual',
                    objeto: uniq('objeto'),
                    ano: 2026,
                    classificacao_id: criada.body.id,
                }),
                201
            );

            const remocao = await casaCivil(gestor).delete(`/api/classificacao/${criada.body.id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /relacionada a Transferencia/);
        });
    });
});
