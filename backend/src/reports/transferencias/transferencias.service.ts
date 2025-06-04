import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, EnumHumano, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelTransferenciasDto, TipoRelatorioTransferencia } from './dto/create-transferencias.dto';
import {
    RelTransferenciaCronogramaDto,
    RelTransferenciasDto,
    TransferenciasRelatorioDto,
} from './entities/transferencias.entity';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { formataSEI } from 'src/common/formata-sei';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { ParlamentarCargo } from '@prisma/client';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

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
    secretaria_concedente_str: string | null;
    interface: string;
    esfera: string;
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
    tipo_transferencia: string;
    classificacao: string | null;
    pct_investimento: number | null;
    pct_custeio: number | null;
}

@Injectable()
export class TransferenciasService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService
    ) {}

    async asJSON(dto: CreateRelTransferenciasDto): Promise<TransferenciasRelatorioDto> {
        const whereCond = await this.buildFilteredWhereStr(dto);
        const out_transferencias: RelTransferenciasDto[] = [];

        const sql = `
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
                t.dotacao,
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
                t.secretaria_concedente_str,
                t.interface,
                t.esfera,
                tt.nome as tipo_transferencia,
                cl.nome as classificacao,
                tp.cargo,
                pa.id AS partido_id,
                pa.sigla AS partido_sigla,
                pa.nome AS partido_nome,
                o1.id AS orgao_concedente_id,
                o1.sigla AS orgao_concedente_sigla,
                o1.descricao AS orgao_concedente_descricao,
                p.id AS parlamentar_id,
                p.nome_popular AS parlamentar_nome_popular,
                p.nome AS parlamentar_nome,
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
                dr.dotacao AS distribuicao_recurso_dotacao,
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
                        string_agg(processo_sei, '|')
                    FROM distribuicao_recurso_sei
                    WHERE distribuicao_recurso_id = dr.id
                ) AS distribuicao_recurso_sei,
                drst.nome_responsavel AS distribuicao_recurso_status_nome_responsavel,
                COALESCE(dsb.nome, ds.nome) AS distribuicao_recurso_status_nome_base,
                o2.descricao AS distribuicao_recurso_orgao_gestor
            FROM transferencia t
            JOIN transferencia_tipo tt ON tt.id = t.tipo_id
            LEFT JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id AND tp.removido_em IS NULL
            LEFT JOIN parlamentar p ON p.id = tp.parlamentar_id AND p.removido_em IS NULL
            LEFT JOIN partido pa ON pa.id = tp.partido_id
            JOIN orgao o1 ON o1.id = t.orgao_concedente_id
            LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
            LEFT JOIN (
                SELECT
                    id,
                    status_base_id,
                    status_id,
                    distribuicao_id,
                    removido_em -- Added missing removido_em for subquery consistency
                FROM distribuicao_recurso_status 
                ORDER BY data_troca DESC, id DESC
                LIMIT 1
            ) drst ON drst.distribuicao_id = dr.id AND drst.removido_em IS NULL
            LEFT JOIN distribuicao_status_base dsb ON dsb.id = drst.status_base_id
            LEFT JOIN distribuicao_status ds ON drst.status_id = ds.id AND ds.removido_em IS NULL
            LEFT JOIN distribuicao_recurso_sei drs ON drs.distribuicao_recurso_id = dr.id AND drs.removido_em IS NULL
            LEFT JOIN classificacao cl on t.classificacao_id = cl.id and tt.id = cl.transferencia_tipo_id
            JOIN orgao o2 ON dr.orgao_gestor_id = o2.id 
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
                    hirearquia: `="${tarefasHierarquia[e.id]}"`,
                    tarefa: e.tarefa,
                    inicio_planejado: e.inicio_planejado,
                    termino_planejado: e.termino_planejado,
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
            whereConditions.push(`tp.partido_id = $${paramIndex}`);
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
            whereConditions.push(`tp.parlamentar_id = $${paramIndex}`);
            queryParams.push(filters.parlamentar_id);
            paramIndex++;
        }

        whereConditions.push(`t.removido_em IS NULL`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        return { whereString, queryParams };
    }

    private formatEmpenho(value: boolean | null | undefined): string | null {
        if (value === true) return 'Sim';
        if (value === false) return 'Não';
        return null; // Will be handled by `?? ''` later
    }

    private formatExcelString(value: string | null | undefined): string {
        return value !== null && value !== undefined ? `="${String(value).replace(/"/g, '""')}"` : '';
    }

    private convertRowsTransferenciasInto(input: RetornoDbTransferencias[], out: RelTransferenciasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                identificador: db.identificador,
                ano: db.ano,
                objeto: db.objeto,
                detalhamento: db.detalhamento ?? '',
                clausula_suspensiva:
                    db.clausula_suspensiva === true ? 'Sim' : db.clausula_suspensiva === false ? 'Não' : '',
                clausula_suspensiva_vencimento: Date2YMD.toStringOrNull(db.clausula_suspensiva_vencimento) ?? '',
                normativa: db.normativa ?? '',
                observacoes: db.observacoes ?? '',
                programa: db.programa ?? '',
                nome_programa: db.nome_programa ?? '',
                empenho: this.formatEmpenho(db.empenho) ?? '',
                pendente_preenchimento_valores: db.pendente_preenchimento_valores ? 'Sim' : 'Não',
                valor: db.valor ? db.valor : null,
                valor_total: db.valor_total ? db.valor_total : null,
                valor_contrapartida: db.valor_contrapartida ? db.valor_contrapartida : null,
                emenda: db.emenda ?? '',
                emenda_unitaria: this.formatExcelString(db.emenda_unitaria),
                dotacao: db.dotacao ? this.formatExcelString(db.dotacao) : '', // Keeps ' - ' logic if desired for nulls
                demanda: db.demanda ?? '',
                banco_fim: this.formatExcelString(db.banco_fim),
                conta_fim: this.formatExcelString(db.conta_fim),
                agencia_fim: this.formatExcelString(db.agencia_fim),
                banco_aceite: this.formatExcelString(db.banco_aceite),
                conta_aceite: this.formatExcelString(db.conta_aceite),
                agencia_aceite: this.formatExcelString(db.agencia_aceite),
                gestor_contrato: db.gestor_contrato ?? '',
                ordenador_despesa: db.ordenador_despesa ?? '',
                numero_identificacao: db.numero_identificacao ?? '',
                secretaria_concedente: db.secretaria_concedente_str ?? '',
                interface: db.interface,
                esfera: db.esfera,
                tipo_transferencia: db.tipo_transferencia,
                classificacao: db.classificacao ?? '',
                cargo: db.cargo ? EnumHumano(ParlamentarCargo, db.cargo) : '',
                partido: db.partido_id
                    ? {
                          id: db.partido_id,
                          sigla: db.partido_sigla,
                      }
                    : null,

                orgao_concedente: {
                    id: db.orgao_concedente_id,
                    descricao: db.orgao_concedente_descricao,
                    sigla: db.orgao_concedente_sigla,
                },

                parlamentar: db.parlamentar_id
                    ? {
                          id: db.parlamentar_id,
                          nome: db.parlamentar_nome,
                          nome_popular: db.parlamentar_nome_popular,
                      }
                    : null,

                distribuicao_recurso: db.distribuicao_recurso_id
                    ? {
                          id: db.distribuicao_recurso_id,
                          transferencia_id: db.distribuicao_recurso_transferencia_id,
                          orgao_gestor_id: db.distribuicao_recurso_orgao_gestor_id,
                          orgao_gestor_descricao: db.distribuicao_recurso_orgao_gestor, // Assuming this is never null from DB if distribuicao_recurso_id exists
                          objeto: db.distribuicao_recurso_objeto, // Assuming this is never null from DB if distribuicao_recurso_id exists
                          valor: db.distribuicao_recurso_valor,
                          valor_total: db.distribuicao_recurso_valor_total,
                          valor_contrapartida: db.distribuicao_recurso_valor_contrapartida,
                          empenho:
                              (db.distribuicao_recurso_empenho === true
                                  ? 'Sim'
                                  : db.distribuicao_recurso_empenho === false
                                    ? 'Não'
                                    : null) ?? '',
                          programa_orcamentario_estadual: db.distribuicao_recurso_programa_orcamentario_estadual ?? '',
                          programa_orcamentario_municipal:
                              db.distribuicao_recurso_programa_orcamentario_municipal ?? '',
                          dotacao: db.distribuicao_recurso_dotacao ?? '',
                          proposta: db.distribuicao_recurso_proposta ?? '',
                          contrato: db.distribuicao_recurso_contrato ?? '',
                          convenio: db.distribuicao_recurso_convenio ?? '',
                          assinatura_termo_aceite:
                              Date2YMD.toStringOrNull(db.distribuicao_recurso_assinatura_termo_aceite) ?? '',
                          assinatura_municipio:
                              Date2YMD.toStringOrNull(db.distribuicao_recurso_assinatura_municipio) ?? '',
                          assinatura_estado: Date2YMD.toStringOrNull(db.distribuicao_recurso_assinatura_estado) ?? '',
                          vigencia: Date2YMD.toStringOrNull(db.distribuicao_recurso_vigencia) ?? '',
                          conclusao_suspensiva:
                              Date2YMD.toStringOrNull(db.distribuicao_recurso_conclusao_suspensiva) ?? '',
                          registro_sei:
                              (db.distribuicao_recurso_sei ? formataSEI(db.distribuicao_recurso_sei) : null) ?? '',
                          nome_responsavel: db.distribuicao_recurso_status_nome_responsavel ?? '',
                          status_nome_base: db.distribuicao_recurso_status_nome_base ?? '',
                          pct_custeio: db.distribuicao_recurso_custeio?.toString() ?? '', // Corrected source and default
                          pct_investimento: db.distribuicao_recurso_investimento?.toString() ?? '', // Corrected source and default
                      }
                    : null,
            });
        }
    }

    private formatCurrency(value: number | null): string {
        return value != null
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : '';
    }

    async toFileOutput(params: CreateRelTransferenciasDto, _ctx: ReportContext): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);

        const out: FileOutput[] = [];

        let fields: { value: string | ((row: any) => string); label: string }[];
        if (dados.tipo == TipoRelatorioTransferencia.Geral) {
            fields = [
                { value: 'id', label: 'ID' },
                { value: 'identificador', label: 'Identificador' },
                { value: 'ano', label: 'Ano' },
                { value: 'objeto', label: 'Objeto' },
                { value: 'detalhamento', label: 'Detalhamento' },
                { value: 'clausula_suspensiva', label: 'Clausula Suspensiva' },
                { value: 'clausula_suspensiva_vencimento', label: 'Data de vencimento da Suspensiva' },
                { value: 'normativa', label: 'Normativa' },
                { value: 'observacoes', label: 'Observações' },
                { value: 'nome_programa', label: 'Nome Programa / Portfólio' },
                { value: 'empenho', label: 'Empenho' },
                {
                    value: (row) => this.formatCurrency(row.valor),
                    label: 'Valor do Repasse',
                },
                {
                    value: (row) => this.formatCurrency(row.valor_total),
                    label: 'Valor Total',
                },
                {
                    value: (row) => this.formatCurrency(row.valor_contrapartida),
                    label: 'Contrapartida',
                },
                {
                    // Emenda is already a string, if it needs ="value" format, it should be applied in convertRows or here.
                    // Assuming emenda is a number-like string, `formatExcelString` is safer.
                    // Current: { value: (row) => (row.emenda ? `="${String(row.emenda).replace(/\D/g, '')}"` : ''), label: 'Emenda', },
                    // If row.emenda is already string from convertRows (db.emenda ?? ''):
                    value: (row) => (row.emenda ? `="${String(row.emenda).replace(/\D/g, '')}"` : ''), // Keeps existing logic for stripping non-digits
                    label: 'Emenda',
                },
                { value: 'dotacao', label: 'Dotação Orçamentária' }, // Already formatted as ="value" or ' - '
                {
                    // Similar to emenda, if demanda needs ="value" format.
                    // Current: value: (row) => (row.demanda ? `="${row.demanda}"` : ''),
                    value: (row) => (row.demanda ? `="${row.demanda}"` : ''), // Keeps existing logic
                    label: 'Número da Demanda/Proposta',
                },
                { value: 'banco_fim', label: 'Conta - Banco da Secretaria fim' }, // Already formatted as ="value"
                { value: 'conta_fim', label: 'Conta - Número da Secretaria fim' }, // Already formatted as ="value"
                { value: 'agencia_fim', label: 'Conta - Agência da Secretaria fim' }, // Already formatted as ="value"
                { value: 'banco_aceite', label: 'Conta - Banco do aceite' }, // Already formatted as ="value"
                { value: 'agencia_aceite', label: 'Conta - Agência do aceite' }, // Already formatted as ="value"
                { value: 'conta_aceite', label: 'Conta - Número do aceite' }, // Already formatted as ="value"
                // { value: 'nome_programa', label: 'Nome do Programa' }, // Duplicated? Already have 'Nome Programa / Portfólio'
                { value: 'emenda_unitaria', label: 'Emenda Unitária' }, // Already formatted as ="value"
                {
                    value: 'distribuicao_recurso.orgao_gestor_descricao',
                    label: 'Gestor Municipal do Contrato (secretaria)',
                },
                { value: 'ordenador_despesa', label: 'Ordenador de despesas' },
                { value: 'secretaria_concedente', label: 'Secretaria do órgão concedente' }, // Changed from secretaria_concedente_str
                { value: 'interface', label: 'Interface' },
                { value: 'esfera', label: 'Esfera' },
                { value: 'cargo', label: 'Cargo' },
                { value: 'partido.sigla', label: 'Partido' },
                { value: 'parlamentar.nome_popular', label: 'Parlamentar' },
                { value: 'orgao_concedente.descricao', label: 'Orgão Concedente' },
                { value: 'distribuicao_recurso.id', label: 'ID Distribuição de Recurso' },
                { value: 'distribuicao_recurso.nome_responsavel', label: 'Gestor Municipal (servidor)' },
                { value: 'distribuicao_recurso.objeto', label: 'Objeto detalhado' },
                {
                    value: (row) => this.formatCurrency(row.distribuicao_recurso?.valor), // Added ?. for safety
                    label: 'Distribuição - Valor do Repasse',
                },
                {
                    value: (row) => this.formatCurrency(row.distribuicao_recurso?.valor_total), // Added ?.
                    label: 'Distribuição - Valor Total',
                },
                {
                    value: (row) => this.formatCurrency(row.distribuicao_recurso?.valor_contrapartida), // Added ?.
                    label: 'Distribuição - Valor da Contrapartida',
                },
                { value: 'distribuicao_recurso.empenho', label: 'Distribuição - Empenho' },
                {
                    value: 'distribuicao_recurso.programa_orcamentario_estadual',
                    label: 'Programa Orçamentário Estadual ou Federal',
                },
                {
                    value: 'distribuicao_recurso.programa_orcamentario_municipal',
                    label: 'Programa Orçamentário Municipal',
                },
                { value: 'distribuicao_recurso.dotacao', label: 'Dotação orçamentária' },
                { value: 'distribuicao_recurso.proposta', label: 'N° Proposta' },
                { value: 'distribuicao_recurso.contrato', label: 'Nº do Contrato' },
                { value: 'distribuicao_recurso.convenio', label: 'Nº do Convênio/Pré Convênio' },
                {
                    value: 'distribuicao_recurso.assinatura_termo_aceite',
                    label: 'Data de assinatura do termo de aceite',
                },
                {
                    value: 'distribuicao_recurso.assinatura_municipio',
                    label: 'Data de assinatura do representante do Município',
                },
                {
                    value: 'distribuicao_recurso.assinatura_estado',
                    label: 'Data de assinatura do representante do Estado',
                },
                { value: 'distribuicao_recurso.vigencia', label: 'Data de início da vigência' },
                {
                    value: 'distribuicao_recurso.conclusao_suspensiva',
                    label: 'Data de conclusão da Suspensiva',
                },
                { value: 'distribuicao_recurso.registro_sei', label: 'Nº SEI' },
                { value: 'distribuicao_recurso.status_nome_base', label: 'Status da Demanda' },
                {
                    value: 'distribuicao_recurso.pct_custeio',
                    label: 'Custeio/Corrente',
                },
                {
                    value: 'distribuicao_recurso.pct_investimento',
                    label: 'Investimento/Capital',
                },
                { value: '', label: 'Distribuição - Banco' }, // These seem to be placeholders
                { value: '', label: 'Distribuição - Agência' },
                { value: '', label: 'Distribuição - Conta Corrente' },
                { value: '', label: 'Distribuição - Gestor da Conta' },
            ];
        } else {
            // Simplified report
            fields = [
                { value: 'identificador', label: 'Identificador' },
                { value: 'esfera', label: 'esfera' },
                {
                    // value: (row) => (row.demanda ? String(row.demanda) : ''), // Already a string "" or value
                    value: 'demanda', // row.demanda is already string, json2csv will handle it
                    label: 'Número da Demanda/Proposta',
                },
                { value: 'orgao_concedente.descricao', label: 'Orgão Concedente' },
                { value: 'parlamentar.nome_popular', label: 'parlamentar.nome_popular' },
                { value: 'partido.sigla', label: 'Partido' },
                { value: 'nome_programa', label: 'Nome do Programa' },
                { value: 'ano', label: 'Ano' },
                { value: 'objeto', label: 'Objeto' },
                { value: 'detalhamento', label: 'Detalhamento' },
                { value: 'clausula_suspensiva_vencimento', label: 'Cláusula Suspensiva' }, // Field name in CSV, refers to vencimento date
                { value: 'observacoes', label: 'Observações' },
                {
                    value: (row) => this.formatCurrency(row.valor),
                    label: 'Valor do Repasse',
                },
                {
                    value: (row) => this.formatCurrency(row.valor_total),
                    label: 'Valor Total',
                },
                {
                    value: (row) => this.formatCurrency(row.valor_contrapartida),
                    label: 'Valor Contrapartida',
                },
                { value: 'secretaria_concedente', label: 'Secretaria do órgão concedente' }, // Changed from secretaria_concedente_str
                {
                    value: 'distribuicao_recurso.orgao_gestor_descricao',
                    label: 'Gestor Municipal do Contrato (secretaria)',
                },
                { value: 'distribuicao_recurso.registro_sei', label: 'Nº SEI' },
                { value: 'distribuicao_recurso.convenio', label: 'Nº do Convênio/Pré Convênio' },
                {
                    value: 'distribuicao_recurso.assinatura_termo_aceite',
                    label: 'Data de assinatura do termo de aceite',
                },
                {
                    value: 'distribuicao_recurso.assinatura_municipio',
                    label: 'Data de assinatura do representante do município',
                },
                {
                    value: 'distribuicao_recurso.assinatura_estado',
                    label: 'Data de assinatura do representante do Estado',
                },
                { value: 'distribuicao_recurso.vigencia', label: 'Data de início de vigência' },
                {
                    value: 'distribuicao_recurso.conclusao_suspensiva',
                    label: 'Data de conclusão da Suspensiva',
                },
            ];
        }

        if (dados.linhas?.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: [], // No transforms, raw values from `dados.linhas`
                fields: fields,
            });
            const linhasCsv = json2csvParser.parse(dados.linhas); // Removed .map(r => ({...r})) as it's usually not needed
            out.push({
                name: 'transferencias.csv',
                buffer: Buffer.from(linhasCsv, 'utf8'),
            });
        }

        if (dados.linhas_cronograma?.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform, // Uses flatten
                fields: [
                    { value: 'transferencia_id', label: 'ID da Transferência' },
                    { value: 'hirearquia', label: 'Hierarquia' }, // Assumes hirearquia is already ="value" formatted if needed
                    { value: 'tarefa', label: 'Tarefa' },
                    {
                        value: (row: { inicio_planejado: string | null }) =>
                            row.inicio_planejado ? new Date(row.inicio_planejado).toLocaleDateString('pt-BR') : '',
                        label: 'Início Planejado',
                    },
                    {
                        value: (row: { termino_planejado: string | null }) =>
                            row.termino_planejado ? new Date(row.termino_planejado).toLocaleDateString('pt-BR') : '',
                        label: 'Término Planejado',
                    },
                    { value: 'custo_estimado', label: 'Custo Estimado' }, // Numbers are usually fine
                    { value: 'duracao_planejado', label: 'Duração Planejada' }, // Numbers are usually fine
                ],
            });

            const linhasCronogramaCsv = json2csvParser.parse(dados.linhas_cronograma);

            out.push({
                name: 'cronograma.csv',
                buffer: Buffer.from(linhasCronogramaCsv, 'utf8'),
            });
        }

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }
}
