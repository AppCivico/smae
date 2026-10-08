import { before, describe, it } from 'node:test';
import {
    api,
    assert,
    assertStatus,
    bootApp,
    criarPdmAntigo,
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    prisma,
    Sessao,
    uniq,
} from '../lib';

describe('dashboard', () => {
    let semPrivilegio: Sessao;
    let espectador: Sessao;
    let gestor: Sessao;

    const como = (s: Sessao) => api(s, { sistema: 'PDM' });
    const porId = (linhas: any[], id: number) => linhas.find((l) => l.id === id);
    const payloadDoJwt = (url: string) => {
        const jwt = url.split('/embed/dashboard/')[1].split('#')[0];
        return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
    };

    before(async () => {
        await bootApp();
        semPrivilegio = await criarPessoaSemPrivilegios();
        espectador = await criarPessoaComPrivilegios(['SMAE.espectador_de_painel_externo']);
        gestor = await criarPessoaComPrivilegios([
            'CadastroGrupoPainelExterno.administrador',
            'CadastroPainelExterno.inserir',
            'CadastroPainelExterno.remover',
        ]);
    });

    describe('GET /dashboard', () => {
        it('401 sem token', async () => {
            assertStatus(await api().get('/api/dashboard'), 401);
        });

        it('403 sem Reports.dashboard_pdm, Reports.dashboard_portfolios nem SMAE.espectador_de_painel_externo', async () => {
            const res = await api(semPrivilegio).get('/api/dashboard');
            assertStatus(res, 403);
            assert.match(res.body.message, /Reports\.dashboard_pdm/);
            assert.match(res.body.message, /SMAE\.espectador_de_painel_externo/);
        });

        it('espectador sem grupo recebe a lista vazia', async () => {
            const res = await como(espectador).get('/api/dashboard');
            assertStatus(res, 200);
            assert.deepEqual(res.body, { linhas: [] });
        });

        it('espectador vê só os painéis externos dos grupos em que participa', async () => {
            const visivel = await como(gestor)
                .post('/api/grupo-painel-externo')
                .send({ titulo: uniq('Grupo'), orgao_id: 1, participantes: [espectador.pessoa.id] });
            const invisivel = await como(gestor)
                .post('/api/grupo-painel-externo')
                .send({ titulo: uniq('Grupo outro'), orgao_id: 1, participantes: [] });
            assertStatus(visivel, 201);
            assertStatus(invisivel, 201);

            const link = 'https://painel.e2e.test/dash?id=1&x=a';
            const tituloVisivel = uniq('Painel visível');
            const painelVisivel = await como(gestor)
                .post('/api/painel-externo')
                .send({ titulo: tituloVisivel, descricao: null, link, grupos: [visivel.body.id] });
            const painelInvisivel = await como(gestor)
                .post('/api/painel-externo')
                .send({ titulo: uniq('Painel oculto'), descricao: null, link, grupos: [invisivel.body.id] });
            const semGrupo = await como(gestor)
                .post('/api/painel-externo')
                .send({ titulo: uniq('Painel solto'), descricao: null, link });
            assertStatus(painelVisivel, 201);
            assertStatus(painelInvisivel, 201);
            assertStatus(semGrupo, 201);

            const res = await como(espectador).get('/api/dashboard');
            assertStatus(res, 200);
            const linha = porId(res.body.linhas, -1);
            assert.equal(linha.titulo, 'Painéis Externos');
            assert.equal(linha.opcoes_titulo, 'Escolha o Painel');

            const opcao = porId(linha.opcoes, painelVisivel.body.id);
            assert.equal(opcao.titulo, tituloVisivel);
            const url = new URL(opcao.url);
            assert.equal(url.pathname, '/api/dashboard/iframe');
            assert.equal(url.searchParams.get('url'), link);

            assert.equal(porId(linha.opcoes, painelInvisivel.body.id), undefined);
            assert.equal(porId(linha.opcoes, semGrupo.body.id), undefined);

            assertStatus(await como(gestor).delete(`/api/painel-externo/${painelVisivel.body.id}`), 202);
            const depois = await como(espectador).get('/api/dashboard');
            assert.equal(porId(porId(depois.body.linhas, -1)?.opcoes ?? [], painelVisivel.body.id), undefined);
        });

        it('Reports.dashboard_pdm recebe um embed assinado por PDM e quem só tem portfólios não o vê', async () => {
            const pdm = await criarPdmAntigo();
            const permissao = await prisma().metabasePermissao.create({
                data: {
                    permissao: 'Reports.dashboard_pdm',
                    titulo: uniq('Dashboard PDM'),
                    ordem: 1,
                    metabase_url: 'https://metabase.e2e.test',
                    metabase_token: 'segredo-e2e',
                    configuracao: { resource: { dashboard: 1 }, params: { pdm_id: 1 } },
                },
            });
            const leitorPdm = await criarPessoaComPrivilegios(['Reports.dashboard_pdm']);
            const leitorPortfolios = await criarPessoaComPrivilegios(['Reports.dashboard_portfolios']);

            const res = await como(leitorPdm).get('/api/dashboard');
            assertStatus(res, 200);
            const linha = porId(res.body.linhas, permissao.id);
            assert.equal(linha.titulo, permissao.titulo);
            assert.equal(linha.opcoes_titulo, 'Programa de Metas');

            const opcao = porId(linha.opcoes, pdm.id);
            assert.equal(opcao.titulo, pdm.nome);
            assert.ok(opcao.url.startsWith('https://metabase.e2e.test/embed/dashboard/'));
            assert.ok(opcao.url.endsWith('#theme=transparent&bordered=false&titled=false'));
            const payload = payloadDoJwt(opcao.url);
            assert.deepEqual(payload.resource, { dashboard: 1 });
            assert.equal(payload.params.pdm_id, pdm.id);
            assert.ok(payload.exp > payload.iat);

            const outro = await api(leitorPortfolios, { sistema: 'Projetos' }).get('/api/dashboard');
            assertStatus(outro, 200);
            assert.equal(porId(outro.body.linhas, permissao.id), undefined);
        });
    });

    describe('GET /dashboard/iframe (público)', () => {
        it('200 renderiza o template sem token e libera o domínio no X-Frame-Options', async () => {
            const res = await api().get('/api/dashboard/iframe?url=https://painel.e2e.test/x');
            assertStatus(res, 200);
            assert.equal(res.headers['x-frame-options'], 'ALLOW-FROM painel.e2e.test');
            assert.match(res.headers['content-type'], /text\/html/);
            assert.match(res.text, /painel\.e2e\.test\/x/);
        });

        it('escapa aspas da url no atributo src do iframe', async () => {
            const url = encodeURIComponent('https://painel.e2e.test/x"onload="alert(1)');
            const res = await api().get(`/api/dashboard/iframe?url=${url}`);
            assertStatus(res, 200);
            assert.equal(res.text.includes('"onload="'), false);
        });

        it('400 sem url, com protocolo não http(s) ou com url malformada', async () => {
            const sem = await api().get('/api/dashboard/iframe');
            assertStatus(sem, 400);
            assert.match(sem.body.message, /URL http\(s\) válida/);

            assertStatus(await api().get('/api/dashboard/iframe?url=ftp://painel.e2e.test/x'), 400);
            assertStatus(await api().get('/api/dashboard/iframe?url=javascript:alert(1)'), 400);
            assertStatus(await api().get('/api/dashboard/iframe?url=http://'), 400);
        });
    });
});
