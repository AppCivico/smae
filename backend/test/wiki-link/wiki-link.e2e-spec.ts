import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPessoaSemPrivilegios,
    loginAsSuperAdmin,
    prisma,
    Sessao,
    uniq,
} from '../lib';

const PREFIXO = 'https://wiki.fgv.br/smae/';
const chave = () => uniq('/tela');
const pagina = () => `pagina-${uniq().replace(/\s+/g, '-')}`;

describe('wiki-link', () => {
    let gestor: Sessao;
    let outro: Sessao;

    before(async () => {
        await bootApp();
        gestor = await loginAsSuperAdmin();
        outro = await criarPessoaSemPrivilegios();
        await prisma().smaeConfig.upsert({
            where: { key: 'WIKI_PREFIX' },
            create: { key: 'WIKI_PREFIX', value: PREFIXO },
            update: { value: PREFIXO },
        });
    });

    describe('autenticação', () => {
        it('401 sem token nas rotas autenticadas', async () => {
            assertStatus(await api().post('/api/wiki-link').send({ chave_smae: chave(), url_wiki: pagina() }), 401);
            assertStatus(await api().get('/api/wiki-link'), 401);
            assertStatus(await api().patch('/api/wiki-link/1').send({ url_wiki: pagina() }), 401);
            assertStatus(await api().delete('/api/wiki-link/1'), 401);
        });

        it('GET chave_smae é público, responde 404 quando não há link', async () => {
            assertStatus(await api().get('/api/wiki-link/chave_smae').query({ chave_smae: chave() }), 404);
        });
    });

    describe('validação', () => {
        it('400 sem chave_smae ou com url_wiki vazio', async () => {
            assertStatus(await api(gestor).post('/api/wiki-link').send({ url_wiki: pagina() }), 400);
            assertStatus(await api(gestor).post('/api/wiki-link').send({ chave_smae: chave(), url_wiki: '' }), 400);
        });

        it('400 ao editar com url_wiki vazio', async () => {
            const criado = await api(gestor).post('/api/wiki-link').send({ chave_smae: chave(), url_wiki: pagina() });
            assertStatus(criado, 201);
            assertStatus(await api(gestor).patch(`/api/wiki-link/${criado.body.id}`).send({ url_wiki: '' }), 400);
        });
    });

    describe('criação e consulta pela chave', () => {
        it('cria sem barra inicial e consulta pela chave ignorando maiúsculas', async () => {
            const key = chave();
            const criado = await api(gestor)
                .post('/api/wiki-link')
                .send({ chave_smae: key, url_wiki: '/projetos/cadastro' });
            assertStatus(criado, 201);

            const gravado = await prisma().wikiLink.findUniqueOrThrow({ where: { id: criado.body.id } });
            assert.equal(gravado.url_wiki, 'projetos/cadastro');

            const lido = await api().get('/api/wiki-link/chave_smae').query({ chave_smae: key.toUpperCase() });
            assertStatus(lido, 200);
            assert.deepEqual(lido.body, { chave_smae: key, url_wiki: 'projetos/cadastro' });
        });

        it('400 ao criar chave já usada em outro link ativo, mesmo com outras maiúsculas', async () => {
            const key = chave();
            assertStatus(await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: pagina() }), 201);

            const dup = await api(gestor)
                .post('/api/wiki-link')
                .send({ chave_smae: key.toLowerCase(), url_wiki: pagina() });
            assertStatus(dup, 400);
            assert.match(dup.body.message, /Chave SMAE/);
        });
    });

    describe('listagem', () => {
        it('lista com o prefixo configurado e sem o prefixo o retorno é vazio', async () => {
            const key = chave();
            assertStatus(
                await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: '/projetos/lista' }),
                201
            );

            const lista = await api(gestor).get('/api/wiki-link');
            assertStatus(lista, 200);
            const linha = lista.body.find((l: { chave_smae: string }) => l.chave_smae === key);
            assert.deepEqual(linha, { chave_smae: key, url_wiki: `${PREFIXO}projetos/lista` });

            await prisma().smaeConfig.delete({ where: { key: 'WIKI_PREFIX' } });
            try {
                const semPrefixo = await api(gestor).get('/api/wiki-link');
                assert.deepEqual(semPrefixo.body, []);
            } finally {
                await prisma().smaeConfig.create({ data: { key: 'WIKI_PREFIX', value: PREFIXO } });
            }
        });
    });

    describe('edição e remoção', () => {
        it('PATCH normaliza url_wiki e não altera a chave', async () => {
            const key = chave();
            const criado = await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: pagina() });
            assertStatus(criado, 201);

            const res = await api(gestor)
                .patch(`/api/wiki-link/${criado.body.id}`)
                .send({ url_wiki: '/nova/pagina', chave_smae: 'ignorada' });
            assertStatus(res, 200);

            const gravado = await prisma().wikiLink.findUniqueOrThrow({ where: { id: criado.body.id } });
            assert.equal(gravado.url_wiki, 'nova/pagina');
            assert.equal(gravado.chave_smae, key);
        });

        it('404 ao editar id inexistente', async () => {
            assertStatus(await api(gestor).patch('/api/wiki-link/999999').send({ url_wiki: pagina() }), 404);
        });

        it('DELETE é soft delete: some da consulta pela chave e da listagem', async () => {
            const key = chave();
            const criado = await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: pagina() });
            assertStatus(criado, 201);

            assertStatus(await api(gestor).delete(`/api/wiki-link/${criado.body.id}`), 204);

            const gravado = await prisma().wikiLink.findUniqueOrThrow({ where: { id: criado.body.id } });
            assert.ok(gravado.removido_em);
            assert.equal(gravado.removido_por, gestor.pessoa.id);

            assertStatus(await api().get('/api/wiki-link/chave_smae').query({ chave_smae: key }), 404);
            const lista = await api(gestor).get('/api/wiki-link');
            assert.equal(
                lista.body.some((l: { chave_smae: string }) => l.chave_smae === key),
                false
            );
        });

        it(
            'chave removida pode ser cadastrada de novo',
            async () => {
                const key = chave();
                const primeiro = await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: pagina() });
                assertStatus(primeiro, 201);
                assertStatus(await api(gestor).delete(`/api/wiki-link/${primeiro.body.id}`), 204);

                assertStatus(
                    await api(gestor).post('/api/wiki-link').send({ chave_smae: key, url_wiki: pagina() }),
                    201
                );
            }
        );

        it(
            'usuário sem privilégio não cadastra link',
            { todo: 'BUG (https://github.com/AppCivico/smae/issues/696): wiki-link não tem @Roles em nenhuma rota, qualquer usuário logado grava links' },
            async () => {
                assertStatus(
                    await api(outro).post('/api/wiki-link').send({ chave_smae: chave(), url_wiki: pagina() }),
                    403
                );
            }
        );
    });
});
