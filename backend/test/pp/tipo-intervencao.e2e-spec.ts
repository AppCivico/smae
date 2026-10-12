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

describe('tipo-intervencao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let obras: Awaited<ReturnType<typeof cenarioObras>>;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'TipoIntervencaoMDO.inserir',
            'TipoIntervencaoMDO.editar',
            'TipoIntervencaoMDO.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        obras = await cenarioObras();
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/tipo-intervencao'), 401);
            assertStatus(await api().post('/api/tipo-intervencao').send({ nome: uniq() }), 401);
        });

        it('GET não exige privilégio, só sessão', async () => {
            assertStatus(await api(semPrivilegio).get('/api/tipo-intervencao'), 200);
        });

        it('403 sem TipoIntervencaoMDO.inserir / editar / remover', async () => {
            const criado = await api(gestor).post('/api/tipo-intervencao').send({ nome: uniq() });
            assertStatus(criado, 201);

            const criar = await api(semPrivilegio).post('/api/tipo-intervencao').send({ nome: uniq() });
            assertStatus(criar, 403);
            assert.match(criar.body.message, /TipoIntervencaoMDO\.inserir/);
            assertStatus(
                await api(semPrivilegio).patch(`/api/tipo-intervencao/${criado.body.id}`).send({ nome: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).delete(`/api/tipo-intervencao/${criado.body.id}`), 403);
        });
    });

    describe('validação', () => {
        it('400 sem nome ou com conceito longo demais', async () => {
            assertStatus(await api(gestor).post('/api/tipo-intervencao').send({ conceito: 'x' }), 400);
            assertStatus(
                await api(gestor)
                    .post('/api/tipo-intervencao')
                    .send({ nome: uniq(), conceito: 'x'.repeat(1000) }),
                400
            );
        });
    });

    describe('CRUD', () => {
        it('cria com conceito, lê, edita e remove', async () => {
            const nome = uniq('Reforma');
            const criado = await api(gestor)
                .post('/api/tipo-intervencao')
                .send({ nome, conceito: 'Troca de cobertura' });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const lido = await api(gestor).get(`/api/tipo-intervencao/${id}`);
            assertStatus(lido, 200);
            assert.equal(lido.body.nome, nome);
            assert.equal(lido.body.conceito, 'Troca de cobertura');

            assertStatus(await api(gestor).patch(`/api/tipo-intervencao/${id}`).send({ conceito: 'Outro' }), 200);
            assert.equal((await api(gestor).get(`/api/tipo-intervencao/${id}`)).body.conceito, 'Outro');

            assertStatus(await api(gestor).delete(`/api/tipo-intervencao/${id}`), 202);
            assertStatus(await api(gestor).get(`/api/tipo-intervencao/${id}`), 404);
        });

        it('400 com nome igual, sem diferenciar maiúsculas', async () => {
            const nome = uniq('Ampliação');
            assertStatus(await api(gestor).post('/api/tipo-intervencao').send({ nome }), 201);
            const dup = await api(gestor).post('/api/tipo-intervencao').send({ nome: nome.toUpperCase() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /já existe/);
        });
    });

    describe('com obra vinculada', () => {
        let tipo: { id: number };

        before(async () => {
            const res = await api(gestor).post('/api/tipo-intervencao').send({ nome: uniq('Vinculada') });
            assertStatus(res, 201);
            tipo = { id: res.body.id };
            await criarProjeto(obras.adminMdo, 'MDO', {
                portfolio_id: obras.portfolio.id,
                tipo_intervencao_id: tipo.id,
            });
        });

        it('não remove tipo em uso por obra (400)', async () => {
            const res = await api(gestor).delete(`/api/tipo-intervencao/${tipo.id}`);
            assertStatus(res, 400);
            assert.match(res.body.message, /em uso/);
        });
    });
});
