import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';
import { DOTACAO, DOTACAO_PROJETO } from '../meta-orcamento/fixtures';
import { criarPortfolio, criarProjeto } from './_helpers';

describe('projeto-orcamento-previsto', () => {
    let admin: Sessao;
    let portfolio: { id: number };
    let projeto: { id: number };
    let outroProjeto: { id: number };
    let anoSeq = 2200;

    before(async () => {
        await bootApp();
        const orgao = await criarOrgao();
        admin = await criarPessoaComPrivilegios(
            ['Projeto.administrador', 'Projeto.administrar_portfolios', 'Projeto.orcamento'],
            { orgao_id: orgao.id }
        );
        portfolio = await criarPortfolio(admin, 'PP', { orgaos: [orgao.id] });
        projeto = await criarProjeto(admin, 'PP', { portfolio_id: portfolio.id });
        outroProjeto = await criarProjeto(admin, 'PP', { portfolio_id: portfolio.id });
    });

    const rota = (id: number) => `/api/projeto/${id}/orcamento-previsto`;
    const criar = (id: number, corpo: Record<string, unknown>) => api(admin).post(rota(id)).send(corpo);
    const listar = async (id: number, ano: number) => {
        const res = await api(admin).get(`${rota(id)}?ano_referencia=${ano}`);
        assertStatus(res, 200);
        return res.body as { linhas: Array<Record<string, any>>; previsto_eh_zero: boolean };
    };
    const base = (ano: number, extra: Record<string, unknown> = {}) => ({
        ano_referencia: ano,
        parte_dotacao: DOTACAO,
        custo_previsto: 1000.5,
        ...extra,
    });

    it('401 sem token e 403 sem Projeto.orcamento', async () => {
        assertStatus(await api().get(`${rota(projeto.id)}?ano_referencia=2030`), 401);
        const semPriv = await criarPessoaSemPrivilegios();
        const res = await api(semPriv).post(rota(projeto.id)).send(base(2030));
        assertStatus(res, 403);
        assert.match(res.body.message, /Projeto\.orcamento/);
    });

    it('cria, lista com custo formatado e dotação expandida, e isola por projeto e por ano', async () => {
        const ano = (anoSeq += 10);
        const criado = await criar(projeto.id, base(ano));
        assertStatus(criado, 201);

        const { linhas } = await listar(projeto.id, ano);
        assert.equal(linhas.length, 1);
        assert.equal(linhas[0].id, criado.body.id);
        assert.equal(linhas[0].custo_previsto, '1000.50');
        assert.equal(linhas[0].parte_dotacao, DOTACAO);
        assert.equal(linhas[0].projeto_id, projeto.id);

        assert.equal((await listar(outroProjeto.id, ano)).linhas.length, 0);
        assert.equal((await listar(projeto.id, ano + 500)).linhas.length, 0);
    });

    it('400 com a mesma dotação no mesmo projeto e ano, mas outro projeto ou ano aceita', async () => {
        const ano = (anoSeq += 10);
        assertStatus(await criar(projeto.id, base(ano)), 201);
        const dup = await criar(projeto.id, base(ano));
        assertStatus(dup, 400);
        assert.match(dup.body.message, /Já existe um registro com a mesma dotação/);
        assertStatus(await criar(outroProjeto.id, base(ano)), 201);
        assertStatus(await criar(projeto.id, base(ano + 1)), 201);
    });

    it('cada edição cria uma revisão, só a última aparece e a anterior não pode ser editada de novo', async () => {
        const ano = (anoSeq += 10);
        const v1 = await criar(projeto.id, base(ano, { custo_previsto: 100 }));
        assertStatus(v1, 201);

        const e1 = await api(admin).patch(`${rota(projeto.id)}/${v1.body.id}`).send({ custo_previsto: 250 });
        assertStatus(e1, 202);
        const { linhas } = await listar(projeto.id, ano);
        assert.equal(linhas.length, 1);
        assert.notEqual(linhas[0].id, v1.body.id);
        assert.equal(linhas[0].custo_previsto, '250.00');
        assert.equal(linhas[0].parte_dotacao, DOTACAO);

        const velha = await api(admin).patch(`${rota(projeto.id)}/${v1.body.id}`).send({ custo_previsto: 1 });
        assertStatus(velha, 400);
        assert.match(velha.body.message, /já foi atualizado/);

        const anterior = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: v1.body.id } });
        assert.equal(anterior.ultima_revisao, false);
        assert.equal(anterior.atualizado_por, admin.pessoa.id);
        const atual = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: linhas[0].id } });
        assert.equal(atual.versao_anterior_id, v1.body.id);
        assert.equal(atual.projeto_id, projeto.id);
    });

    it('editar para dotação já existente no projeto dá 400 e preserva a revisão atual', async () => {
        const ano = (anoSeq += 10);
        const a = await criar(projeto.id, base(ano));
        assertStatus(await criar(projeto.id, base(ano, { parte_dotacao: DOTACAO_PROJETO })), 201);
        const res = await api(admin).patch(`${rota(projeto.id)}/${a.body.id}`).send({ parte_dotacao: DOTACAO_PROJETO });
        assertStatus(res, 400);
        assert.match(res.body.message, /Já existe um registro com a mesma dotação/);
        const original = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: a.body.id } });
        assert.equal(original.ultima_revisao, true);
        assert.equal((await listar(projeto.id, ano)).linhas.length, 2);
    });

    it('não edita nem remove o previsto por outro projeto (400) e remove com soft delete', async () => {
        const ano = (anoSeq += 10);
        const a = await criar(projeto.id, base(ano));
        assertStatus(await api(admin).patch(`${rota(outroProjeto.id)}/${a.body.id}`).send({ custo_previsto: 1 }), 400);
        assertStatus(await api(admin).delete(`${rota(outroProjeto.id)}/${a.body.id}`), 400);

        assertStatus(await api(admin).delete(`${rota(projeto.id)}/${a.body.id}`), 202);
        const noBanco = await prisma().orcamentoPrevisto.findUniqueOrThrow({ where: { id: a.body.id } });
        assert.ok(noBanco.removido_em);
        assert.equal(noBanco.removido_por, admin.pessoa.id);
        assert.equal((await listar(projeto.id, ano)).linhas.length, 0);
        assertStatus(await api(admin).delete(`${rota(projeto.id)}/${a.body.id}`), 400);
    });

    it('custo zerado: bloqueado com registro, marca R$ 0,00 sem registro e é por ano', async () => {
        const ano = (anoSeq += 10);
        const zerar = (ano_referencia: number, considerar_zero: boolean) =>
            api(admin).patch(`${rota(projeto.id)}/zerado`).send({ ano_referencia, considerar_zero });
        const a = await criar(projeto.id, base(ano));
        const bloqueado = await zerar(ano, true);
        assertStatus(bloqueado, 400);
        assert.match(bloqueado.body.message, /não ter nenhum registro de custo previsto/);

        assertStatus(await api(admin).delete(`${rota(projeto.id)}/${a.body.id}`), 202);
        assertStatus(await zerar(ano, true), 202);
        const marcado = await listar(projeto.id, ano);
        assert.equal(marcado.previsto_eh_zero, true);
        assert.equal((marcado as any).previsto_eh_zero_criado_por.id, admin.pessoa.id);
        assert.equal((await listar(projeto.id, ano + 1)).previsto_eh_zero, false);
        assert.equal((await listar(outroProjeto.id, ano)).previsto_eh_zero, false);

        assertStatus(await zerar(ano, false), 202);
        assert.equal((await listar(projeto.id, ano)).previsto_eh_zero, false);
    });

    it('criar um previsto limpa a marcação de custo zerado do ano', { todo: 'BUG: o create do projeto não chama patchZerado(false) como o de meta-orcamento faz, e fica zerado com registro' }, async () => {
        const ano = (anoSeq += 10);
        assertStatus(
            await api(admin).patch(`${rota(projeto.id)}/zerado`).send({ ano_referencia: ano, considerar_zero: true }),
            202
        );
        assertStatus(await criar(projeto.id, base(ano)), 201);
        assert.equal((await listar(projeto.id, ano)).previsto_eh_zero, false);
    });

    it('editar o custo para zero grava zero', { todo: 'BUG: update usa `dto.custo_previsto || antigo`, então 0 mantém o valor anterior (meta-orcamento usa ??)' }, async () => {
        const ano = (anoSeq += 10);
        const a = await criar(projeto.id, base(ano, { custo_previsto: 100 }));
        assertStatus(await api(admin).patch(`${rota(projeto.id)}/${a.body.id}`).send({ custo_previsto: 0 }), 202);
        assert.equal((await listar(projeto.id, ano)).linhas[0].custo_previsto, '0.00');
    });

    it('o previsto alimenta ano_orcamento do projeto', async () => {
        const proj = await criarProjeto(admin, 'PP', { portfolio_id: portfolio.id });
        const ano = (anoSeq += 10);
        const a = await criar(proj.id, base(ano));
        assertStatus(a, 201);
        const lerAnos = async () => ((await api(admin).get(`/api/projeto/${proj.id}`)).body.ano_orcamento as number[]).filter((x) => x >= 2200);
        assert.deepEqual(await lerAnos(), [ano]);
        assertStatus(await api(admin).delete(`${rota(proj.id)}/${a.body.id}`), 202);
        assert.deepEqual(await lerAnos(), []);
    });
});
