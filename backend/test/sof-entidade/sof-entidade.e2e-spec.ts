import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';

// Sem cache no banco a rota vai ao SOF (fora do alcance do teste), então só o caminho com dados salvos é exercitado
describe('sof-entidade', () => {
    let logado: Sessao;
    const dadosEntidade = [{ id: 1, nome: 'Secretaria E2E' }];
    const dadosFonte = [{ linha: 'fonte E2E' }];

    before(async () => {
        await bootApp();
        logado = await criarPessoaSemPrivilegios();
    });

    it('401 sem token', async () => {
        assertStatus(await api().get('/api/sof-entidade/2014'), 401);
        assertStatus(await api().get('/api/sof-entidade/2014/detalhamento/123'), 401);
    });

    it('400 com :ano não numérico', async () => {
        assertStatus(await api(logado).get('/api/sof-entidade/abc'), 400);
    });

    it('400 quando não há dados salvos para o ano', async () => {
        const res = await api(logado).get('/api/sof-entidade/2008');
        assertStatus(res, 400);
        assert.match(res.body.message, /Não há dados para/);
    });

    it('devolve o cache salvo do ano, com atualizado_em em YYYY-MM-DD e cache-control', async () => {
        await prisma().sofEntidade.create({ data: { ano: 2014, dados: dadosEntidade } });

        const res = await api(logado).get('/api/sof-entidade/2014');
        assertStatus(res, 200);
        assert.deepEqual(res.body.dados, dadosEntidade);
        assert.match(res.body.atualizado_em, /^\d{4}-\d{2}-\d{2}$/);
        assert.match(res.headers['cache-control'], /max-age=3600/);
    });

    it('ano futuro usa os dados do ano corrente', async () => {
        const anoCorrente = new Date().getFullYear();
        const dados = [{ id: 2, nome: 'Ano corrente E2E' }];
        await prisma().sofEntidade.upsert({
            where: { ano: anoCorrente },
            create: { ano: anoCorrente, dados },
            update: { dados },
        });

        const res = await api(logado).get(`/api/sof-entidade/${anoCorrente + 60}`);
        assertStatus(res, 200);
        assert.deepEqual(res.body.dados, dados);
    });

    it('detalhamento de fonte devolve o cache válido (menos de 24h)', async () => {
        await prisma().sofDetalhamentoFonte.create({
            data: { ano: 2014, numero_fonte: 123, atualizado_em: new Date(), dados: dadosFonte },
        });

        const res = await api(logado).get('/api/sof-entidade/2014/detalhamento/123');
        assertStatus(res, 200);
        assert.deepEqual(res.body.dados, dadosFonte);
    });
});
