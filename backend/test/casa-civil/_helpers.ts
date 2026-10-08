import { TransferenciaTipoEsfera } from '@prisma/client';
import { api, criarOrgao, loginAsSuperAdmin, prisma, Sessao, uniq } from '../lib';

export const casaCivil = (sessao?: Sessao | string) => api(sessao, { sistema: 'CasaCivil' });

export function valorFixo(n: number): string {
    return n.toFixed(2);
}

export async function criarTipoTransferencia(esfera: TransferenciaTipoEsfera = 'Estadual') {
    const superadmin = await loginAsSuperAdmin();
    return prisma().transferenciaTipo.create({
        data: { nome: uniq('tipo'), categoria: 'Discricionaria', esfera, criado_por: superadmin.pessoa.id },
    });
}

export async function criarPartido() {
    return prisma().partido.create({
        data: { nome: uniq('Partido'), sigla: uniq('P').slice(-8).replace(/\s/g, ''), numero: 10000 + Math.floor(Math.random() * 80000) },
    });
}

/** Vincula o parlamentar à transferência pelo PATCH (só o PATCH cria linhas novas em parlamentares). */
export async function vincularParlamentar(sessao: Sessao, transferenciaId: number, parlamentarId: number) {
    const partido = await criarPartido();
    const atual = await prisma().transferencia.findUniqueOrThrow({ where: { id: transferenciaId } });
    return casaCivil(sessao)
        .patch(`/api/transferencia/${transferenciaId}`)
        .send({
            tipo_id: atual.tipo_id,
            esfera: atual.esfera,
            parlamentares: [{ parlamentar_id: parlamentarId, partido_id: partido.id, cargo: 'Vereador' }],
        });
}

export async function criarParlamentar() {
    return prisma().parlamentar.create({
        data: { nome: uniq('Parlamentar'), nome_popular: uniq('Pop'), em_atividade: true },
    });
}

/** Custeio, investimento e contrapartida em reais inteiros; repasse e total saem da regra da API. */
export function valoresTransferencia(custeio: number, investimento: number, contrapartida: number) {
    const valor = custeio + investimento;
    return {
        valor: valorFixo(valor),
        valor_total: valorFixo(valor + contrapartida),
        valor_contrapartida: valorFixo(contrapartida),
        custeio: valorFixo(custeio),
        investimento: valorFixo(investimento),
    };
}

/** Cria a transferência via API. Tipo novo não tem workflow ativo, então o create não dispara workflow. */
export async function criarTransferencia(
    sessao: Sessao,
    dados: { tipo_id?: number; esfera?: TransferenciaTipoEsfera; ano?: number } = {}
): Promise<number> {
    const esfera = dados.esfera ?? 'Estadual';
    const tipo_id = dados.tipo_id ?? (await criarTipoTransferencia(esfera)).id;
    const res = await casaCivil(sessao).post('/api/transferencia').send({
        tipo_id,
        orgao_concedente_id: 1,
        esfera,
        objeto: uniq('objeto'),
        ano: dados.ano ?? 2026,
    });
    if (res.status !== 201) throw new Error(`criarTransferencia: HTTP ${res.status} ${res.text}`);
    return res.body.id as number;
}

/** O primeiro completar-registro cria a distribuição inicial com a SERI, que exige o órgão de sigla SERI. */
export async function garantirOrgaoSERI() {
    const existente = await prisma().orgao.findFirst({ where: { sigla: 'SERI', removido_em: null } });
    return existente ?? criarOrgao({ sigla: 'SERI' });
}

export async function completarTransferencia(
    sessao: Sessao,
    id: number,
    valores: { custeio: number; investimento: number; contrapartida: number },
    extra: Record<string, unknown> = {}
) {
    await garantirOrgaoSERI();
    return casaCivil(sessao)
        .patch(`/api/transferencia/${id}/completar-registro`)
        .send({ ...valoresTransferencia(valores.custeio, valores.investimento, valores.contrapartida), ...extra });
}

/** Cria a distribuição de recurso. Devolve a resposta HTTP para o chamador conferir o status. */
export function criarDistribuicao(
    sessao: Sessao,
    transferenciaId: number,
    valores: { custeio: number; investimento: number; contrapartida: number },
    extra: Record<string, unknown> = {}
) {
    return casaCivil(sessao)
        .post('/api/distribuicao-recurso')
        .send({
            transferencia_id: transferenciaId,
            orgao_gestor_id: 1,
            objeto: uniq('objeto distribuicao'),
            nome: uniq('distribuicao'),
            ...valoresTransferencia(valores.custeio, valores.investimento, valores.contrapartida),
            ...extra,
        });
}

export async function buscarStatusBase(nome: string) {
    return prisma().distribuicaoStatusBase.findFirstOrThrow({ where: { nome } });
}

/** Registra um novo status (status_base) na distribuição, como o histórico da tela. */
export function registrarStatus(sessao: Sessao, distribuicaoId: number, statusBaseId: number, dataTroca?: Date) {
    return casaCivil(sessao)
        .post(`/api/distribuicao-recurso/${distribuicaoId}/status`)
        .send({
            status_base_id: statusBaseId,
            orgao_responsavel_id: 1,
            nome_responsavel: uniq('responsavel'),
            motivo: uniq('motivo'),
            data_troca: (dataTroca ?? new Date()).toISOString().slice(0, 10),
        });
}

/** Distribuição criada automaticamente pelo primeiro completar-registro. */
export async function distribuicaoInicial(transferenciaId: number) {
    return prisma().distribuicaoRecurso.findFirstOrThrow({
        where: { transferencia_id: transferenciaId, removido_em: null },
        orderBy: { id: 'asc' },
    });
}

export function cancelarDistribuicao(sessao: Sessao, distribuicaoId: number) {
    return buscarStatusBase('Cancelada').then((cancelada) => registrarStatus(sessao, distribuicaoId, cancelada.id));
}

const ORCAMENTO = { custeio: 1000, investimento: 500, contrapartida: 100 };

// A distribuição inicial (criada pelo primeiro completar-registro) ocupa todo o orçamento; cancelada, sai dos limites.
export async function criarTransferenciaComOrcamento(sessao: Sessao, orgaoGestorId?: number) {
    const id = await criarTransferencia(sessao);
    const res = await completarTransferencia(sessao, id, ORCAMENTO);
    if (res.status !== 200) throw new Error(`criarTransferenciaComOrcamento: HTTP ${res.status} ${res.text}`);
    const inicial = await distribuicaoInicial(id);
    if (orgaoGestorId !== undefined) {
        await prisma().distribuicaoRecurso.update({ where: { id: inicial.id }, data: { orgao_gestor_id: orgaoGestorId } });
    }
    return { id, inicial };
}
