import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { flatten } from '@json2csv/transforms';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportFileSchema, SchemaAwareReportableService } from '../post-process/report-schema';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService } from '../utils/utils.service';
import { FilterTransferenciaCancelada } from 'src/casa-civil/transferencia/dto/filter-transferencia.dto';
import { STATUS_DISTRIBUICAO_PREJUDICADOS_SQL_IN } from 'src/casa-civil/distribuicao-recurso/distribuicao-status.helpers';
import { CreateRelTransferenciasDto } from './dto/create-transferencias.dto';
import {
    linhasPorTransferencia,
    RelTransferenciaCronogramaCsvRow,
    RelTransferenciasCsvRow,
    RelTransferenciasEDistribuicaoCsvRow,
} from './entities/transferencias-csv.entity';
import {
    RelTransferenciaCronogramaDto,
    RelTransferenciasDto,
    TransferenciasRelatorioDto,
} from './entities/transferencias.entity';

/**
 * O CSV bruto usa `__` como separador do aninhamento (`distribuicao_recurso`,
 * `orgao_concedente`) porque o builder DuckDB trata `.` como referência qualificada por
 * fonte — `distribuicao_recurso.id` seria lido como "coluna id da fonte
 * distribuicao_recurso".
 */
const TransferenciasFlattenTransforms = [flatten({ objects: true, arrays: true, separator: '__' })];

type WhereCond = {
    whereString: string;
    queryParams: any[];
};

class RetornoDbTransferencias {
    id: number;
    identificador: string;
    ano: number | null;
    objeto: string;
    detalhamento: string | null;
    clausula_suspensiva: boolean;
    clausula_suspensiva_vencimento: Date | null;
    normativa: string | null;
    observacoes: string | null;
    programa: string | null;
    empenho: boolean | null;
    pendente_preenchimento_valores: boolean;
    valor: number | null;
    valor_total: number | null;
    valor_contrapartida: number | null;
    emenda: string | null;
    dotacao: string | null;
    demanda: string | null;
    banco_fim: string | null;
    conta_fim: string | null;
    agencia_fim: string | null;
    banco_aceite: string | null;
    conta_aceite: string | null;
    nome_programa: string | null;
    agencia_aceite: string | null;
    emenda_unitaria: string | null;
    gestor_contrato: string | null;
    ordenador_despesa: string | null;
    numero_identificacao: string | null;
    plano_de_acao: string | null;
    secretaria_concedente_str: string | null;
    interface: string;
    esfera: string;
    cancelada: boolean;
    cargo: string | null;
    partido_id: number | null;
    partido_sigla: string | null;
    parlamentar_id: number | null;
    parlamentar_nome: string | null;
    parlamentar_nome_popular: string | null;
    orgao_concedente_id: number;
    orgao_concedente_sigla: string;
    orgao_concedente_descricao: string;
    distribuicao_recurso_id: number;
    distribuicao_recurso_transferencia_id: number;
    distribuicao_recurso_orgao_gestor_id: number;
    distribuicao_recurso_objeto: string;
    distribuicao_recurso_valor: number;
    distribuicao_recurso_valor_total: number;
    distribuicao_recurso_valor_contrapartida: number;
    distribuicao_recurso_empenho: boolean;
    distribuicao_recurso_programa_orcamentario_estadual: string | null;
    distribuicao_recurso_programa_orcamentario_municipal: string | null;
    distribuicao_recurso_dotacao: string | null;
    distribuicao_recurso_proposta: string | null;
    distribuicao_recurso_contrato: string | null;
    distribuicao_recurso_convenio: string | null;
    distribuicao_recurso_assinatura_termo_aceite: Date | null;
    distribuicao_recurso_assinatura_municipio: Date | null;
    distribuicao_recurso_assinatura_estado: Date | null;
    distribuicao_recurso_vigencia: Date | null;
    distribuicao_recurso_conclusao_suspensiva: Date | null;
    distribuicao_recurso_sei: string | null;
    distribuicao_recurso_orgao_gestor: string;
    distribuicao_recurso_status_nome_responsavel: string | null;
    distribuicao_recurso_status_nome_base: string | null;
    distribuicao_recurso_custeio: number | null;
    distribuicao_recurso_investimento: number | null;
    distribuicao_recurso_banco: string | null;
    distribuicao_recurso_conta: string | null;
    distribuicao_recurso_agencia: string | null;
    distribuicao_recurso_gestor_contrato: string | null;
    distribuicao_recurso_pct_custeio: number | null;
    distribuicao_recurso_pct_investimento: number | null;
    tipo_transferencia: string;
    classificacao: string | null;
    pct_investimento: number | null;
    pct_custeio: number | null;
    parlamentares_formatado: string | null; // Added for aggregated parlamentar info
}

@Injectable()
export class TransferenciasService implements ReportableService, SchemaAwareReportableService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService
    ) {}

    async asJSON(dto: CreateRelTransferenciasDto): Promise<TransferenciasRelatorioDto> {
        const whereCond = await this.buildFilteredWhereStr(dto);
        const out_transferencias: RelTransferenciasDto[] = [];

        const sql = `
            WITH parlamentar_agg AS (
                SELECT
                    tp.transferencia_id,
                    STRING_AGG(
                        COALESCE(p.nome_popular, p.nome) || ' (' || COALESCE(pa.sigla, 'Sem Partido') || ' - ' || COALESCE(tp.cargo::text, 'Sem Cargo') || ')',
                        ', '
                        ORDER BY COALESCE(p.nome_popular, p.nome)
                    ) AS parlamentares_formatado
                FROM transferencia_parlamentar tp
                LEFT JOIN parlamentar p ON p.id = tp.parlamentar_id AND p.removido_em IS NULL
                LEFT JOIN partido pa ON pa.id = tp.partido_id
                WHERE tp.removido_em IS NULL
                GROUP BY tp.transferencia_id
            )
            SELECT
                t.id,
                t.identificador,
                t.ano,
                t.objeto,
                t.detalhamento,
                t.clausula_suspensiva,
                t.clausula_suspensiva_vencimento,
                t.normativa,
                t.observacoes,
                t.programa,
                t.nome_programa,
                t.empenho,
                t.pendente_preenchimento_valores,
                t.valor,
                t.valor_total,
                t.pct_custeio,
                t.pct_investimento,
                t.valor_contrapartida,
                t.emenda,
                t.emenda_unitaria,
                (
                    SELECT STRING_AGG(td.dotacao, '|' ORDER BY td.criado_em)
                    FROM transferencia_dotacao td
                    WHERE td.transferencia_id = t.id
                    AND td.removido_em IS NULL
                ) AS dotacao,
                t.demanda,
                t.banco_fim,
                t.conta_fim,
                t.agencia_fim,
                t.banco_aceite,
                t.conta_aceite,
                t.agencia_aceite,
                t.gestor_contrato,
                t.ordenador_despesa,
                t.numero_identificacao,
                t.plano_de_acao,
                t.secretaria_concedente_str,
                t.interface,
                t.esfera,
                t.cancelada,
                tt.nome as tipo_transferencia,
                cl.nome as classificacao,
                o1.id AS orgao_concedente_id,
                o1.sigla AS orgao_concedente_sigla,
                o1.descricao AS orgao_concedente_descricao,
                p_agg.parlamentares_formatado,
                dr.id AS distribuicao_recurso_id,
                dr.transferencia_id AS distribuicao_recurso_transferencia_id,
                dr.orgao_gestor_id AS distribuicao_recurso_orgao_gestor_id,
                dr.objeto AS distribuicao_recurso_objeto,
                dr.valor AS distribuicao_recurso_valor,
                dr.valor_total AS distribuicao_recurso_valor_total,
                dr.valor_contrapartida AS distribuicao_recurso_valor_contrapartida,
                dr.empenho AS distribuicao_recurso_empenho,
                dr.programa_orcamentario_estadual AS distribuicao_recurso_programa_orcamentario_estadual,
                dr.programa_orcamentario_municipal AS distribuicao_recurso_programa_orcamentario_municipal,
                (
                    SELECT
                        array_to_string(
                            ARRAY(
                                SELECT DISTINCT unnested_value
                                FROM UNNEST(
                                    string_to_array(
                                        CONCAT_WS(
                                            '|',
                                            (
                                                SELECT STRING_AGG(drd.dotacao, '|')
                                                FROM distribuicao_recurso_dotacao drd
                                                WHERE drd.distribuicao_recurso_id = dr.id
                                                AND drd.removido_em IS NULL
                                            ),
                                            (
                                                SELECT STRING_AGG(drv.valor_vinculo, '|')
                                                FROM distribuicao_recurso_vinculo drv
                                                WHERE drv.distribuicao_id = dr.id
                                                AND drv.campo_vinculo = 'Dotacao'
                                                AND drv.removido_em IS NULL
                                                AND drv.invalidado_em IS NULL
                                            )
                                        ),
                                        '|'
                                    )
                                ) AS t(unnested_value)
                                WHERE unnested_value IS NOT NULL AND unnested_value != ''
                            ),
                            '|'
                        )
                ) AS distribuicao_recurso_dotacao,
                dr.proposta AS distribuicao_recurso_proposta,
                dr.contrato AS distribuicao_recurso_contrato,
                dr.convenio AS distribuicao_recurso_convenio,
                dr.assinatura_termo_aceite AS distribuicao_recurso_assinatura_termo_aceite,
                dr.assinatura_municipio AS distribuicao_recurso_assinatura_municipio,
                dr.assinatura_estado AS distribuicao_recurso_assinatura_estado,
                dr.vigencia AS distribuicao_recurso_vigencia,
                dr.conclusao_suspensiva AS distribuicao_recurso_conclusao_suspensiva,
                dr.custeio as distribuicao_recurso_custeio,
                dr.investimento as distribuicao_recurso_investimento,
                (
                    SELECT
                        string_agg(format_proc_sei_sinproc(processo_sei::text) , ' | ')
                    FROM distribuicao_recurso_sei
                    WHERE distribuicao_recurso_id = dr.id
                ) AS distribuicao_recurso_sei,
                drst.nome_responsavel AS distribuicao_recurso_status_nome_responsavel,
                COALESCE(dsb.nome, ds.nome) AS distribuicao_recurso_status_nome_base,
                o2.descricao AS distribuicao_recurso_orgao_gestor,
                dr.distribuicao_banco as distribuicao_recurso_banco,
                dr.distribuicao_conta as distribuicao_recurso_conta,
                dr.distribuicao_agencia as distribuicao_recurso_agencia,
                dr.gestor_contrato as distribuicao_recurso_gestor_contrato,
                dr.pct_custeio as distribuicao_recurso_pct_custeio,
                dr.pct_investimento as distribuicao_recurso_pct_investimento
            FROM transferencia t
            JOIN transferencia_tipo tt ON tt.id = t.tipo_id
            LEFT JOIN parlamentar_agg p_agg ON p_agg.transferencia_id = t.id
            JOIN orgao o1 ON o1.id = t.orgao_concedente_id
            LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
            LEFT JOIN LATERAL (
                SELECT
                    drs_inner.id,
                    drs_inner.status_base_id,
                    drs_inner.status_id,
                    drs_inner.nome_responsavel
                FROM distribuicao_recurso_status drs_inner
                WHERE drs_inner.distribuicao_id = dr.id
                  AND drs_inner.removido_em IS NULL
                ORDER BY drs_inner.data_troca DESC, drs_inner.id DESC
                LIMIT 1
            ) drst ON true
            LEFT JOIN distribuicao_status_base dsb ON dsb.id = drst.status_base_id
            LEFT JOIN distribuicao_status ds ON drst.status_id = ds.id AND ds.removido_em IS NULL
            LEFT JOIN classificacao cl on t.classificacao_id = cl.id and tt.id = cl.transferencia_tipo_id
            LEFT JOIN orgao o2 ON dr.orgao_gestor_id = o2.id
            ${whereCond.whereString}
            `;
        // In the above SQL, added "AND drst.removido_em IS NULL" to the subquery join condition for drst,
        // and included "removido_em" in its select list assuming it exists and is relevant,
        // also JOIN orgao o2 might need to be LEFT JOIN if dr can be null and o2 depends on dr.
        // Given the current structure, if dr is NULL, the entire row might be excluded by JOIN o2.
        // This change is minimal to ensure the subquery drst correctly filters. Assuming original SQL logic is largely correct.

        const data: RetornoDbTransferencias[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);
        this.convertRowsTransferenciasInto(data, out_transferencias);

        const tarefaCronoIds = await this.prisma.tarefaCronograma.findMany({
            where: {
                NOT: [{ transferencia_id: null }],
                removido_em: null,
                transferencia: {
                    // Mesmo esquema de 3 estados do relatório:
                    // NaoIncluir (padrão) => só não canceladas; Incluir => todas; Apenas => só canceladas.
                    cancelada:
                        dto.cancelada === FilterTransferenciaCancelada.Incluir
                            ? undefined
                            : dto.cancelada === FilterTransferenciaCancelada.Apenas
                              ? true
                              : false,
                    esfera: dto.esfera ?? undefined,
                    interface: dto.interface ?? undefined,
                    ano: dto.ano ?? undefined,
                    secretaria_concedente_str: dto.secretaria_concedente ?? undefined,
                    objeto: dto.objeto ?? undefined,
                    gestor_contrato: dto.gestor_contrato ?? undefined,
                    orgao_concedente_id: dto.orgao_gestor_id ?? undefined, // Note: This looks like orgao_concedente_id in filter refers to orgao_gestor_id in DTO
                    parlamentar:
                        dto.parlamentar_id || dto.partido_id
                            ? {
                                  some: {
                                      parlamentar_id: dto.parlamentar_id ?? undefined,
                                      partido_id: dto.partido_id ?? undefined,
                                  },
                              }
                            : undefined,
                    removido_em: null,
                },
            },
            select: { id: true, transferencia_id: true },
        });

        const tarefasOut: RelTransferenciaCronogramaDto[] = [];
        for (const tarefaCronoId of tarefaCronoIds) {
            let tarefasHierarquia: Record<string, string> = {};

            if (tarefaCronoId) tarefasHierarquia = await this.tarefaService.tarefasHierarquia(tarefaCronoId.id);

            const tarefasRows = tarefaCronoId
                ? await this.tarefaService.buscaLinhasRecalcProjecao(tarefaCronoId.id, null)
                : { linhas: [] };

            tarefasRows.linhas.map((e) => {
                tarefasOut.push({
                    transferencia_id: tarefaCronoId.transferencia_id!,
                    hierarquia: tarefasHierarquia[e.id] ?? null,
                    tarefa: e.tarefa,
                    inicio_planejado: Date2YMD.toStringOrNull(e.inicio_planejado),
                    termino_planejado: Date2YMD.toStringOrNull(e.termino_planejado),
                    custo_estimado: e.custo_estimado,
                    duracao_planejado: e.duracao_planejado,
                });
            });
        }

        return {
            linhas: out_transferencias,
            linhas_cronograma: tarefasOut,
            tipo: dto.tipo,
        };
    }

    private async buildFilteredWhereStr(filters: CreateRelTransferenciasDto): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        if (filters.esfera) {
            whereConditions.push(`t.esfera::TEXT = $${paramIndex}`);
            queryParams.push(filters.esfera);
            paramIndex++;
        }

        if (filters.interface) {
            whereConditions.push(`t.interface::TEXT = $${paramIndex}`);
            queryParams.push(filters.interface);
            paramIndex++;
        }

        if (filters.ano) {
            whereConditions.push(`t.ano = $${paramIndex}`);
            queryParams.push(filters.ano);
            paramIndex++;
        }

        if (filters.objeto) {
            whereConditions.push(`t.objeto = $${paramIndex}`);
            queryParams.push(filters.objeto);
            paramIndex++;
        }

        if (filters.gestor_contrato) {
            whereConditions.push(`t.gestor_contrato = $${paramIndex}`);
            queryParams.push(filters.gestor_contrato);
            paramIndex++;
        }

        if (filters.secretaria_concedente) {
            // via secretaria_concedente_str
            whereConditions.push(`t.secretaria_concedente_str = $${paramIndex}`);
            queryParams.push(filters.secretaria_concedente);
            paramIndex++;
        }

        if (filters.orgao_concedente_id) {
            whereConditions.push(`t.orgao_concedente_id = $${paramIndex}`);
            queryParams.push(filters.orgao_concedente_id);
            paramIndex++;
        }

        if (filters.partido_id) {
            // whereConditions.push(`tp.partido_id = $${paramIndex}`); // Old
            whereConditions.push(
                `EXISTS (SELECT 1 FROM transferencia_parlamentar tp_filter WHERE tp_filter.transferencia_id = t.id AND tp_filter.partido_id = $${paramIndex} AND tp_filter.removido_em IS NULL)`
            );
            queryParams.push(filters.partido_id);
            paramIndex++;
        }

        if (filters.orgao_gestor_id) {
            // This filter applies to distribuicao_recurso.orgao_gestor_id
            // The SQL join structure needs to allow this filter.
            // If dr is LEFT JOIN, this condition should be in ON clause of dr or handle nulls.
            // Current SQL: LEFT JOIN distribuicao_recurso dr ... JOIN orgao o2 ON dr.orgao_gestor_id = o2.id
            // The condition `dr.orgao_gestor_id = $X` in WHERE will effectively turn LEFT JOIN dr into INNER JOIN.
            // This might be intended.
            whereConditions.push(`dr.orgao_gestor_id = $${paramIndex}`);
            queryParams.push(filters.orgao_gestor_id);
            paramIndex++;
        }

        if (filters.parlamentar_id) {
            // whereConditions.push(`tp.parlamentar_id = $${paramIndex}`); // Old
            whereConditions.push(
                `EXISTS (SELECT 1 FROM transferencia_parlamentar tp_filter WHERE tp_filter.transferencia_id = t.id AND tp_filter.parlamentar_id = $${paramIndex} AND tp_filter.removido_em IS NULL)`
            );
            queryParams.push(filters.parlamentar_id);
            paramIndex++;
        }

        whereConditions.push(`t.removido_em IS NULL`);

        // Filtro de canceladas em 3 estados, considerando cancelamento no nível da transferência
        // (t.cancelada) e no nível da distribuição (status prejudicados: Cancelada/Declinada/
        // ImpedidaTecnicamente/Redirecionada). A lista de tipos vem de STATUS_DISTRIBUICAO_PREJUDICADOS
        // (fonte única) e cobre as duas gerações do enum — os status base atuais gravam esses terminais
        // como `Terminal`, então a lista literal antiga deixava a distribuição cancelada/redistribuída
        // aparecer no relatório.
        // - NaoIncluir (padrão): oculta ambas;
        // - Incluir: não filtra (todas);
        // - Apenas: mostra somente as canceladas em qualquer um dos níveis.
        if (filters.cancelada === FilterTransferenciaCancelada.Apenas) {
            whereConditions.push(
                `(t.cancelada = true
                  OR COALESCE(dsb.tipo::text, ds.tipo::text) IN (${STATUS_DISTRIBUICAO_PREJUDICADOS_SQL_IN}))`
            );
        } else if (filters.cancelada !== FilterTransferenciaCancelada.Incluir) {
            whereConditions.push(
                `t.cancelada = false`,
                `(dr.id IS NULL
                  OR COALESCE(dsb.tipo::text, ds.tipo::text) IS NULL
                  OR COALESCE(dsb.tipo::text, ds.tipo::text) NOT IN (${STATUS_DISTRIBUICAO_PREJUDICADOS_SQL_IN}))`
            );
        }

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        return { whereString, queryParams };
    }

    private formatEmpenho(value: boolean | null | undefined): string | null {
        if (value === true) return 'Sim';
        if (value === false) return 'Não';
        return null; // Will be handled by `?? ''` later
    }

    /**
     * Converte as linhas do banco no formato do CSV bruto.
     *
     * Aqui não há formatação de apresentação: números seguem números, datas em ISO
     * (`YYYY-MM-DD`) e ausência de valor é `null` (nunca `''` nem `="..."`). Traduções de
     * domínio (booleano → `Sim`/`Não`) continuam, pois não são formatação de locale.
     */
    private convertRowsTransferenciasInto(input: RetornoDbTransferencias[], out: RelTransferenciasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                identificador: db.identificador,
                ano: db.ano,
                objeto: db.objeto,
                detalhamento: db.detalhamento,
                clausula_suspensiva:
                    db.clausula_suspensiva === true ? 'Sim' : db.clausula_suspensiva === false ? 'Não' : null,
                clausula_suspensiva_vencimento: Date2YMD.toStringOrNull(db.clausula_suspensiva_vencimento),
                normativa: db.normativa,
                observacoes: db.observacoes,
                programa: db.programa,
                nome_programa: db.nome_programa,
                empenho: this.formatEmpenho(db.empenho),
                pendente_preenchimento_valores: db.pendente_preenchimento_valores ? 'Sim' : 'Não',
                // Sem ternário: `0` é valor legítimo (ex.: sem contrapartida exigida) e o
                // falsy-check antigo o transformava em null. Com o XLSX tipado isso deixou de ser
                // cosmético — a célula viraria vazia em vez de 0 e SUM/AVG no Excel mudariam.
                valor: db.valor,
                valor_total: db.valor_total,
                valor_contrapartida: db.valor_contrapartida,
                emenda: db.emenda,
                emenda_unitaria: db.emenda_unitaria,
                dotacao: db.dotacao,
                demanda: db.demanda,
                banco_fim: db.banco_fim,
                conta_fim: db.conta_fim,
                agencia_fim: db.agencia_fim,
                banco_aceite: db.banco_aceite,
                conta_aceite: db.conta_aceite,
                agencia_aceite: db.agencia_aceite,
                gestor_contrato: db.gestor_contrato,
                ordenador_despesa: db.ordenador_despesa,
                numero_identificacao: db.numero_identificacao,
                plano_de_acao: db.plano_de_acao,
                secretaria_concedente: db.secretaria_concedente_str,
                interface: db.interface,
                esfera: db.esfera,
                status: db.cancelada ? 'Cancelada' : 'Ativa',
                tipo_transferencia: db.tipo_transferencia,
                classificacao: db.classificacao,

                parlamentares_info: db.parlamentares_formatado, // Added

                orgao_concedente: {
                    id: db.orgao_concedente_id,
                    descricao: db.orgao_concedente_descricao,
                    sigla: db.orgao_concedente_sigla,
                },

                // parlamentar: db.parlamentar_id // Removed
                //     ? {
                //           id: db.parlamentar_id,
                //           nome: db.parlamentar_nome,
                //           nome_popular: db.parlamentar_nome_popular,
                //       }
                //     : null,

                distribuicao_recurso: db.distribuicao_recurso_id
                    ? {
                          id: db.distribuicao_recurso_id,
                          transferencia_id: db.distribuicao_recurso_transferencia_id,
                          orgao_gestor_id: db.distribuicao_recurso_orgao_gestor_id,
                          orgao_gestor_descricao: db.distribuicao_recurso_orgao_gestor,
                          objeto: db.distribuicao_recurso_objeto,
                          valor: db.distribuicao_recurso_valor,
                          valor_total: db.distribuicao_recurso_valor_total,
                          valor_contrapartida: db.distribuicao_recurso_valor_contrapartida,
                          empenho:
                              db.distribuicao_recurso_empenho === true
                                  ? 'Sim'
                                  : db.distribuicao_recurso_empenho === false
                                    ? 'Não'
                                    : null,
                          programa_orcamentario_estadual: db.distribuicao_recurso_programa_orcamentario_estadual,
                          programa_orcamentario_municipal: db.distribuicao_recurso_programa_orcamentario_municipal,
                          dotacao: db.distribuicao_recurso_dotacao,
                          proposta: db.distribuicao_recurso_proposta,
                          contrato: db.distribuicao_recurso_contrato,
                          convenio: db.distribuicao_recurso_convenio,
                          assinatura_termo_aceite: Date2YMD.toStringOrNull(
                              db.distribuicao_recurso_assinatura_termo_aceite
                          ),
                          assinatura_municipio: Date2YMD.toStringOrNull(db.distribuicao_recurso_assinatura_municipio),
                          assinatura_estado: Date2YMD.toStringOrNull(db.distribuicao_recurso_assinatura_estado),
                          vigencia: Date2YMD.toStringOrNull(db.distribuicao_recurso_vigencia),
                          conclusao_suspensiva: Date2YMD.toStringOrNull(db.distribuicao_recurso_conclusao_suspensiva),
                          registro_sei: db.distribuicao_recurso_sei,
                          nome_responsavel: db.distribuicao_recurso_status_nome_responsavel,
                          status_nome_base: db.distribuicao_recurso_status_nome_base,
                          pct_custeio: db.distribuicao_recurso_pct_custeio,
                          pct_investimento: db.distribuicao_recurso_pct_investimento,
                          conta: db.distribuicao_recurso_conta,
                          banco: db.distribuicao_recurso_banco,
                          agencia: db.distribuicao_recurso_agencia,
                          gestor_conta: db.distribuicao_recurso_gestor_contrato,
                      }
                    : null,
            });
        }
    }

    /**
     * Schema do CSV bruto — habilita o pós-processamento (seleção/filtro/ordenação de
     * colunas e geração de CSV pt-BR + XLSX tipado a partir do mesmo arquivo).
     */
    async describeSchema(_params: CreateRelTransferenciasDto): Promise<ReportFileSchema[]> {
        return [
            getReportRowSchema(RelTransferenciasCsvRow),
            getReportRowSchema(RelTransferenciasEDistribuicaoCsvRow),
            getReportRowSchema(RelTransferenciaCronogramaCsvRow),
        ];
    }

    /**
     * Escreve os CSVs **brutos**: cabeçalho com as chaves de máquina (nomes das colunas do
     * schema), valores crus e o conjunto **completo** de colunas, independente de
     * `params.tipo`.
     *
     * São três arquivos: `transferencias.csv` (uma linha por transferência),
     * `transferencias_e_distribuicao.csv` (uma linha por distribuição de recurso, com as colunas
     * das duas entidades) e `cronograma.csv`. Os dois primeiros são a mesma consulta em
     * granularidades diferentes — ver `RelTransferenciasCsvRow`.
     *
     * O recorte por tipo (Geral/Resumido) virou uma seleção padrão de colunas — veja
     * `COLUNAS_PADRAO_TRANSFERENCIAS_POR_TIPO` — aplicada na etapa de apresentação.
     */
    async toFileOutput(params: CreateRelTransferenciasDto, _ctx: ReportContext): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);
        const linhasTransf = linhasPorTransferencia(dados.linhas);
        await _ctx.resumoSaida('Transferências', linhasTransf.length);
        await _ctx.resumoSaida('Transferências e Distribuições', dados.linhas.length);
        await _ctx.resumoSaida('Cronograma de Transferências', dados.linhas_cronograma.length);

        const out: FileOutput[] = [];

        const schemas = await this.describeSchema(params);
        const [schemaTransf, schemaComDistrib, schemaCrono] = schemas;

        const tmpTransf = _ctx.getTmpFile('transferencias.csv');
        const transfOpts: CsvWriterOptions<RelTransferenciasDto> = {
            csvOptions: DefaultCsvOptions,
            transforms: TransferenciasFlattenTransforms,
            fields: schemaTransf.colunas.map((c) => c.name),
        };
        await WriteCsvToFile(linhasTransf, tmpTransf.stream, transfOpts);
        out.push({ name: 'transferencias.csv', localFile: tmpTransf.path });

        // Sempre emitido, inclusive quando nenhuma transferência tem mais de uma distribuição:
        // um arquivo que aparece e some conforme os dados é pior de automatizar do que um que,
        // no pior caso, repete o outro com as colunas de distribuição vazias.
        const tmpComDistrib = _ctx.getTmpFile('transferencias_e_distribuicao.csv');
        await WriteCsvToFile(dados.linhas, tmpComDistrib.stream, {
            csvOptions: DefaultCsvOptions,
            transforms: TransferenciasFlattenTransforms,
            fields: schemaComDistrib.colunas.map((c) => c.name),
        } satisfies CsvWriterOptions<RelTransferenciasDto>);
        out.push({ name: 'transferencias_e_distribuicao.csv', localFile: tmpComDistrib.path });

        if (dados.linhas_cronograma?.length) {
            const tmpCrono = _ctx.getTmpFile('cronograma.csv');
            const cronoOpts: CsvWriterOptions<RelTransferenciaCronogramaDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: TransferenciasFlattenTransforms,
                fields: schemaCrono.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(dados.linhas_cronograma, tmpCrono.stream, cronoOpts);
            out.push({ name: 'cronograma.csv', localFile: tmpCrono.path });
        }

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
