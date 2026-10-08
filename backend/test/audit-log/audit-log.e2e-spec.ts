import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('audit-log', () => {
    let sysadmin: Sessao;
    let semPrivilegio: Sessao;
    let autor: Sessao;

    before(async () => {
        await bootApp();
        sysadmin = await loginAsSuperAdmin();
        semPrivilegio = await criarPessoaSemPrivilegios();
        autor = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
    });

    const registrar = async (contexto: string, log: string, pessoaId = autor.pessoa.id) =>
        prisma().logGenerico.create({
            data: { contexto, log, ip: '10.1.2.3', pessoa_id: pessoaId },
        });

    it('401 sem token e 403 sem SMAE.sysadmin', async () => {
        assertStatus(await api().get('/api/audit-log'), 401);
        assertStatus(await api().get('/api/audit-log/summary?group_by_date=true'), 401);

        const res = await api(semPrivilegio).get('/api/audit-log');
        assertStatus(res, 403);
        assert.match(res.body.message, /SMAE\.sysadmin/);

        assertStatus(await api(semPrivilegio).get('/api/audit-log/summary?group_by_date=true'), 403);
    });

    it('400 com token de paginação inválido ou data que não é ISO', async () => {
        assertStatus(await api(sysadmin).get('/api/audit-log?token_proxima_pagina=lixo'), 400);
        assertStatus(await api(sysadmin).get('/api/audit-log?criado_em_inicio=ontem'), 400);
    });

    it('lista filtrada por contexto, com nome da pessoa e ordem do mais recente', async () => {
        const contexto = uniq('ctx-lista');
        await registrar(contexto, 'primeiro');
        await registrar(contexto, 'segundo');

        const res = await api(sysadmin).get(`/api/audit-log?contexto=${encodeURIComponent(contexto)}`);
        assertStatus(res, 200);
        assert.equal(res.body.linhas.length, 2);
        assert.equal(res.body.tem_mais, false);
        assert.equal(res.body.linhas[0].log, 'segundo');
        assert.equal(res.body.linhas[0].pessoa_nome, autor.pessoa.nome_exibicao);
        assert.equal(res.body.linhas[0].ip, '10.1.2.3');
    });

    it('busca em log_contem sem diferenciar maiúsculas', async () => {
        const contexto = uniq('ctx-busca');
        await registrar(contexto, 'Alterou ORGAO 42');

        const res = await api(sysadmin).get(
            `/api/audit-log?contexto=${encodeURIComponent(contexto)}&log_contem=orgao 42`
        );
        assertStatus(res, 200);
        assert.equal(res.body.linhas.length, 1);
    });

    it('pagina com ipp e devolve o restante com o token da próxima página', async () => {
        const contexto = uniq('ctx-pagina');
        for (const log of ['a', 'b', 'c']) await registrar(contexto, log);

        const primeira = await api(sysadmin).get(`/api/audit-log?contexto=${encodeURIComponent(contexto)}&ipp=2`);
        assertStatus(primeira, 200);
        assert.equal(primeira.body.linhas.length, 2);
        assert.equal(primeira.body.tem_mais, true);
        assert.ok(primeira.body.token_proxima_pagina);

        const segunda = await api(sysadmin).get(
            `/api/audit-log?contexto=${encodeURIComponent(contexto)}&ipp=2&token_proxima_pagina=${encodeURIComponent(primeira.body.token_proxima_pagina)}`
        );
        assertStatus(segunda, 200);
        assert.equal(segunda.body.linhas.length, 1);
        assert.equal(segunda.body.tem_mais, false);
    });

    it('summary agrupa por contexto e exige ao menos um agrupamento', async () => {
        const contexto = uniq('ctx-resumo');
        for (const log of ['x', 'y', 'z']) await registrar(contexto, log);

        const res = await api(sysadmin).get(
            `/api/audit-log/summary?group_by_contexto=true&contexto=${encodeURIComponent(contexto)}`
        );
        assertStatus(res, 200);
        assert.equal(res.body.linhas.length, 1);
        assert.equal(res.body.linhas[0].count, 3);
        assert.equal(res.body.linhas[0].contexto, contexto);

        assertStatus(await api(sysadmin).get('/api/audit-log/summary'), 400);
    });
});
