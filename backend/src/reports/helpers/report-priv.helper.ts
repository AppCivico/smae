import { FonteRelatorio, ModuloSistema, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

/**
 * Mapa sistema → fontes: **fonte única da verdade** de a que sistema cada fonte pertence.
 *
 * Mora aqui, e não no `ReportsService`, de propósito: é uma tabela `const` sem dependência
 * nenhuma, e o `ReportsService` carrega meia dúzia de services de relatório por injeção. Com o
 * mapa neste módulo a dependência aponta do service para o helper — quem precisa da tabela
 * importa daqui, sem arrastar aquele grafo de DI e sem manter uma segunda cópia (que compilaria
 * limpa mesmo divergindo, já que exaustividade de `Record` não garante que dois mapas concordem).
 *
 * Como o tipo é `Record<ModuloSistema, ...>`, um sistema novo no enum quebra a compilação até ser
 * mapeado. Fontes `PS*` aparecem em PlanoSetorial e ProgramaDeMetas porque valem para os dois.
 */
export const FONTES_POR_SISTEMA: Record<ModuloSistema, readonly FonteRelatorio[]> = {
    SMAE: [],
    PDM: [
        FonteRelatorio.Orcamento,
        FonteRelatorio.PrevisaoCusto,
        FonteRelatorio.Indicadores,
        FonteRelatorio.MonitoramentoMensal,
    ],
    PlanoSetorial: [
        FonteRelatorio.PSOrcamento,
        FonteRelatorio.PSPrevisaoCusto,
        FonteRelatorio.PSIndicadores,
        FonteRelatorio.PSMonitoramentoMensal,
    ],
    ProgramaDeMetas: [
        FonteRelatorio.PSOrcamento,
        FonteRelatorio.PSPrevisaoCusto,
        FonteRelatorio.PSIndicadores,
        FonteRelatorio.PSMonitoramentoMensal,
    ],
    Projetos: [
        FonteRelatorio.Projeto,
        FonteRelatorio.Projetos,
        FonteRelatorio.ProjetoStatus,
        FonteRelatorio.ProjetoOrcamento,
        FonteRelatorio.ProjetoPrevisaoCusto,
    ],
    MDO: [
        FonteRelatorio.Obras,
        FonteRelatorio.ObraStatus,
        FonteRelatorio.ObrasOrcamento,
        FonteRelatorio.ObrasPrevisaoCusto,
    ],
    CasaCivil: [
        FonteRelatorio.Parlamentares,
        FonteRelatorio.TribunalDeContas,
        FonteRelatorio.Transferencias,
        FonteRelatorio.AtvPendentes,
        FonteRelatorio.Demandas,
    ],
};

/** Fontes que o sistema da requisição pode manipular. */
export function fontesDoSistema(sistema: ModuloSistema): readonly FonteRelatorio[] {
    return FONTES_POR_SISTEMA[sistema];
}

export function fonteEhDoSistema(fonte: FonteRelatorio, sistema: ModuloSistema): boolean {
    return FONTES_POR_SISTEMA[sistema].includes(fonte);
}

/**
 * Convenção de privilégio escopado: `Reports.{action}.{sistema}:{fonte}` libera apenas aquela
 * fonte, e o privilégio sem `:` (ex.: `Reports.executar.CasaCivil`) libera todas as fontes do
 * sistema.
 */
export function hasReportPriv(
    user: PessoaFromJwt,
    action: 'executar' | 'remover',
    sistema: ModuloSistema,
    fonte: FonteRelatorio
): boolean {
    return user.hasSomeRoles([
        `Reports.${action}.${sistema}` as ListaDePrivilegios,
        `Reports.${action}.${sistema}:${fonte}` as ListaDePrivilegios,
    ]);
}

/**
 * Manter modelos (criar/editar/remover) é um eixo separado de executar relatórios: quem roda
 * relatórios **usa** modelos, quem os mantém precisa de `Reports.modelo_admin.{sistema}`.
 *
 * Um por sistema e sem escopo de fonte, ao contrário de `executar`/`remover`: a amarração à fonte
 * já vem de graça, porque gerenciar um modelo também exige poder executar aquela fonte
 * (`assertPodeEscrever`). Repetir o escopo aqui só multiplicaria privilégios sem restringir nada.
 */
export function hasModeloAdminPriv(user: PessoaFromJwt, sistema: ModuloSistema): boolean {
    return user.hasSomeRoles([`Reports.modelo_admin.${sistema}` as ListaDePrivilegios]);
}

/** `true` quando o usuário tem o privilégio amplo do sistema (sem escopo de fonte). */
export function hasReportPrivAmplo(
    user: PessoaFromJwt,
    action: 'executar' | 'remover',
    sistema: ModuloSistema
): boolean {
    return user.hasSomeRoles([`Reports.${action}.${sistema}` as ListaDePrivilegios]);
}

/** Fontes do sistema que o usuário pode executar (amplo ou escopado). */
export function fontesPermitidas(user: PessoaFromJwt, sistema: ModuloSistema): FonteRelatorio[] {
    const todas = fontesDoSistema(sistema);
    if (hasReportPrivAmplo(user, 'executar', sistema)) return [...todas];
    return todas.filter((f) => hasReportPriv(user, 'executar', sistema, f));
}

/**
 * Predicado de visibilidade de `RelatorioModelo`, em forma de `OR` do Prisma.
 *
 * Escopos (mesma semântica do `Relatorio`):
 * - `publico`   → todos que já passaram pelo filtro de fonte/privilégio;
 * - `privado`   → somente o criador;
 * - `meu_orgao` → pessoas do órgão gravado no modelo.
 *
 * Linhas sem `visibilidade_tipo` (não deveriam existir, mas o campo é anulável para espelhar o
 * `Relatorio`) caem no caso restritivo: só o criador vê.
 *
 * Compartilhado entre o CRUD de modelos e a criação de relatório para que "quem pode ver o
 * modelo" tenha uma definição única — usar um modelo é uma forma de ler o modelo.
 */
export function modeloVisibilidadeWhere(user: PessoaFromJwt): Prisma.RelatorioModeloWhereInput[] {
    const or: Prisma.RelatorioModeloWhereInput[] = [{ visibilidade_tipo: 'publico' }, { criado_por: user.id }];

    if (user.orgao_id) or.push({ visibilidade_tipo: 'meu_orgao', orgao_id: user.orgao_id });

    return or;
}
