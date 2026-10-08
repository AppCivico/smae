import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, Sessao } from './lib';

describe('minha-conta', () => {
    let sessao: Sessao;

    before(async () => {
        await bootApp();
        const orgao = await criarOrgao();
        sessao = await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: orgao.id });
    });

    it('GET /api/minha-conta sem sessão responde 401', async () => {
        const res = await api().get('/api/minha-conta');
        assertStatus(res, 401);
    });

    it('GET /api/minha-conta com token inválido responde 401', async () => {
        const res = await api('het').get('/api/minha-conta');
        assertStatus(res, 401);
    });

    it('GET /api/minha-conta com sessão responde 200 com os dados da pessoa', async () => {
        const res = await api(sessao).get('/api/minha-conta');
        assertStatus(res, 200);
        assert.equal(res.body.sessao.id, sessao.pessoa.id);
        assert.ok(res.body.sessao.privilegios.includes('CadastroOrgao.inserir'));
    });
});
