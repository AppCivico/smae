import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';

describe('sync-cadastro-basico', () => {
    let logado: Sessao;

    before(async () => {
        await bootApp();
        logado = await criarPessoaSemPrivilegios();
    });

    const sincroniza = (corpo: Record<string, unknown>) => api(logado).post('/api/sync-cadastro-basico').send(corpo);

    it('401 sem token', async () => {
        assertStatus(await api().post('/api/sync-cadastro-basico').send({}), 401);
    });

    it('não exige privilégio: qualquer sessão sincroniza e recebe 200', async () => {
        assertStatus(await sincroniza({ tipos: [{ tipo: 'regiao', versao: '2024.0.1' }] }), 200);
    });

    describe('validação', () => {
        it('400 com atualizado_em que não é número', async () => {
            assertStatus(await sincroniza({ atualizado_em: 'abc' }), 400);
        });

        it('400 com tipo sem nome', async () => {
            assertStatus(await sincroniza({ tipos: [{ versao: '2024.0.1' }] }), 400);
        });
    });

    describe('sincronização', () => {
        it('ignora tipos desconhecidos', async () => {
            const res = await sincroniza({ tipos: [{ tipo: 'naoExiste', versao: null }] });
            assertStatus(res, 200);
            assert.deepEqual(res.body.dados, []);
            assert.equal(typeof res.body.timestamp, 'number');
        });

        it('versão null força sync completo e marca schema_desatualizado', async () => {
            const orgao = await criarOrgao();

            const res = await sincroniza({ tipos: [{ tipo: 'orgao', versao: null }] });
            assertStatus(res, 200);
            const dados = res.body.dados[0];
            assert.equal(dados.tipo, 'orgao');
            assert.equal(dados.versao, '2024.0.1');
            assert.equal(dados.schema_desatualizado, true);
            assert.deepEqual(dados.removidos, []);
            assert.deepEqual(
                dados.linhas.find((l: { id: number }) => l.id === orgao.id),
                { id: orgao.id, sigla: orgao.sigla, descricao: orgao.descricao }
            );
        });

        it('com a versão atual envia só o que mudou desde atualizado_em, e os removidos', async () => {
            const antigo = await criarOrgao();
            const base = await sincroniza({ tipos: [{ tipo: 'orgao', versao: '2024.0.1' }] });
            assertStatus(base, 200);
            assert.equal(base.body.dados[0].schema_desatualizado, false);
            const ts: number = base.body.timestamp;

            const novo = await criarOrgao();
            const incremental = await sincroniza({ atualizado_em: ts, tipos: [{ tipo: 'orgao', versao: '2024.0.1' }] });
            assertStatus(incremental, 200);
            const idsNovos = incremental.body.dados[0].linhas.map((l: { id: number }) => l.id);
            assert.ok(idsNovos.includes(novo.id));
            assert.ok(!idsNovos.includes(antigo.id));
            assert.deepEqual(incremental.body.dados[0].removidos, []);

            await prisma().orgao.update({ where: { id: antigo.id }, data: { removido_em: new Date() } });
            const comRemovido = await sincroniza({ atualizado_em: ts, tipos: [{ tipo: 'orgao', versao: '2024.0.1' }] });
            assertStatus(comRemovido, 200);
            assert.ok(comRemovido.body.dados[0].removidos.includes(antigo.id));
            assert.ok(!comRemovido.body.dados[0].linhas.some((l: { id: number }) => l.id === antigo.id));
        });
    });
});
