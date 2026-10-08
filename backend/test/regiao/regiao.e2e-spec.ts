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

// criar exige um único smae-sistema; CasaCivil é o único que aceita mais de uma região nível 1
const CASA_CIVIL = { sistema: 'CasaCivil' } as const;

describe('regiao', () => {
    let gestor: Sessao;
    let soInserir: Sessao;
    let semPrivilegio: Sessao;
    let raiz: number;

    const criar = (corpo: Record<string, unknown>, sessao: Sessao = gestor) =>
        api(sessao, CASA_CIVIL).post('/api/regiao').send(corpo);

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroRegiao.inserir',
            'CadastroRegiao.editar',
            'CadastroRegiao.remover',
        ]);
        soInserir = await criarPessoaComPrivilegios(['CadastroRegiao.inserir']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        const res = await criar({ nivel: 1, descricao: uniq('Município'), parente_id: null });
        assertStatus(res, 201);
        raiz = res.body.id;
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/regiao'), 401);
            assertStatus(await api().get(`/api/regiao/${raiz}`), 401);
            assertStatus(await api().post('/api/regiao').send({ nivel: 1, descricao: uniq() }), 401);
            assertStatus(await api().patch(`/api/regiao/${raiz}`).send({ descricao: uniq() }), 401);
            assertStatus(await api().delete(`/api/regiao/${raiz}`), 401);
        });

        it('403 sem CadastroRegiao.*; GET por id exige CadastroRegiao.remover', async () => {
            assertStatus(
                await api(semPrivilegio, CASA_CIVIL).post('/api/regiao').send({ nivel: 1, descricao: uniq() }),
                403
            );
            assertStatus(await api(semPrivilegio).patch(`/api/regiao/${raiz}`).send({ descricao: uniq() }), 403);
            assertStatus(await api(semPrivilegio).delete(`/api/regiao/${raiz}`), 403);
            assertStatus(await api(soInserir).get(`/api/regiao/${raiz}`), 403);
            assertStatus(await api(gestor).get(`/api/regiao/${raiz}`), 200);
        });

        it('400 ao criar sem smae-sistema (ou com mais de um)', async () => {
            const res = await api(gestor).post('/api/regiao').send({ nivel: 1, descricao: uniq() });
            assertStatus(res, 400);
            assert.match(res.body.message, /mais de um sistema/);
        });
    });

    describe('validação', () => {
        it('400 com nível fora de 1 a 4, nível ausente ou descricao ausente', async () => {
            assertStatus(await criar({ nivel: 0, descricao: uniq() }), 400);
            assertStatus(await criar({ nivel: 5, descricao: uniq() }), 400);
            assertStatus(await criar({ descricao: uniq() }), 400);
            assertStatus(await criar({ nivel: 1 }), 400);
        });
    });

    describe('hierarquia', () => {
        it('400 para nível 2 sem parente, nível 3 com pai de nível 1, e 404 com pai inexistente', async () => {
            const semPai = await criar({ nivel: 2, descricao: uniq(), parente_id: null });
            assertStatus(semPai, 400);
            assert.match(semPai.body.message, /precisa ser nível 1/);

            const pulaNivel = await criar({ nivel: 3, descricao: uniq(), parente_id: raiz });
            assertStatus(pulaNivel, 400);
            assert.match(pulaNivel.body.message, /precisa ser do nível menor/);

            assertStatus(await criar({ nivel: 2, descricao: uniq(), parente_id: 999999 }), 404);
        });

        it('cria filho, lista por parente_id, e não remove pai com dependentes', async () => {
            const filho = await criar({ nivel: 2, descricao: uniq('Norte'), parente_id: raiz });
            assertStatus(filho, 201);

            const lista = await api(gestor).get('/api/regiao').query({ parente_id: raiz });
            assertStatus(lista, 200);
            assert.deepEqual(
                lista.body.linhas.map((l: { id: number }) => l.id),
                [filho.body.id]
            );

            const comFilho = await api(gestor, CASA_CIVIL).delete(`/api/regiao/${raiz}`);
            assertStatus(comFilho, 400);
            assert.match(comFilho.body.message, /dependentes/);
        });

        it(
            'DELETE remove a região (soft delete) e ela some da listagem',
            {
                todo: 'BUG: trg_regiao_update_geo_regioes (prisma/manual-copy/0055-geo-triggers.pgsql) faz SELECT sem PERFORM, então todo soft delete de região dá 500',
            },
            async () => {
                const filho = await criar({ nivel: 2, descricao: uniq('Removível'), parente_id: raiz });
                assertStatus(filho, 201);

                assertStatus(await api(gestor).delete(`/api/regiao/${filho.body.id}`), 202);
                assertStatus(await api(gestor).get(`/api/regiao/${filho.body.id}`), 404);
            }
        );
    });

    describe('CRUD', () => {
        it('lê o detalhe e edita a descrição', async () => {
            const descricao = uniq('Subprefeitura');
            const criado = await criar({
                nivel: 2,
                descricao,
                parente_id: raiz,
                codigo: '3550308',
                pdm_codigo_sufixo: 'SUB',
            });
            assertStatus(criado, 201);
            const id: number = criado.body.id;

            const detalhe = await api(gestor).get(`/api/regiao/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.id, id);
            assert.equal(detalhe.body.descricao, descricao);
            assert.equal(detalhe.body.nivel, 2);
            assert.equal(detalhe.body.parente_id, raiz);
            assert.equal(detalhe.body.codigo, '3550308');
            assert.equal(detalhe.body.pdm_codigo_sufixo, 'SUB');

            const nova = uniq('Subprefeitura Sul');
            assertStatus(await api(gestor).patch(`/api/regiao/${id}`).send({ descricao: nova }), 200);
            assert.equal((await api(gestor).get(`/api/regiao/${id}`)).body.descricao, nova);
        });

        it('404 ao editar ou ler região inexistente ou removida', async () => {
            assertStatus(await api(gestor).patch('/api/regiao/999999').send({ descricao: uniq() }), 404);
            assertStatus(await api(gestor).get('/api/regiao/999999'), 404);

            const removida = await prisma().regiao.create({
                data: { descricao: uniq('Removida'), nivel: 2, parente_id: raiz, removido_em: new Date() },
            });
            assertStatus(await api(gestor).patch(`/api/regiao/${removida.id}`).send({ descricao: uniq() }), 404);
        });
    });

    describe('unicidade', () => {
        it('nível 1 só pode haver uma fora do CasaCivil', async () => {
            const res = await api(gestor, { sistema: 'PlanoSetorial' })
                .post('/api/regiao')
                .send({ nivel: 1, descricao: uniq() });
            assertStatus(res, 400);
            assert.match(res.body.message, /Já existe uma região nivel 1/);
        });

        it('400 com descrição igual no mesmo nível, ignorando maiúsculas', async () => {
            const descricao = uniq('Leste');
            assertStatus(await criar({ nivel: 2, descricao, parente_id: raiz }), 201);

            const dup = await criar({ nivel: 2, descricao: descricao.toUpperCase(), parente_id: raiz });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Descrição igual ou semelhante/);
        });

        it(
            'PATCH com a descrição de outra região do mesmo nível é recusado',
            { todo: 'BUG: regiao.update só checa descrição duplicada quando parente_id vem no corpo' },
            async () => {
                const descricaoA = uniq('Oeste');
                assertStatus(await criar({ nivel: 2, descricao: descricaoA, parente_id: raiz }), 201);
                const b = await criar({ nivel: 2, descricao: uniq('Centro'), parente_id: raiz });
                assertStatus(b, 201);

                const res = await api(gestor).patch(`/api/regiao/${b.body.id}`).send({ descricao: descricaoA });
                assertStatus(res, 400);
            }
        );

        it(
            'PATCH só com parente_id (mesmo pai) não é recusado por descrição de outra região',
            { todo: 'BUG: regiao.update monta descricao endsWith undefined quando o corpo não traz descricao' },
            async () => {
                const a = await criar({ nivel: 2, descricao: uniq('Sudeste'), parente_id: raiz });
                assertStatus(a, 201);
                assertStatus(await criar({ nivel: 2, descricao: uniq('Nordeste'), parente_id: raiz }), 201);

                assertStatus(await api(gestor).patch(`/api/regiao/${a.body.id}`).send({ parente_id: raiz }), 200);
            }
        );
    });
});
