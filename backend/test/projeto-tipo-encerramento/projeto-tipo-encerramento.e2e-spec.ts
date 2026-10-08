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

async function criarTermoUsando(tipoEncerramentoId: number, registradoPor: number) {
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
    const projeto = await prisma().projeto.create({
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
    return prisma().projetoTermoEncerramento.create({
        data: {
            projeto_id: projeto.id,
            nome_projeto: projeto.nome,
            orgao_responsavel_nome: 'Órgão',
            portfolios_nomes: portfolio.titulo,
            objeto: 'Objeto',
            status_final: 'Concluído',
            etapa_nome: 'Etapa',
            responsavel_encerramento_nome: 'Responsável',
            data_encerramento: new Date(),
            justificativa_id: tipoEncerramentoId,
            ultima_versao: true,
            criado_por: registradoPor,
        },
    });
}

describe('projeto-tipo-encerramento', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroProjetoTipoEncerramento.inserir',
            'CadastroProjetoTipoEncerramento.editar',
            'CadastroProjetoTipoEncerramento.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/projeto-tipo-encerramento'), 401);
            assertStatus(await api().post('/api/projeto-tipo-encerramento').send({ descricao: uniq() }), 401);
            assertStatus(await api().get('/api/obra-tipo-encerramento'), 401);
            assertStatus(await api().delete('/api/obra-tipo-encerramento/1'), 401);
        });

        it('403 sem CadastroProjetoTipoEncerramento.*, a listagem só exige sessão', async () => {
            const criado = await api(gestor).post('/api/projeto-tipo-encerramento').send({ descricao: uniq() });
            assertStatus(criado, 201);
            const id = criado.body.id;

            assertStatus(await api(semPrivilegio).get('/api/projeto-tipo-encerramento'), 200);
            assertStatus(
                await api(semPrivilegio).post('/api/projeto-tipo-encerramento').send({ descricao: uniq() }),
                403
            );
            assertStatus(
                await api(semPrivilegio).patch(`/api/projeto-tipo-encerramento/${id}`).send({ descricao: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).delete(`/api/projeto-tipo-encerramento/${id}`), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/obra-tipo-encerramento/${id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem descricao ou com descricao vazia', async () => {
            assertStatus(await api(gestor).post('/api/projeto-tipo-encerramento').send({}), 400);
            assertStatus(await api(gestor).post('/api/projeto-tipo-encerramento').send({ descricao: '' }), 400);
            assertStatus(await api(gestor).post('/api/obra-tipo-encerramento').send({ descricao: '' }), 400);
        });
    });

    describe('rota de projeto (PP) e rota de obra (MDO)', () => {
        it('cria em PP com informação adicional desligada por padrão, e não aparece em MDO', async () => {
            const descricao = uniq('Concluído');
            const criado = await api(gestor).post('/api/projeto-tipo-encerramento').send({ descricao });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const pp = await api(gestor).get('/api/projeto-tipo-encerramento');
            assert.deepEqual(
                pp.body.linhas.find((l: { id: number }) => l.id === id),
                { id, descricao, habilitar_info_adicional: false }
            );

            const mdo = await api(gestor).get('/api/obra-tipo-encerramento');
            assert.equal(
                mdo.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
            assertStatus(await api(gestor).get(`/api/obra-tipo-encerramento/${id}`), 404);
        });

        it('mesma descrição é aceita em PP e em MDO, mas não duas vezes no mesmo tipo', async () => {
            const descricao = uniq('Cancelado');
            assertStatus(await api(gestor).post('/api/projeto-tipo-encerramento').send({ descricao }), 201);
            assertStatus(await api(gestor).post('/api/obra-tipo-encerramento').send({ descricao }), 201);

            const dup = await api(gestor)
                .post('/api/obra-tipo-encerramento')
                .send({ descricao: descricao.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Descrição igual ou semelhante/);
        });

        it('CRUD em MDO com informação adicional, edição e remoção', async () => {
            const criado = await api(gestor)
                .post('/api/obra-tipo-encerramento')
                .send({ descricao: uniq('Obra entregue'), habilitar_info_adicional: true });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/obra-tipo-encerramento/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.habilitar_info_adicional, true);

            const nova = uniq('Obra entregue parcial');
            assertStatus(await api(gestor).patch(`/api/obra-tipo-encerramento/${id}`).send({ descricao: nova }), 200);
            assert.equal((await api(gestor).get(`/api/obra-tipo-encerramento/${id}`)).body.descricao, nova);

            assertStatus(await api(gestor).delete(`/api/obra-tipo-encerramento/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/obra-tipo-encerramento/${id}`), 404);
        });

        it('404 ao editar pelo tipo errado ou id inexistente', async () => {
            const pp = await api(gestor).post('/api/projeto-tipo-encerramento').send({ descricao: uniq() });
            assertStatus(pp, 201);
            assertStatus(
                await api(gestor).patch(`/api/obra-tipo-encerramento/${pp.body.id}`).send({ descricao: uniq() }),
                404
            );
            assertStatus(
                await api(gestor).patch('/api/projeto-tipo-encerramento/999999').send({ descricao: uniq() }),
                404
            );
        });
    });

    describe('informação adicional em uso por termo de encerramento', () => {
        it('400 ao desligar informação adicional usada por termo vigente, liberado depois', async () => {
            const criado = await api(gestor)
                .post('/api/projeto-tipo-encerramento')
                .send({ descricao: uniq('Com informação'), habilitar_info_adicional: true });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const termo = await criarTermoUsando(id, gestor.pessoa.id);

            const bloqueado = await api(gestor)
                .patch(`/api/projeto-tipo-encerramento/${id}`)
                .send({ habilitar_info_adicional: false });
            assertStatus(bloqueado, 400);
            assert.match(bloqueado.body.message, /termos de encerramento/);

            await prisma().projetoTermoEncerramento.update({ where: { id: termo.id }, data: { ultima_versao: false } });
            assertStatus(
                await api(gestor)
                    .patch(`/api/projeto-tipo-encerramento/${id}`)
                    .send({ habilitar_info_adicional: false }),
                200
            );
            assert.equal(
                (await api(gestor).get(`/api/projeto-tipo-encerramento/${id}`)).body.habilitar_info_adicional,
                false
            );
        });
    });
});
