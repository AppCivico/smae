import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
} from '../lib';
import { criaGlobal } from './_helpers';

describe('VariavelCicloGlobalController (variavel ciclo)', () => {
    let admin: Sessao;
    let leitorPs: Sessao;
    let semPrivilegio: Sessao;
    let superAdmin: Sessao;
    let variavelId: number;
    const dataReferencia = '2024-01-01';

    before(async () => {
        await bootApp();
        const orgao = await criarOrgao();
        admin = await criarPessoaComPrivilegios(['CadastroVariavelGlobal.administrador']);
        leitorPs = await criarPessoaComPrivilegios(['CadastroMetaPS.listar']);
        semPrivilegio = await criarPessoaSemPrivilegios();
        superAdmin = await loginAsSuperAdmin();
        variavelId = await criaGlobal(admin, orgao.id);
        // sem equipes configuradas a análise qualitativa não encontra a variável (exigiria GrupoResponsavelEquipe)
        await prisma().variavel.update({ where: { id: variavelId }, data: { equipes_configuradas: true } });
    });

    describe('autenticação e privilégios', () => {
        it('401 sem token em todas as rotas', async () => {
            assertStatus(await api().get('/api/plano-setorial-variavel-ciclo'), 401);
            assertStatus(await api().get('/api/plano-setorial-variavel-ciclo/total'), 401);
            assertStatus(await api().patch('/api/plano-setorial-variavel-ciclo').send({}), 401);
            assertStatus(await api().get('/api/variavel-analise-qualitativa'), 401);
            assertStatus(await api().get('/api/plano-setorial-variavel-ciclo/documentos-por-variavel'), 401);
            assertStatus(await api().patch('/api/serie-variavel-ciclo/sync'), 401);
        });

        it('403 sem papel de metas PS ou variável global', async () => {
            assertStatus(await api(semPrivilegio).get('/api/plano-setorial-variavel-ciclo'), 403);
            assertStatus(await api(semPrivilegio).get('/api/plano-setorial-variavel-ciclo/total'), 403);
            assertStatus(await api(semPrivilegio).get('/api/variavel-analise-qualitativa'), 403);
            assertStatus(
                await api(semPrivilegio).get('/api/plano-setorial-variavel-ciclo/documentos-por-variavel'),
                403
            );
            assertStatus(await api(semPrivilegio).patch('/api/plano-setorial-variavel-ciclo').send({}), 403);
        });

        it('sincronização de série exige SMAE.sysadmin (403 até para administrador de variável global)', async () => {
            const res = await api(admin).patch('/api/serie-variavel-ciclo/sync');
            assertStatus(res, 403);
            assert.match(String(res.body.message), /SMAE\.sysadmin/);
        });

        it('leitor de metas PS lista o ciclo, mas não edita', async () => {
            assertStatus(await api(leitorPs).get('/api/plano-setorial-variavel-ciclo'), 200);
            assertStatus(await api(leitorPs).get('/api/plano-setorial-variavel-ciclo/total'), 200);

            const edicao = await api(leitorPs).patch('/api/plano-setorial-variavel-ciclo').send({
                variavel_id: variavelId,
                data_referencia: dataReferencia,
                analise_qualitativa: 'tentativa de leitor',
                valores: [],
            });
            assertStatus(edicao, 400);
            assert.match(String(edicao.body.message), /não tem permissão para acessar/);
        });
    });

    describe('validação', () => {
        it('400 com corpo vazio na edição do ciclo', async () => {
            assertStatus(await api(admin).patch('/api/plano-setorial-variavel-ciclo').send({}), 400);
        });

        it('400 com fase inválida na listagem e data de referência malformada no total', async () => {
            assertStatus(
                await api(admin).get('/api/plano-setorial-variavel-ciclo').query({ fase: 'Inexistente' }),
                400
            );
            assertStatus(
                await api(admin).get('/api/plano-setorial-variavel-ciclo/total').query({ referencia: '2024-13-45' }),
                400
            );
        });

        it('400 sem variavel_id ou data_referencia na consulta de análise', async () => {
            assertStatus(await api(admin).get('/api/variavel-analise-qualitativa'), 400);
            assertStatus(
                await api(admin).get('/api/variavel-analise-qualitativa').query({ variavel_id: variavelId }),
                400
            );
        });

        it('400 ao editar variável que não está no ciclo corrente', async () => {
            const res = await api(admin)
                .patch('/api/plano-setorial-variavel-ciclo')
                .send({
                    variavel_id: 999999,
                    data_referencia: dataReferencia,
                    analise_qualitativa: 'análise de teste',
                    valores: [{ valor_realizado: '1' }],
                });
            assertStatus(res, 400);
            assert.match(String(res.body.message), /Variável não encontrada/);
        });
    });

    describe('consulta do ciclo', () => {
        it('lista variáveis do ciclo com o formato esperado', async () => {
            const res = await api(admin)
                .get('/api/plano-setorial-variavel-ciclo')
                .query({ referencia: dataReferencia, fase: 'Preenchimento' });
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
            for (const linha of res.body.linhas) {
                assert.equal(typeof linha.id, 'number');
                assert.equal(typeof linha.pode_editar, 'boolean');
            }
        });

        it('total por fase devolve linhas e um total numérico', async () => {
            const res = await api(admin)
                .get('/api/plano-setorial-variavel-ciclo/total')
                .query({ referencia: dataReferencia });
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
            assert.equal(typeof res.body.total, 'number');
        });

        it('análise qualitativa de uma variável global devolve variável e valores', async () => {
            const res = await api(admin)
                .get('/api/variavel-analise-qualitativa')
                .query({ variavel_id: variavelId, data_referencia: dataReferencia });
            assertStatus(res, 200);
            assert.equal(res.body.variavel.id, variavelId);
            assert.ok(Array.isArray(res.body.valores));
            assert.ok(Array.isArray(res.body.uploads));
        });

        it('documentos por variável respondem na lista de variáveis do plano', async () => {
            const res = await api(admin)
                .get('/api/plano-setorial-variavel-ciclo/documentos-por-variavel')
                .query({ pdm_id: 999999 });
            assertStatus(res, 200);
            assert.deepEqual(res.body.variaveis, []);
        });
    });

    describe('sincronização de série (sysadmin)', () => {
        it('superadmin sincroniza a série do ciclo', async () => {
            const res = await api(superAdmin).patch('/api/serie-variavel-ciclo/sync');
            assertStatus(res, 200);
            assert.match(res.text, /Sincronização de série de variáveis concluída com sucesso/);
        });
    });
});
