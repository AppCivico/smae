import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    Sessao,
} from '../../lib';
import { ativaCicloFisico, criarPessoaCp, criarPessoaCpSemCiclo, DATA_CICLO } from '../_helpers';

describe('MetasController (mf/metas)', () => {
    describe('sem ciclo físico ativo', () => {
        let semPrivilegio: Sessao;
        let semPrivilegioDeMf: Sessao;
        let cpSemCiclo: Sessao;

        before(async () => {
            await bootApp();
            semPrivilegio = await criarPessoaSemPrivilegios();
            semPrivilegioDeMf = await criarPessoaComPrivilegios(['CadastroMeta.administrador_no_pdm']);
            cpSemCiclo = await criarPessoaCpSemCiclo('PDM.admin_cp');
        });

        it('401 sem token', async () => {
            assertStatus(await api().get('/api/mf/metas'), 401);
            assertStatus(await api().get('/api/mf/metas/1/variaveis'), 401);
            assertStatus(await api().patch('/api/mf/metas/variaveis/conferida').send({}), 401);
        });

        it('403 sem papel de ponto focal, técnico ou admin CP', async () => {
            assertStatus(await api(semPrivilegio).get('/api/mf/metas'), 403);
            assertStatus(await api(semPrivilegioDeMf).get('/api/mf/metas'), 403);

            const res = await api(semPrivilegioDeMf).patch('/api/mf/metas/variaveis/conferida').send({});
            assertStatus(res, 403);
            assert.match(String(res.body.message), /PDM\.admin_cp/);
        });

        it('404 "sem perfil" quando não há ciclo ativo', async () => {
            const res = await api(cpSemCiclo).get('/api/mf/metas');
            assertStatus(res, 404);
            assert.match(String(res.body.message), /Você não possui um perfil de acesso/);
        });

        it('400 com corpo vazio nos PATCH de análise e complementação', async () => {
            const cliente = api(cpSemCiclo);
            assertStatus(await cliente.patch('/api/mf/metas/variaveis/analise-qualitativa-em-lote').send({}), 400);
            assertStatus(await cliente.patch('/api/mf/metas/variaveis/complemento').send({}), 400);
            assertStatus(await cliente.patch('/api/mf/metas/variaveis/complemento-em-lote').send({}), 400);
            assertStatus(await cliente.patch('/api/mf/metas/formula-composta/analise-qualitativa').send({}), 400);
            assertStatus(await cliente.post('/api/mf/metas/variaveis/busca-analise-qualitativa').send({}), 400);
        });

        it('400 com corpo inválido ou :id não numérico, antes de tocar no ciclo', async () => {
            assertStatus(await api(cpSemCiclo).patch('/api/mf/metas/variaveis/conferida').send({}), 400);
            assertStatus(await api(cpSemCiclo).patch('/api/mf/metas/variaveis/analise-qualitativa').send({}), 400);
            assertStatus(await api(cpSemCiclo).patch('/api/mf/metas/1/fase').send({ ciclo_fase_id: 'x' }), 400);
            assertStatus(await api(cpSemCiclo).get('/api/mf/metas/abc/variaveis'), 400);
            assertStatus(await api(cpSemCiclo).get('/api/mf/metas/variaveis/analise-qualitativa'), 400);
        });
    });

    describe('com ciclo físico ativo', () => {
        let cp: Sessao;
        let pontoFocal: Sessao;
        let cicloId: number;

        before(async () => {
            await bootApp();
            const ciclo = await ativaCicloFisico();
            cicloId = ciclo.ciclo_id;
            cp = await criarPessoaCp('PDM.admin_cp');
            pontoFocal = await criarPessoaCp('PDM.ponto_focal');
        });

        it('lista metas do perfil com o ciclo ativo e o perfil calculado', async () => {
            const res = await api(cp).get('/api/mf/metas');
            assertStatus(res, 200);
            assert.ok(Array.isArray(res.body.linhas));
            assert.equal(res.body.ciclo_ativo.id, cicloId);
            assert.equal(res.body.ciclo_ativo.data_ciclo, DATA_CICLO);
            assert.equal(res.body.perfil, 'admin_cp');
            assert.equal(typeof res.body.requestInfo.queryTook, 'number');
        });

        it('ponto focal recebe o próprio perfil', async () => {
            const res = await api(pontoFocal).get('/api/mf/metas');
            assertStatus(res, 200);
            assert.equal(res.body.perfil, 'ponto_focal');
        });

        it('404 ao pedir variáveis de meta que não faz parte do perfil', async () => {
            const res = await api(cp).get('/api/mf/metas/999999/variaveis');
            assertStatus(res, 404);
            assert.match(String(res.body.message), /não faz parte do seu perfil/);
        });

        it('404 ao pedir análise qualitativa de variável fora do perfil (sem CadastroMeta.administrador_no_pdm)', async () => {
            const res = await api(cp).get('/api/mf/metas/variaveis/analise-qualitativa').query({ variavel_id: 999999 });
            assertStatus(res, 404);
            assert.match(String(res.body.message), /não faz parte do seu perfil atual/);
        });
    });
});
