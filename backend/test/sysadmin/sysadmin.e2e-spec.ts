import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    Sessao,
} from '../lib';

// rotas que disparam tarefas ou sincronizações externas: testa-se só permissão e validação
describe('sysadmin', () => {
    let superadmin: Sessao;
    let sysadmin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        sysadmin = await criarPessoaComPrivilegios(['SMAE.sysadmin']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('LogsController', () => {
        it('401 sem token e 403 sem SMAE.sysadmin', async () => {
            assertStatus(await api().post('/api/logs/restore').send({ date: '2026-09-01' }), 401);
            assertStatus(await api().post('/api/logs/drop').send({ date: '2026-09-01' }), 401);

            const restore = await api(semPrivilegio).post('/api/logs/restore').send({ date: '2026-09-01' });
            assertStatus(restore, 403);
            assert.match(restore.body.message, /SMAE\.sysadmin/);
            assertStatus(await api(semPrivilegio).post('/api/logs/drop').send({ date: '2026-09-01' }), 403);
        });

        it('400 com data que não é YYYY-MM-DD, antes de criar qualquer tarefa', async () => {
            assertStatus(await api(sysadmin).post('/api/logs/restore').send({ date: 'ontem' }), 400);
        });
    });

    describe('MigrationsController', () => {
        it('401 sem token e 403 sem SMAE.sysadmin', async () => {
            assertStatus(await api().get('/api/migrations/status'), 401);
            assertStatus(await api(semPrivilegio).get('/api/migrations/status'), 403);
        });

        it('200 com o status das migrations para o sysadmin', async () => {
            const res = await api(sysadmin).get('/api/migrations/status');
            assertStatus(res, 200);
            assert.equal(typeof res.body, 'object');
        });
    });

    describe('UploadController', () => {
        it('401 sem token e 403 para quem é só sysadmin, porque as rotas pedem SMAE.superadmin', async () => {
            assertStatus(await api().post('/api/processar-thumbnails-pendentes'), 401);

            const res = await api(sysadmin).post('/api/solicitar-thumbnail').send({ token: 'x' });
            assertStatus(res, 403);
            assert.match(res.body.message, /SMAE\.superadmin/);
            assertStatus(await api(sysadmin).post('/api/solicitar-preview').send({ token: 'x' }), 403);
            assertStatus(await api(sysadmin).post('/api/admin/restore-descriptions'), 403);
        });

        it('400 sem token no solicitar-thumbnail', async () => {
            assertStatus(await api(superadmin).post('/api/solicitar-thumbnail').send({}), 400);
        });
    });

    describe('TransfereGovController', () => {
        it('401 sem token e 403 sem TransfereGov.sincronizar', async () => {
            assertStatus(await api().post('/api/transfere-gov/sync'), 401);

            const res = await api(semPrivilegio).post('/api/transfere-gov/sync');
            assertStatus(res, 403);
            assert.match(res.body.message, /TransfereGov\.sincronizar/);
            assertStatus(await api(semPrivilegio).post('/api/transfere-gov/sync-transferencias-especiais'), 403);
            assertStatus(await api(semPrivilegio).post('/api/transfere-gov/sync-transferencias-completo'), 403);
        });
    });

    describe('AtualizacaoController', () => {
        it('403 para sysadmin sem SMAE.superadmin', async () => {
            assertStatus(await api().post('/api/atualizacao-em-lote/sync-operacoes-processadas'), 401);
            assertStatus(await api(sysadmin).post('/api/atualizacao-em-lote/sync-operacoes-processadas'), 403);
        });
    });

    describe('RelatoriosController', () => {
        it('403 para sysadmin sem SMAE.superadmin', async () => {
            assertStatus(await api().get('/api/relatorios/sync-parametros'), 401);
            assertStatus(await api(sysadmin).get('/api/relatorios/sync-parametros'), 403);
        });
    });

    describe('EquipeRespController (sysadmin)', () => {
        it('403 sem SMAE.superadmin e 201 com o resumo do recálculo para o superadmin', async () => {
            assertStatus(await api().post('/api/equipe-responsavel/recalc-perfis'), 401);
            assertStatus(await api(sysadmin).post('/api/equipe-responsavel/recalc-perfis'), 403);

            const res = await api(superadmin).post('/api/equipe-responsavel/recalc-perfis');
            assertStatus(res, 201);
        });
    });

    describe('DemandaController', () => {
        it('401 sem token e 403 sem CadastroDemanda.validar', async () => {
            assertStatus(await api().post('/api/demanda/refresh-cache'), 401);

            const res = await api(semPrivilegio).post('/api/demanda/refresh-cache');
            assertStatus(res, 403);
            assert.match(res.body.message, /CadastroDemanda\.validar/);
            assertStatus(await api(semPrivilegio).post('/api/demanda/1/refresh-cache'), 403);
        });
    });
});
