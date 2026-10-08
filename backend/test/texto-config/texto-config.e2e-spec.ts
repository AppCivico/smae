import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaComPrivilegios, loginAsSuperAdmin, Sessao, uniq } from '../lib';

describe('texto-config', () => {
    let superadmin: Sessao;
    let semSuperadmin: Sessao;

    before(async () => {
        await bootApp();
        superadmin = await loginAsSuperAdmin();
        semSuperadmin = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
    });

    it('GET texto-tos é público', async () => {
        const res = await api().get('/api/texto-config/texto-tos');
        assertStatus(res, 200);
        assert.equal(typeof res.body.tos, 'string');
        assert.equal(typeof res.body.bemvindo_email, 'string');
    });

    it('401 no PATCH sem token', async () => {
        assertStatus(await api().patch('/api/texto-config/texto-tos').send({ tos: 'x', bemvindo_email: 'x' }), 401);
    });

    it('403 no PATCH sem SMAE.superadmin', async () => {
        const res = await api(semSuperadmin)
            .patch('/api/texto-config/texto-tos')
            .send({ tos: uniq(), bemvindo_email: uniq() });
        assertStatus(res, 403);
    });

    it('400 no PATCH sem bemvindo_email', async () => {
        assertStatus(await api(superadmin).patch('/api/texto-config/texto-tos').send({ tos: uniq() }), 400);
    });

    it('PATCH grava e o GET público devolve o texto novo', async () => {
        const tos = uniq('Termos de uso');
        const bemvindo_email = uniq('Bem-vindo');
        assertStatus(await api(superadmin).patch('/api/texto-config/texto-tos').send({ tos, bemvindo_email }), 200);

        const lido = await api().get('/api/texto-config/texto-tos');
        assertStatus(lido, 200);
        assert.deepEqual(lido.body, { tos, bemvindo_email });
    });
});
