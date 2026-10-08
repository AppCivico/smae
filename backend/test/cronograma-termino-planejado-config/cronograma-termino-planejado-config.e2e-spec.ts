import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, loginAsSuperAdmin, Sessao, uniq } from '../lib';

const CONFIG = '/api/cronograma-termino-planejado-config';

describe('cronograma-termino-planejado-config', () => {
    let admin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        admin = await loginAsSuperAdmin();
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    const dados = (extra: Record<string, unknown> = {}) => ({
        modulo_sistema: 'PlanoSetorial',
        para: 'secretaria@e2e.test',
        texto_inicial: '<p>Inicial</p>',
        texto_final: '<p>Final</p>',
        assunto_global: uniq('Assunto global'),
        assunto_orgao: uniq('Assunto órgão'),
        ...extra,
    });

    it('401 sem token e 403 para PATCH sem SMAE.superadmin', async () => {
        assertStatus(await api().get(`${CONFIG}?modulo_sistema=PlanoSetorial`), 401);
        assertStatus(await api().patch(CONFIG).send(dados()), 401);

        const res = await api(semPrivilegio).patch(CONFIG).send(dados());
        assertStatus(res, 403);
        assert.match(res.body.message, /SMAE\.superadmin/);
    });

    it('GET qualquer sessão lê a config, mas 404 enquanto não existe', async () => {
        assertStatus(await api(semPrivilegio).get(`${CONFIG}?modulo_sistema=PlanoSetorial`), 404);
    });

    it('400 com modulo_sistema inválido, e com para que não é e-mail', async () => {
        assertStatus(await api(admin).get(`${CONFIG}?modulo_sistema=Inexistente`), 400);
        assertStatus(
            await api(admin)
                .patch(CONFIG)
                .send(dados({ modulo_sistema: 'Inexistente' })),
            400
        );

        const res = await api(admin)
            .patch(CONFIG)
            .send(dados({ para: 'nao-e-email' }));
        assertStatus(res, 400);
        assert.match(res.body.message.join(' '), /para/i);
    });

    it('superadmin cria a config e o GET devolve os campos', async () => {
        const corpo = dados();
        assertStatus(await api(admin).patch(CONFIG).send(corpo), 200);

        const lido = await api(semPrivilegio).get(`${CONFIG}?modulo_sistema=PlanoSetorial`);
        assertStatus(lido, 200);
        assert.deepEqual(lido.body, {
            assunto_global: corpo.assunto_global,
            assunto_orgao: corpo.assunto_orgao,
            modulo_sistema: 'PlanoSetorial',
            para: corpo.para,
            texto_final: corpo.texto_final,
            texto_inicial: corpo.texto_inicial,
        });
    });

    it('PATCH atualiza a mesma config (upsert por modulo_sistema) e sanitiza o HTML', async () => {
        const novo = dados({ para: 'outra@e2e.test', texto_inicial: '<p>Novo</p><script>alert(1)</script>' });
        assertStatus(await api(admin).patch(CONFIG).send(novo), 200);

        const lido = await api(admin).get(`${CONFIG}?modulo_sistema=PlanoSetorial`);
        assert.equal(lido.body.para, 'outra@e2e.test');
        assert.ok(!String(lido.body.texto_inicial).includes('<script'));
    });
});
