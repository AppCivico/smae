import { FonteRelatorio, ModuloSistema } from '@prisma/client';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../../common/ListaDePrivilegios';

/**
 * Mapa fonte → sistema(s), espelho do `FONTES_POR_SISTEMA` de `ReportsService`.
 *
 * O mapa de lá é `const` de módulo (não exportado) e o `ReportsService` carrega meia dúzia de
 * services de relatório por injeção — importá-lo só para ler a tabela acoplaria este módulo de
 * CRUD a todo aquele grafo. Como o tipo é `Record<FonteRelatorio, ...>`, incluir uma fonte nova no
 * enum quebra a compilação aqui até que ela seja mapeada, o que impede o par de sair de sincronia
 * silenciosamente.
 *
 * A lista é plural porque as fontes `PS*` valem tanto para PlanoSetorial quanto para
 * ProgramaDeMetas.
 */
const SISTEMAS_POR_FONTE: Record<FonteRelatorio, readonly ModuloSistema[]> = {
    [FonteRelatorio.Orcamento]: ['PDM'],
    [FonteRelatorio.PrevisaoCusto]: ['PDM'],
    [FonteRelatorio.Indicadores]: ['PDM'],
    [FonteRelatorio.MonitoramentoMensal]: ['PDM'],

    [FonteRelatorio.PSOrcamento]: ['PlanoSetorial', 'ProgramaDeMetas'],
    [FonteRelatorio.PSPrevisaoCusto]: ['PlanoSetorial', 'ProgramaDeMetas'],
    [FonteRelatorio.PSIndicadores]: ['PlanoSetorial', 'ProgramaDeMetas'],
    [FonteRelatorio.PSMonitoramentoMensal]: ['PlanoSetorial', 'ProgramaDeMetas'],

    [FonteRelatorio.Projeto]: ['Projetos'],
    [FonteRelatorio.Projetos]: ['Projetos'],
    [FonteRelatorio.ProjetoStatus]: ['Projetos'],
    [FonteRelatorio.ProjetoOrcamento]: ['Projetos'],
    [FonteRelatorio.ProjetoPrevisaoCusto]: ['Projetos'],

    [FonteRelatorio.Obras]: ['MDO'],
    [FonteRelatorio.ObraStatus]: ['MDO'],
    [FonteRelatorio.ObrasOrcamento]: ['MDO'],
    [FonteRelatorio.ObrasPrevisaoCusto]: ['MDO'],

    [FonteRelatorio.Parlamentares]: ['CasaCivil'],
    [FonteRelatorio.TribunalDeContas]: ['CasaCivil'],
    [FonteRelatorio.Transferencias]: ['CasaCivil'],
    [FonteRelatorio.AtvPendentes]: ['CasaCivil'],
    [FonteRelatorio.Demandas]: ['CasaCivil'],
};

/** Fontes que o sistema da requisição pode manipular. */
export function fontesDoSistema(sistema: ModuloSistema): FonteRelatorio[] {
    return (Object.keys(SISTEMAS_POR_FONTE) as FonteRelatorio[]).filter((f) => SISTEMAS_POR_FONTE[f].includes(sistema));
}

export function fonteEhDoSistema(fonte: FonteRelatorio, sistema: ModuloSistema): boolean {
    return SISTEMAS_POR_FONTE[fonte].includes(sistema);
}

/**
 * Convenção de privilégio escopado, idêntica à de `ReportsService`: o privilégio sem `:`
 * (ex.: `Reports.executar.CasaCivil`) libera todas as fontes do sistema, e o escopado
 * (`Reports.executar.CasaCivil:Demandas`) libera apenas aquela fonte.
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
    if (hasReportPrivAmplo(user, 'executar', sistema)) return todas;
    return todas.filter((f) => hasReportPriv(user, 'executar', sistema, f));
}
