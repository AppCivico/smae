import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarOrgao,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarTipoOrgao,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('orgao', () => {
    let gestor: Sessao;
    let semPrivilegio: Sessao;
    let tipoOrgaoId: number;

    before(async () => {
        await bootApp();
        gestor = await criarPessoaComPrivilegios([
            'CadastroOrgao.inserir',
            'CadastroOrgao.editar',
            'CadastroOrgao.remover',
        ]);
        semPrivilegio = await criarPessoaSemPrivilegios();
        tipoOrgaoId = (await criarTipoOrgao()).id;
    });

    const novoOrgao = (extra: Record<string, unknown> = {}) => ({
        sigla: uniq('SG'),
        descricao: uniq('Secretaria'),
        tipo_orgao_id: tipoOrgaoId,
        parente_id: null,
        ...extra,
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/orgao'), 401);
    });

    it('403 sem CadastroOrgao.inserir / editar / remover', async () => {
        const orgao = await criarOrgao();
        assertStatus(await api(semPrivilegio).post('/api/orgao').send(novoOrgao()), 403);
        assertStatus(await api(semPrivilegio).patch(`/api/orgao/${orgao.id}`).send({ sigla: uniq() }), 403);
        assertStatus(await api(semPrivilegio).delete(`/api/orgao/${orgao.id}`), 403);
    });

    it('400 quando tipo_orgao_id não é número', async () => {
        const res = await api(gestor)
            .post('/api/orgao')
            .send(novoOrgao({ tipo_orgao_id: 'x' }));
        assertStatus(res, 400);
    });

    it('400 com CNPJ inválido', async () => {
        assertStatus(
            await api(gestor)
                .post('/api/orgao')
                .send(novoOrgao({ cnpj: '11.111.111/1111-11' })),
            400
        );
    });

    it('cria e devolve os campos na listagem', async () => {
        const dados = novoOrgao({ email: 'contato@e2e.test', oficial: true });
        const criado = await api(gestor).post('/api/orgao').send(dados);
        assertStatus(criado, 201);

        const lista = await api(gestor).get('/api/orgao');
        assertStatus(lista, 200);
        const linha = lista.body.linhas.find((l: { id: number }) => l.id === criado.body.id);
        assert.ok(linha, 'órgão criado não aparece na listagem');
        assert.equal(linha.sigla, dados.sigla);
        assert.equal(linha.descricao, dados.descricao);
        assert.equal(linha.email, 'contato@e2e.test');
        assert.equal(linha.oficial, true);
        assert.equal(linha.nivel, 1);
        assert.deepEqual(linha.tipo_orgao.id, tipoOrgaoId);
    });

    it('hierarquia: filho exige pai com nível imediatamente acima', async () => {
        const pai = await api(gestor).post('/api/orgao').send(novoOrgao());
        assertStatus(pai, 201);

        assertStatus(
            await api(gestor)
                .post('/api/orgao')
                .send(novoOrgao({ nivel: 2 })),
            400
        );
        assertStatus(
            await api(gestor)
                .post('/api/orgao')
                .send(novoOrgao({ nivel: 3, parente_id: pai.body.id })),
            400
        );

        const filho = await api(gestor)
            .post('/api/orgao')
            .send(novoOrgao({ nivel: 2, parente_id: pai.body.id }));
        assertStatus(filho, 201);

        const res = await api(gestor).delete(`/api/orgao/${pai.body.id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /órgãos dependentes/);
    });

    it('edita e remove (soft delete)', async () => {
        const orgao = await criarOrgao({ tipo_orgao_id: tipoOrgaoId });
        const novaSigla = uniq('NV');

        assertStatus(await api(gestor).patch(`/api/orgao/${orgao.id}`).send({ sigla: novaSigla }), 200);
        const editado = await prisma().orgao.findUniqueOrThrow({ where: { id: orgao.id } });
        assert.equal(editado.sigla, novaSigla);
        assert.equal(editado.atualizado_por, gestor.pessoa.id);

        assertStatus(await api(gestor).delete(`/api/orgao/${orgao.id}`), 202);
        const removido = await prisma().orgao.findUniqueOrThrow({ where: { id: orgao.id } });
        assert.ok(removido.removido_em);
        assert.equal(removido.removido_por, gestor.pessoa.id);

        const lista = await api(gestor).get('/api/orgao');
        assert.equal(
            lista.body.linhas.some((l: { id: number }) => l.id === orgao.id),
            false
        );
    });

    it('400 ao remover órgão com pessoas', async () => {
        const orgao = await criarOrgao();
        await criarPessoaComPrivilegios(['CadastroOrgao.inserir'], { orgao_id: orgao.id });
        const res = await api(gestor).delete(`/api/orgao/${orgao.id}`);
        assertStatus(res, 400);
        assert.match(res.body.message, /pessoa\(s\)/);
    });

    it('401 sem token em listagem e busca reduzida', async () => {
        assertStatus(await api().get('/api/orgao'), 401);
        assertStatus(await api().get('/api/orgao/reduzido'), 401);
    });

    it('reduzido: busca por palavra-chave em sigla ou descrição, respeita limit e devolve só id, sigla e descricao', async () => {
        const token = uniq('busca').replace(/\s+/g, '');
        const orgao = await api(gestor)
            .post('/api/orgao')
            .send(novoOrgao({ descricao: `Secretaria ${token}` }));
        assertStatus(orgao, 201);

        const porDescricao = await api(gestor).get('/api/orgao/reduzido').query({ palavra_chave: token.toUpperCase() });
        assertStatus(porDescricao, 200);
        assert.deepEqual(porDescricao.body, [
            {
                id: orgao.body.id,
                sigla: (await prisma().orgao.findUniqueOrThrow({ where: { id: orgao.body.id } })).sigla,
                descricao: `Secretaria ${token}`,
            },
        ]);

        const segundo = await api(gestor)
            .post('/api/orgao')
            .send(novoOrgao({ descricao: `Autarquia ${token}` }));
        assertStatus(segundo, 201);
        const semLimite = await api(gestor).get('/api/orgao/reduzido').query({ palavra_chave: token });
        assert.equal(semLimite.body.length, 2);
        const comLimite = await api(gestor).get('/api/orgao/reduzido').query({ palavra_chave: token, limit: 1 });
        assertStatus(comLimite, 200);
        assert.equal(comLimite.body.length, 1);

        const sigla = (await prisma().orgao.findUniqueOrThrow({ where: { id: orgao.body.id } })).sigla;
        const porSigla = await api(gestor).get('/api/orgao/reduzido').query({ palavra_chave: sigla });
        assert.ok(porSigla.body.some((o: { id: number }) => o.id === orgao.body.id));
    });

    it('400 no reduzido com limit inválido', async () => {
        assertStatus(await api(gestor).get('/api/orgao/reduzido').query({ limit: 0 }), 400);
        assertStatus(await api(gestor).get('/api/orgao/reduzido').query({ limit: 'abc' }), 400);
    });
});
