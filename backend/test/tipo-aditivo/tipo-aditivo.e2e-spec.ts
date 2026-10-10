import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

async function criarProjeto(registradoPor: number) {
    const portfolio = await prisma().portfolio.create({
        data: {
            titulo: uniq('Portfólio'),
            tipo_projeto: 'PP',
            criado_em: new Date(),
            atualizado_em: new Date(),
            nivel_maximo_tarefa: 3,
            nivel_regionalizacao: 1,
            descricao: 'Portfólio de teste',
            modelo_clonagem: false,
        },
    });
    return prisma().projeto.create({
        data: {
            portfolio_id: portfolio.id,
            nome: uniq('Projeto'),
            objeto: 'Objeto',
            objetivo: 'Objetivo',
            publico_alvo: 'Público',
            status: 'Registrado',
            fase: 'Registro',
            resumo: 'Resumo',
            orgao_gestor_id: 1,
            registrado_em: new Date(),
            registrado_por: registradoPor,
        },
    });
}

async function criarContratoComAditivo(tipoAditivoId: number, criadoPor: number) {
    const projeto = await criarProjeto(criadoPor);
    const contrato = await prisma().contrato.create({
        data: { numero: uniq('CT'), contrato_exclusivo: true, status: 'Vigente', criado_por: criadoPor },
    });
    await prisma().contratoProjeto.create({
        data: { contrato_id: contrato.id, projeto_id: projeto.id, criado_por: criadoPor },
    });
    await prisma().contratoAditivo.create({
        data: { contrato_id: contrato.id, tipo_aditivo_id: tipoAditivoId, numero: uniq('AD'), criado_por: criadoPor },
    });
    return { projeto, contrato };
}

describe('tipo-aditivo', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    const novo = (extra: Record<string, unknown> = {}) => ({
        nome: uniq('Aditivo'),
        tipo: 'Aditivo',
        habilita_valor: true,
        habilita_valor_data_termino: false,
        ...extra,
    });

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios(['TipoAditivo.inserir', 'TipoAditivo.editar', 'TipoAditivo.remover']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/tipo-aditivo'), 401);
            assertStatus(await api().post('/api/tipo-aditivo').send(novo()), 401);
            assertStatus(await api().patch('/api/tipo-aditivo/1').send({ nome: uniq() }), 401);
            assertStatus(await api().delete('/api/tipo-aditivo/1'), 401);
        });

        it('403 sem TipoAditivo.*, a listagem só exige sessão', async () => {
            const criado = await api(gestor).post('/api/tipo-aditivo').send(novo());
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/tipo-aditivo'), 200);
            assertStatus(await api(semPrivilegio).post('/api/tipo-aditivo').send(novo()), 403);
            assertStatus(await api(semPrivilegio).patch(`/api/tipo-aditivo/${id}`).send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/tipo-aditivo/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 com tipo fora de Aditivo/Reajuste, booleanos ausentes ou nome ausente', async () => {
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-aditivo')
                    .send(novo({ tipo: 'Outro' })),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-aditivo')
                    .send(novo({ habilita_valor: undefined })),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-aditivo')
                    .send(novo({ habilita_valor_data_termino: undefined })),
                400
            );
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-aditivo')
                    .send(novo({ nome: undefined })),
                400
            );
        });

        it('400 ao criar Reajuste sem habilitar valor', async () => {
            const res = await api(gestor)
                .post('/api/tipo-aditivo')
                .send(novo({ tipo: 'Reajuste', habilita_valor: false }));
            assertStatus(res, 400);
            assert.match(res.body.message, /Reajuste requer que Habilita Valor/);
        });
    });

    describe('CRUD', () => {
        it('cria, lê, lista, edita sem contratos e remove', async () => {
            const dados = novo({ habilita_valor_data_termino: true });
            const criado = await api(gestor).post('/api/tipo-aditivo').send(dados);
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/tipo-aditivo/${id}`);
            assertStatus(lido, 200);
            assert.deepEqual(lido.body, {
                id,
                nome: dados.nome,
                tipo: 'Aditivo',
                habilita_valor: true,
                habilita_valor_data_termino: true,
            });

            const novoNome = uniq('Aditivo de prazo');
            assertStatus(
                await api(gestor).patch(`/api/tipo-aditivo/${id}`).send({ nome: novoNome, habilita_valor: false }),
                200
            );
            assert.equal((await api(gestor).get(`/api/tipo-aditivo/${id}`)).body.habilita_valor, false);

            assertStatus(await api(gestor).delete(`/api/tipo-aditivo/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/tipo-aditivo/${id}`), 404);
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/tipo-aditivo/999999').send({ nome: uniq() }), 404);
        });

        it('400 ao editar para Reajuste sem habilitar valor, e 400 ao desligar habilita_valor de um Reajuste', async () => {
            const criado = await api(gestor).post('/api/tipo-aditivo').send(novo());
            assertStatus(criado, 201);

            const reajuste = await api(gestor)
                .patch(`/api/tipo-aditivo/${criado.body.id}`)
                .send({ tipo: 'Reajuste', habilita_valor: false });
            assertStatus(reajuste, 400);

            const r = await api(gestor)
                .post('/api/tipo-aditivo')
                .send(novo({ tipo: 'Reajuste' }));
            assertStatus(r, 201);
            assertStatus(
                await api(gestor).patch(`/api/tipo-aditivo/${r.body.id}`).send({ habilita_valor: false }),
                400
            );
        });
    });

    describe('unicidade e contratos com aditivos', () => {
        it('400 com nome igual de outro tipo ativo, ignorando maiúsculas', async () => {
            const nome = uniq('Reajuste IPCA');
            assertStatus(await api(gestor).post('/api/tipo-aditivo').send(novo({ nome })), 201);

            const dup = await api(gestor)
                .post('/api/tipo-aditivo')
                .send(novo({ nome: nome.toUpperCase() }));
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Nome igual ou semelhante/);
        });

        it('com contrato vinculado a projeto ativo: só o nome pode mudar, e não é possível remover', async () => {
            const criado = await api(gestor).post('/api/tipo-aditivo').send(novo());
            assertStatus(criado, 201);
            const id: number = criado.body.id;
            const { projeto } = await criarContratoComAditivo(id, gestor.pessoa.id);

            const trocaValor = await api(gestor).patch(`/api/tipo-aditivo/${id}`).send({ habilita_valor: false });
            assertStatus(trocaValor, 400);
            assert.match(trocaValor.body.message, /Existem contratos com aditivos desse tipo/);

            const trocaTipo = await api(gestor).patch(`/api/tipo-aditivo/${id}`).send({ tipo: 'Reajuste' });
            assertStatus(trocaTipo, 400);

            const nome = uniq('Renomeado');
            assertStatus(await api(gestor).patch(`/api/tipo-aditivo/${id}`).send({ nome }), 200);
            assert.equal((await api(gestor).get(`/api/tipo-aditivo/${id}`)).body.nome, nome);

            const remocao = await api(gestor).delete(`/api/tipo-aditivo/${id}`);
            assertStatus(remocao, 400);
            assert.match(remocao.body.message, /Não é possível remover/);

            await prisma().projeto.update({ where: { id: projeto.id }, data: { removido_em: new Date() } });
            assertStatus(await api(gestor).delete(`/api/tipo-aditivo/${id}`), 202);
        });
    });
});
