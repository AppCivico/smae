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

describe('equipamento', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroEquipamentoMDO.inserir',
            'CadastroEquipamentoMDO.editar',
            'CadastroEquipamentoMDO.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/equipamento'), 401);
            assertStatus(await api().post('/api/equipamento').send({ nome: uniq() }), 401);
        });

        it('403 sem CadastroEquipamentoMDO.inserir / editar / remover', async () => {
            const criado = await api(gestor).post('/api/equipamento').send({ nome: uniq() });
            assertStatus(criado, 201);

            const criar = await api(semPrivilegio).post('/api/equipamento').send({ nome: uniq() });
            assertStatus(criar, 403);
            assert.match(criar.body.message, /CadastroEquipamentoMDO\.inserir/);
            assertStatus(await api(semPrivilegio).patch(`/api/equipamento/${criado.body.id}`).send({ nome: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/equipamento/${criado.body.id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome', async () => {
            assertStatus(await api(gestor).post('/api/equipamento').send({}), 400);
        });
    });

    describe('CRUD', () => {
        it('cria, lista, edita o nome, remove e some da listagem', async () => {
            const nome = uniq('Ginásio');
            const criado = await api(gestor).post('/api/equipamento').send({ nome });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lista = await api(gestor).get('/api/equipamento');
            assertStatus(lista, 200);
            assert.equal(lista.body.linhas.find((l: { id: number }) => l.id === id).nome, nome);

            const novo = uniq('Quadra');
            assertStatus(await api(gestor).patch(`/api/equipamento/${id}`).send({ nome: novo }), 200);
            assert.equal((await api(gestor).get(`/api/equipamento/${id}`)).body.nome, novo);

            assertStatus(await api(gestor).delete(`/api/equipamento/${id}`), 202);
            const depois = await api(gestor).get('/api/equipamento');
            assert.equal(
                depois.body.linhas.some((l: { id: number }) => l.id === id),
                false
            );
        });

        it('400 com nome igual, sem diferenciar maiúsculas', async () => {
            const nome = uniq('Praça');
            assertStatus(await api(gestor).post('/api/equipamento').send({ nome }), 201);
            const dup = await api(gestor).post('/api/equipamento').send({ nome: nome.toUpperCase() });
            assertStatus(dup, 400);
        });
    });

    describe('com obra vinculada', () => {
        let equipamento: { id: number };

        before(async () => {
            equipamento = (await api(gestor).post('/api/equipamento').send({ nome: uniq('Usado') })).body;
            await criarProjeto(obras.adminMdo, 'MDO', {
                portfolio_id: obras.portfolio.id,
                equipamento_id: equipamento.id,
            });
        });

        it('não remove equipamento em uso por obra (400)', async () => {
            const res = await api(gestor).delete(`/api/equipamento/${equipamento.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /em uso/);
        });
    });
});
