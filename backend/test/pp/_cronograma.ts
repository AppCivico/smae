import { api, assertStatus, criarOrgao, criarPessoaComPrivilegios, prisma, Sessao } from '../lib';
import { cenarioObras, criarPortfolio, criarProjeto, corpoTarefa, DadosTarefa, ROTA, Tipo } from './_helpers';

export interface Cronograma {
    tipo: Tipo;
    sessao: Sessao;
    orgao_id: number;
    portfolio_id: number;
    projeto_id: number;
    base: string;
    novoProjeto: () => Promise<Cronograma>;
    criar: (dados?: DadosTarefa, esperado?: number) => Promise<{ id: number; body: any }>;
    editar: (id: number, dados: DadosTarefa, esperado?: number) => Promise<any>;
    apagar: (id: number, esperado?: number) => Promise<any>;
    ler: (id: number) => Promise<any>;
    lista: () => Promise<any[]>;
    hierarquia: () => Promise<Record<string, string>>;
    cronograma: () => Promise<any>;
    linha: (id: number) => Promise<any>;
}

// projeto/obra em EmPlanejamento (permite tarefas de nível > 1) com um administrador
export async function novoCronograma(tipo: Tipo): Promise<Cronograma> {
    let sessao: Sessao;
    let orgao_id: number;
    let portfolio_id: number;
    if (tipo === 'PP') {
        const orgao = await criarOrgao();
        orgao_id = orgao.id;
        sessao = await criarPessoaComPrivilegios(['Projeto.administrador', 'Projeto.administrar_portfolios'], {
            orgao_id,
        });
        portfolio_id = (await criarPortfolio(sessao, 'PP', { orgaos: [orgao_id] })).id;
    } else {
        const c = await cenarioObras();
        orgao_id = c.orgao.id;
        sessao = c.adminMdo;
        portfolio_id = c.portfolio.id;
    }
    return montar(tipo, sessao, orgao_id, portfolio_id);
}

async function montar(tipo: Tipo, sessao: Sessao, orgao_id: number, portfolio_id: number): Promise<Cronograma> {
    const projeto = await criarProjeto(sessao, tipo, { portfolio_id });
    await prisma().projeto.update({ where: { id: projeto.id }, data: { status: 'EmPlanejamento' } });
    const base = `${ROTA[tipo].projeto}/${projeto.id}`;
    const c: Cronograma = {
        tipo,
        sessao,
        orgao_id,
        portfolio_id,
        projeto_id: projeto.id,
        base,
        novoProjeto: () => montar(tipo, sessao, orgao_id, portfolio_id),
        async criar(dados = {}, esperado = 201) {
            const res = await api(sessao).post(`${base}/tarefa`).send(corpoTarefa(orgao_id, dados));
            assertStatus(res, esperado);
            return { id: res.body.id, body: res.body };
        },
        async editar(id, dados, esperado = 200) {
            const res = await api(sessao).patch(`${base}/tarefa/${id}`).send(dados);
            assertStatus(res, esperado);
            return res.body;
        },
        async apagar(id, esperado = 202) {
            const res = await api(sessao).delete(`${base}/tarefa/${id}`);
            assertStatus(res, esperado);
            return res.body;
        },
        async ler(id) {
            const res = await api(sessao).get(`${base}/tarefa/${id}`);
            assertStatus(res, 200);
            return res.body;
        },
        async lista() {
            const res = await api(sessao).get(`${base}/tarefa`);
            assertStatus(res, 200);
            return res.body.linhas;
        },
        async hierarquia() {
            const res = await api(sessao).get(`${base}/tarefas-hierarquia`);
            assertStatus(res, 200);
            return res.body;
        },
        async cronograma() {
            return prisma().tarefaCronograma.findFirstOrThrow({
                where: { projeto_id: projeto.id, removido_em: null },
            });
        },
        async linha(id) {
            return (await c.lista()).find((l: { id: number }) => l.id === id);
        },
    };
    return c;
}

export const ymd = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : null);
