import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
} from '../lib';

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

    it('filtra por código de resposta na lista e no summary agrupado', async () => {
        const prefixo = `/api/e2e-${process.pid}-${Date.now()}`;
        const linha = (request_num: number, res_code: number) => ({
            cf_ray: 'e2e',
            request_num,
            ip: '127.0.0.1',
            response_time: 1,
            response_size: 1,
            req_method: 'GET',
            req_path: `${prefixo}/${request_num}`,
            req_host: 'localhost',
            res_code,
        });
        await prisma().api_request_log.createMany({ data: [linha(1, 418), linha(2, 418), linha(3, 299)] });

        const lista = await api(superadmin).get(
            `/api/request-log?res_code=418&req_path_starts_with=${encodeURIComponent(prefixo)}`
        );
        assertStatus(lista, 200);
        assert.deepEqual(lista.body.linhas.map((l: { request_num: number }) => l.request_num).sort(), [1, 2]);

        const res = await api(superadmin).get('/api/request-log/summary?group_by_res_code=true&res_code=418');
        assertStatus(res, 200);
        assert.equal(res.body.linhas.length, 1);
        assert.equal(res.body.linhas[0].res_code, 418);
        assert.ok(res.body.linhas[0].count >= 2);

        const todos = await api(superadmin).get('/api/request-log/summary?group_by_res_code=true');
        const cod299 = todos.body.linhas.find((l: { res_code: number }) => l.res_code === 299);
        assert.ok(cod299 && cod299.count >= 1);
    });
});
