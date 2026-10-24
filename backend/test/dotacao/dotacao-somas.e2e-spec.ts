import { before, describe, it } from 'node:test';
import { api, assert, assertStatus, bootApp, criarOrgao, criarPessoaComPrivilegios, criarPessoaSemPrivilegios, prisma, Sessao } from '../lib';
import { criarAdminOrcamento, criarCenarioOrcamento, DOTACAO, DOTACAO_PROJETO } from '../meta-orcamento/fixtures';
import { criarPortfolio, criarProjeto } from '../pp/_helpers';

// anos passados: mesMaisRecenteDoAno devolve 12 e o cache de planejado é aceito sem consultar o SOF
const ANO_PDM = 2014;
const ANO_PORTFOLIO = 2015;

describe('dotacao: valor planejado em cache, somas do SMAE e descrições do SOF', () => {
    let admin: Sessao;
    let logado: Sessao;

    before(async () => {
        await bootApp();
        admin = await criarAdminOrcamento();
        logado = await criarPessoaSemPrivilegios();
        for (const ano of [ANO_PDM, ANO_PORTFOLIO]) {
            await prisma().sofEntidade.create({
                data: {
                    ano,
                    dados: {
                        projetos_atividades: [{ codigo: '2180', descricao: 'Manutenção   da   rede' }],
                        orgaos: [{ codigo: '16', descricao: 'SECRETARIA DE TESTE' }],
                    },
                },
            });
        }
        await prisma().$executeRaw`REFRESH MATERIALIZED VIEW sof_entidades_linhas`;
    });

    const planejada = (ano: number, dotacao: string, atualizado: number) =>
        prisma().dotacaoPlanejado.create({
            data: {
                informacao_valida: true,
                ano_referencia: ano,
                mes_utilizado: 12,
                dotacao,
                val_orcado_inicial: atualizado,
                val_orcado_atualizado: atualizado,
                saldo_disponivel: atualizado,
            },
        });

    it('valor-planejado devolve a soma do SMAE por PDM e acompanha novos planejados', async () => {
        const { pdm, ano } = await criarCenarioOrcamento(ANO_PDM);
        await planejada(ano, DOTACAO, 5000);
        const consulta = () => api(logado).patch('/api/dotacao/valor-planejado').send({ ano, pdm_id: pdm.id, dotacao: DOTACAO });

        const vazio = await consulta();
        assertStatus(vazio, 200);
        assert.equal(vazio.body.smae_soma_valor_planejado, '0.00');

        for (const valor_planejado of [1200, 300.5]) {
            const outraMeta = await prisma().meta.create({
                data: { pdm_id: pdm.id, status: 'Ativo', codigo: `M${valor_planejado}`, titulo: 'Meta' },
            });
            assertStatus(
                await api(admin)
                    .post('/api/orcamento-planejado')
                    .send({ meta_id: outraMeta.id, ano_referencia: ano, dotacao: DOTACAO, valor_planejado }),
                201
            );
        }
        const res = await consulta();
        assert.equal(res.body.smae_soma_valor_planejado, '1500.50');
        assert.equal(res.body.val_orcado_atualizado, '5000.00');

        const outroPdm = await criarCenarioOrcamento(ANO_PDM);
        const resOutro = await api(logado)
            .patch('/api/dotacao/valor-planejado')
            .send({ ano, pdm_id: outroPdm.pdm.id, dotacao: DOTACAO });
        assert.equal(resOutro.body.smae_soma_valor_planejado, '0.00');
    });

    it('valor-planejado por portfolio soma só os projetos daquele portfolio', async () => {
        const orgao = await criarOrgao();
        const gestor = await criarPessoaComPrivilegios(
            ['Projeto.administrador', 'Projeto.administrar_portfolios', 'Projeto.orcamento'],
            { orgao_id: orgao.id }
        );
        const p1 = await criarPortfolio(gestor, 'PP', { orgaos: [orgao.id] });
        const p2 = await criarPortfolio(gestor, 'PP', { orgaos: [orgao.id] });
        await planejada(ANO_PORTFOLIO, DOTACAO_PROJETO, 900);
        for (const [portfolio, valor_planejado] of [[p1, 100], [p1, 25], [p2, 7]] as const) {
            const proj = await criarProjeto(gestor, 'PP', { portfolio_id: portfolio.id });
            assertStatus(
                await api(gestor)
                    .post(`/api/projeto/${proj.id}/orcamento-planejado`)
                    .send({ ano_referencia: ANO_PORTFOLIO, dotacao: DOTACAO_PROJETO, valor_planejado }),
                201
            );
        }
        const consulta = (portfolio_id: number) =>
            api(logado).patch('/api/dotacao/valor-planejado').send({ ano: ANO_PORTFOLIO, portfolio_id, dotacao: DOTACAO_PROJETO });
        assert.equal((await consulta(p1.id)).body.smae_soma_valor_planejado, '125.00');
        assert.equal((await consulta(p2.id)).body.smae_soma_valor_planejado, '7.00');
    });

    it('projeto_atividade vem do SOF importado e avisa quando o código não existe', async () => {
        const { pdm, ano } = await criarCenarioOrcamento(ANO_PDM);
        const consulta = (dotacao: string) =>
            api(logado).patch('/api/dotacao/valor-planejado').send({ ano, pdm_id: pdm.id, dotacao });

        await prisma().dotacaoPlanejado.upsert({
            where: { ano_referencia_dotacao: { ano_referencia: ano, dotacao: DOTACAO } },
            update: {},
            create: {
                informacao_valida: true,
                ano_referencia: ano,
                mes_utilizado: 12,
                dotacao: DOTACAO,
                val_orcado_inicial: 1,
                val_orcado_atualizado: 1,
                saldo_disponivel: 1,
            },
        });
        await planejada(ano, '16.10.12.128.3011.2.999.33903600.00', 1);

        assert.equal((await consulta(DOTACAO)).body.projeto_atividade, 'Manutenção da rede');
        assert.equal(
            (await consulta('16.10.12.128.3011.2.999.33903600.00')).body.projeto_atividade,
            '(projeto/atividade 2999 não foi encontrado)'
        );
    });

    it('listagens de planejado e previsto trazem projeto_atividade e a view usa o nome do órgão do SOF', async () => {
        const { meta, pdm, ano } = await criarCenarioOrcamento(ANO_PDM);
        await prisma().pdm.update({
            where: { id: pdm.id },
            data: { data_inicio: new Date(`${ano}-01-01`), data_fim: new Date(`${ano}-12-31`) },
        });
        await prisma().dotacaoPlanejado.upsert({
            where: { ano_referencia_dotacao: { ano_referencia: ano, dotacao: DOTACAO } },
            update: {},
            create: {
                informacao_valida: true,
                ano_referencia: ano,
                mes_utilizado: 12,
                dotacao: DOTACAO,
                val_orcado_inicial: 1,
                val_orcado_atualizado: 1,
                saldo_disponivel: 1,
            },
        });

        assertStatus(
            await api(admin)
                .post('/api/meta-orcamento')
                .send({ meta_id: meta.id, ano_referencia: ano, parte_dotacao: DOTACAO, custo_previsto: 10 }),
            201
        );
        const previsto = await api(admin).get(`/api/meta-orcamento?meta_id=${meta.id}&ano_referencia=${ano}`);
        assert.equal(previsto.body.linhas[0].projeto_atividade, 'Manutenção da rede');

        const viaPrevisto = await prisma().$queryRaw<{ orgao_sof: string }[]>`
            SELECT orgao_sof FROM view_meta_orcamento_plan WHERE pdm_id = ${pdm.id}::int`;
        assert.deepEqual(viaPrevisto.map((r) => r.orgao_sof), ['SECRETARIA DE TESTE']);

        assertStatus(
            await api(admin)
                .post('/api/orcamento-planejado')
                .send({ meta_id: meta.id, ano_referencia: ano, dotacao: DOTACAO, valor_planejado: 5 }),
            201
        );
        const planejado = await api(admin).get(`/api/orcamento-planejado?meta_id=${meta.id}&ano_referencia=${ano}`);
        assert.equal(planejado.body.linhas[0].projeto_atividade, 'Manutenção da rede');
    });
});
