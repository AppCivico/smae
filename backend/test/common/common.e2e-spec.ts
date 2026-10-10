import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

let chaveSeq = 0;
const chave = () => `E2E_CFG_${process.pid}_${++chaveSeq}`;

describe('common', () => {
    let sysadmin: Sessao;
    let semPrivilegio: Sessao;

    before(async () => {
        await bootApp();
        sysadmin = await criarPessoaComPrivilegios(['SMAE.sysadmin']);
        semPrivilegio = await criarPessoaSemPrivilegios();
    });

    describe('SmaeConfigController', () => {
        it('401 sem token e 403 sem SMAE.sysadmin', async () => {
            assertStatus(await api().get('/api/smae-config'), 401);
            assertStatus(await api().patch('/api/smae-config').send({ key: chave(), value: '1' }), 401);

            const lista = await api(semPrivilegio).get('/api/smae-config');
            assertStatus(lista, 403);
            assert.match(lista.body.message, /SMAE\.sysadmin/);
            assertStatus(await api(semPrivilegio).patch('/api/smae-config').send({ key: chave(), value: '1' }), 403);
        });

        it('400 com key ou value vazios', async () => {
            assertStatus(await api(sysadmin).patch('/api/smae-config').send({ value: '1' }), 400);
            assertStatus(await api(sysadmin).patch('/api/smae-config').send({ key: chave(), value: '' }), 400);
        });

        it('PATCH cria a configuração e troca o valor sem duplicar a chave', async () => {
            const key = chave();
            const criada = await api(sysadmin).patch('/api/smae-config').send({ key, value: 'primeiro' });
            assertStatus(criada, 200);
            assert.deepEqual(criada.body, { key, value: 'primeiro' });

            const trocada = await api(sysadmin).patch('/api/smae-config').send({ key, value: 'segundo' });
            assertStatus(trocada, 200);

            const lista = await api(sysadmin).get('/api/smae-config');
            assertStatus(lista, 200);
            const iguais = lista.body.linhas.filter((l: { key: string }) => l.key === key);
            assert.deepEqual(iguais, [{ key, value: 'segundo' }]);
        });
    });

    describe('EmailConfigController', () => {
        const novaConfig = (extra: Record<string, unknown> = {}) => ({
            from: `SMAE E2E <${uniq('smae').replace(/\W+/g, '.')}@e2e.test>`,
            template_resolver_config: { base_url: 'http://127.0.0.1:9/' },
            email_transporter_config: { host: '127.0.0.1', port: '9' },
            ...extra,
        });

        it('401 sem token e 403 sem SMAE.sysadmin', async () => {
            assertStatus(await api().get('/api/smae-config/email'), 401);
            assertStatus(await api(semPrivilegio).post('/api/smae-config/email').send(novaConfig()), 403);
            assertStatus(await api(semPrivilegio).get('/api/smae-config/email'), 403);
        });

        it('400 com remetente sem nome de exibição', async () => {
            assertStatus(
                await api(sysadmin)
                    .post('/api/smae-config/email')
                    .send(novaConfig({ from: 'so@email.test' })),
                400
            );
        });

        it('400 sem configuração de transporte na criação', async () => {
            const semTransporte = novaConfig();
            delete (semTransporte as { email_transporter_config?: unknown }).email_transporter_config;
            assertStatus(await api(sysadmin).post('/api/smae-config/email').send(semTransporte), 400);
        });

        it('cria, detalha, edita e remove', async () => {
            const dados = novaConfig();
            const criada = await api(sysadmin).post('/api/smae-config/email').send(dados);
            assertStatus(criada, 201);
            const id: number = criada.body.id;
            assert.equal(criada.body.from, dados.from);
            assert.equal(criada.body.template_resolver_class, 'Shypper::TemplateResolvers::HTTP');

            const detalhe = await api(sysadmin).get(`/api/smae-config/email/${id}`);
            assertStatus(detalhe, 200);
            assert.equal(detalhe.body.id, id);

            const novoRemetente = `Outro <${uniq('outro').replace(/\W+/g, '.')}@e2e.test>`;
            assertStatus(await api(sysadmin).patch(`/api/smae-config/email/${id}`).send({ from: novoRemetente }), 200);
            const editada = await api(sysadmin).get(`/api/smae-config/email/${id}`);
            assert.equal(editada.body.from, novoRemetente);

            assertStatus(await api(sysadmin).delete(`/api/smae-config/email/${id}`), 200);
            assertStatus(await api(sysadmin).get(`/api/smae-config/email/${id}`), 404);
        });

        it('404 para id inexistente e 400 ao editar ou remover o que não existe', async () => {
            const detalhe = await api(sysadmin).get('/api/smae-config/email/999999');
            assertStatus(detalhe, 404);
            assert.match(detalhe.body.message, /não encontrada/);

            const editar = await api(sysadmin).patch('/api/smae-config/email/999999').send({ from: 'X <x@e2e.test>' });
            assertStatus(editar, 400);
            assertStatus(await api(sysadmin).delete('/api/smae-config/email/999999'), 400);
        });

        it('a criação guarda as configurações de transporte e de template enviadas', async () => {
            const dados = novaConfig();
            const criada = await api(sysadmin).post('/api/smae-config/email').send(dados);
            assertStatus(criada, 201);
            assert.equal(criada.body.email_transporter_config?.host, '127.0.0.1');
            assert.equal(criada.body.template_resolver_config?.base_url, 'http://127.0.0.1:9/');
        });
    });

    describe('SysadminController', () => {
        it('401 sem token, 403 sem SMAE.sysadmin e 404 para pessoa inexistente', async () => {
            assertStatus(await api().post('/api/smae-config/sysadmin/1'), 401);
            assertStatus(await api(semPrivilegio).post('/api/smae-config/sysadmin/1'), 403);
            assertStatus(await api(sysadmin).post('/api/smae-config/sysadmin/999999'), 404);
        });

        it('concede e revoga o perfil SYSADMIN, que muda o acesso na hora', async () => {
            const alvo = await criarPessoaComPrivilegios(['CadastroOrgao.inserir']);
            assertStatus(await api(alvo).get('/api/smae-config'), 403);

            assertStatus(await api(sysadmin).post(`/api/smae-config/sysadmin/${alvo.pessoa.id}`), 201);
            const minhaConta = await api(alvo).get('/api/minha-conta');
            assert.ok(minhaConta.body.sessao.privilegios.includes('SMAE.sysadmin'));
            assertStatus(await api(alvo).get('/api/smae-config'), 200);

            assertStatus(await api(sysadmin).post(`/api/smae-config/sysadmin/${alvo.pessoa.id}`), 201);
            const vinculos = await prisma().pessoaPerfil.count({
                where: { pessoa_id: alvo.pessoa.id, perfil_acesso: { nome: 'SYSADMIN' } },
            });
            assert.equal(vinculos, 1);

            assertStatus(await api(sysadmin).delete(`/api/smae-config/sysadmin/${alvo.pessoa.id}`), 200);
            assertStatus(await api(alvo).get('/api/smae-config'), 403);
        });
    });

    describe('ThumbnailConfigController', () => {
        it('401 sem token e 403 sem SMAE.sysadmin', async () => {
            assertStatus(await api().get('/api/smae-config/thumbnail'), 401);
            assertStatus(await api(semPrivilegio).get('/api/smae-config/thumbnail'), 403);
            assertStatus(
                await api(semPrivilegio).patch('/api/smae-config/thumbnail/ICONE_TAG').send({ width: 10 }),
                403
            );
        });

        it('lista os tipos com dimensões e recusa tipo desconhecido', async () => {
            const res = await api(sysadmin).get('/api/smae-config/thumbnail');
            assertStatus(res, 200);
            const tipos = res.body.configs.map((c: { tipo: string }) => c.tipo);
            assert.ok(tipos.includes('ICONE_TAG'));
            assert.ok(res.body.configs.every((c: { width: unknown }) => typeof c.width === 'number'));

            const invalido = await api(sysadmin).get('/api/smae-config/thumbnail/NAO_EXISTE');
            assertStatus(invalido, 400);
            assert.match(invalido.body.message, /Tipo de thumbnail inválido/);
        });

        it('PATCH altera largura e qualidade, e valida os limites', async () => {
            assertStatus(await api(sysadmin).patch('/api/smae-config/thumbnail/ICONE_TAG').send({ width: 0 }), 400);
            assertStatus(await api(sysadmin).patch('/api/smae-config/thumbnail/ICONE_TAG').send({ width: 5000 }), 400);

            const res = await api(sysadmin)
                .patch('/api/smae-config/thumbnail/ICONE_TAG')
                .send({ width: 300, quality: 80 });
            assertStatus(res, 200);
            assert.equal(res.body.length, 2);

            const depois = await api(sysadmin).get('/api/smae-config/thumbnail/ICONE_TAG');
            assert.equal(depois.body.width, 300);
            assert.equal(depois.body.quality, 80);
        });
    });
});
