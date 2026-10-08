import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaComPrivilegios, loginAsSuperAdmin, Sessao } from '../lib';

// o logger de requisições é desligado nos testes: a tabela pode estar vazia
describe('request-log', () => {
    let superadmin: Sessao;
    let sysadmin: Sessao;

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        sysadmin = await criarPessoaComPrivilegios(['SMAE.sysadmin']);
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/request-log'), 401);
        assertStatus(await api().get('/api/request-log/summary?group_by_res_code=true'), 401);
    });

    it('403 para quem é só sysadmin, porque a rota exige SMAE.superadmin', async () => {
        const lista = await api(sysadmin).get('/api/request-log');
        assertStatus(lista, 403);
        assert.match(lista.body.message, /SMAE\.superadmin/);

        assertStatus(await api(sysadmin).get('/api/request-log/summary?group_by_res_code=true'), 403);
    });

    it('superadmin recebe a lista paginada no formato padrão', async () => {
        const res = await api(superadmin).get('/api/request-log?ipp=5');
        assertStatus(res, 200);
        assert.equal(typeof res.body.tem_mais, 'boolean');
        assert.ok(Array.isArray(res.body.linhas));
        assert.ok(res.body.linhas.length <= 5);
    });

    it('400 no summary sem agrupamento e no token de paginação inválido', async () => {
        assertStatus(await api(superadmin).get('/api/request-log/summary'), 400);
        assertStatus(await api(superadmin).get('/api/request-log?token_proxima_pagina=lixo'), 400);
    });

    it('summary agrupado por código de resposta devolve linhas com contagem', async () => {
        const res = await api(superadmin).get('/api/request-log/summary?group_by_res_code=true');
        assertStatus(res, 200);
        assert.ok(Array.isArray(res.body.linhas));
        for (const linha of res.body.linhas) assert.equal(typeof linha.count, 'number');
    });
});
