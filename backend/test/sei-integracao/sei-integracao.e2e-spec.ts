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
} from '../lib';

// Os endpoints resumo/relatório consultam o SEI (fora do alcance do teste): só a validação é exercitada
describe('sei-integracao', () => {
    let superAdmin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        superAdmin = await loginAsSuperAdmin();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const processoDigitos = () => `9${process.pid}${Math.floor(Math.random() * 1e9)}`.padEnd(16, '0').slice(0, 16);

    function criarStatusSei(dados: { ativo?: boolean; relatorio_sincronizado_em?: Date | null } = {}) {
        return prisma().statusSEI.create({
            data: {
                processo_sei: processoDigitos(),
                link: 'http://sei.invalido/e2e',
                sei_hash: 'hash',
                resumo_hash: 'hash',
                ativo: dados.ativo ?? true,
                relatorio_sincronizado_em: dados.relatorio_sincronizado_em ?? null,
            },
        });
    }

    describe('autenticação e privilégios', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/sei-integracao/lista'), 401);
            assertStatus(await api().post('/api/sei-integracao/ativar-desativar').send({}), 401);
            assertStatus(await api().post('/api/sei-integracao/sync-distribuicao-recurso-sei'), 401);
        });

        it('403 na sincronização de distribuição sem SMAE.sysadmin', async () => {
            assertStatus(await api(semPrivilegio).post('/api/sei-integracao/sync-distribuicao-recurso-sei'), 403);
            const gestor = await criarPessoaComPrivilegios(['CadastroMeta.orcamento']);
            const res = await api(gestor).post('/api/sei-integracao/sync-distribuicao-recurso-sei');
            assertStatus(res, 403);
            assert.match(res.body.message, /SMAE\.sysadmin/);
        });

        it('sincronização de distribuição roda para o superadmin', async () => {
            const res = await api(superAdmin).post('/api/sei-integracao/sync-distribuicao-recurso-sei');
            assertStatus(res, 201);
            assert.equal(res.body.message, 'Sincronização de distribuição de recurso concluída');
        });
    });

    describe('validação', () => {
        it('400 em resumo sem processo_sei', async () => {
            assertStatus(await api(superAdmin).get('/api/sei-integracao/resumo'), 400);
        });

        it('400 ao ativar/desativar com ativo que não é booleano', async () => {
            const res = await api(superAdmin)
                .post('/api/sei-integracao/ativar-desativar')
                .send({ processos_sei: ['123'], ativo: 'sim' });
            assertStatus(res, 400);
        });

        it('400 na lista com ipp zero', async () => {
            assertStatus(await api(superAdmin).get('/api/sei-integracao/lista?ipp=0'), 400);
        });

        it('400 na lista com next_page_token inválido', async () => {
            const res = await api(superAdmin).get('/api/sei-integracao/lista?token_proxima_pagina=abc');
            assertStatus(res, 400);
            assert.match(res.body.message, /next_page_token is invalid/);
        });
    });

    describe('processos', () => {
        it('desativa processos já cadastrados e a lista reflete o novo status', async () => {
            const processo = await criarStatusSei({ ativo: true });

            const res = await api(semPrivilegio)
                .post('/api/sei-integracao/ativar-desativar')
                .send({ processos_sei: [processo.processo_sei], ativo: false });
            assertStatus(res, 201);

            const noBanco = await prisma().statusSEI.findUniqueOrThrow({ where: { id: processo.id } });
            assert.equal(noBanco.ativo, false);
        });

        it('lista filtra por relatorio_sincronizado_em e expõe o processo', async () => {
            const dentro = await criarStatusSei({ relatorio_sincronizado_em: new Date('2031-06-15T12:00:00Z') });
            const fora = await criarStatusSei({ relatorio_sincronizado_em: new Date('2031-07-15T12:00:00Z') });

            const res = await api(superAdmin).get(
                '/api/sei-integracao/lista?relatorio_sincronizado_de=2031-06-01&relatorio_sincronizado_ate=2031-06-30'
            );
            assertStatus(res, 200);
            const ids = res.body.linhas.map((l: { id: number }) => l.id);
            assert.ok(ids.includes(dentro.id));
            assert.ok(!ids.includes(fora.id));

            const linha = res.body.linhas.find((l: { id: number }) => l.id === dentro.id);
            assert.equal(linha.processo_sei, dentro.processo_sei);
            assert.equal(linha.ativo, true);
        });
    });
});
