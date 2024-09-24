import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelTransferenciasDto, TipoRelatorioTransferencia } from './dto/create-transferencias.dto';
import {
    RelTransferenciaCronogramaDto,
    RelTransferenciasDto,
    TransferenciasRelatorioDto,
} from './entities/transferencias.entity';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { formataSEI } from 'src/common/formata-sei';

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
    tipo_transferencia :string;
    classificacao :string | null;
}

@Injectable()
export class TransferenciasService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
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
                t.empenho,
                t.pendente_preenchimento_valores,
                t.valor,
                t.valor_total,
                t.valor_contrapartida,
                t.emenda,
                t.dotacao,
                t.demanda,
                t.banco_fim,
                t.conta_fim,
                t.agencia_fim,
                t.banco_aceite,
                t.conta_aceite,
                t.nome_programa,
                t.agencia_aceite,
                t.emenda_unitaria,
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
                o1.descricao AS orgao_concedente_nome,
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
                drs.processo_sei AS distribuicao_recurso_sei,
                o2.descricao AS distribuicao_recurso_orgao_gestor
            FROM transferencia t
            JOIN transferencia_tipo tt ON tt.id = t.tipo_id
            LEFT JOIN transferencia_parlamentar tp ON tp.transferencia_id = t.id AND tp.removido_em IS NULL
            LEFT JOIN parlamentar p ON p.id = tp.parlamentar_id AND p.removido_em IS NULL
            LEFT JOIN partido pa ON pa.id = tp.partido_id
            JOIN orgao o1 ON o1.id = t.orgao_concedente_id
            LEFT JOIN distribuicao_recurso dr ON dr.transferencia_id = t.id AND dr.removido_em IS NULL
            LEFT JOIN distribuicao_recurso_sei drs ON drs.distribuicao_recurso_id = dr.id AND drs.removido_em IS NULL
            LEFT JOIN classificacao cl on t.classificacao_id = cl.id and tt.id = cl.transferencia_tipo_id
            JOIN orgao o2 ON dr.orgao_gestor_id = o2.id
            ${whereCond.whereString}
            `;

        const data: RetornoDbTransferencias[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);
        this.convertRowsTransferenciasInto(data, out_transferencias);

        const tarefaCronoIds = await this.prisma.tarefaCronograma.findMany({
            where: {
                NOT: [{ transferencia_id: null }],
                removido_em: null,
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
                    hirearquia: tarefasHierarquia[e.id],
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
            whereConditions.push(`tp.partido_id = $${paramIndex}`);
            queryParams.push(filters.partido_id);
            paramIndex++;
        }

        if (filters.gestor_municipal_id){
            whereConditions.push(`dt.orgao_gestor_id = $${paramIndex}`);
            queryParams.push(filters.gestor_municipal_id);
            paramIndex++;
        }

        if (filters.parlamentar_id){
            whereConditions.push(`tp.parlamentar_id = $${paramIndex}`);
            queryParams.push(filters.parlamentar_id);
            paramIndex++;
        }

        whereConditions.push(`t.removido_em IS NULL`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        return { whereString, queryParams };
    }

    private convertRowsTransferenciasInto(input: RetornoDbTransferencias[], out: RelTransferenciasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                identificador: db.identificador,
                ano: db.ano,
                objeto: db.objeto,
                detalhamento: db.detalhamento,
                clausula_suspensiva: db.clausula_suspensiva ? 'Sim' : 'Não',
                clausula_suspensiva_vencimento: Date2YMD.toStringOrNull(db.clausula_suspensiva_vencimento),
                normativa: db.normativa,
                observacoes: db.observacoes,
                programa: db.programa,
                empenho: db.empenho ? 'Sim' : 'Não',
                pendente_preenchimento_valores: db.pendente_preenchimento_valores ? 'Sim' : 'Não',
                valor: db.valor ? db.valor : null,
                valor_total: db.valor_total ? db.valor_total : null,
                valor_contrapartida: db.valor_contrapartida ? db.valor_contrapartida : null,
                emenda: db.emenda,
                dotacao: db.dotacao,
                demanda: db.demanda,
                banco_fim: db.banco_fim,
                conta_fim: db.conta_fim,
                agencia_fim: db.agencia_fim,
                banco_aceite: db.banco_aceite,
                conta_aceite: db.conta_aceite,
                nome_programa: db.nome_programa,
                agencia_aceite: db.agencia_aceite,
                emenda_unitaria: db.emenda_unitaria,
                gestor_contrato: db.gestor_contrato,
                ordenador_despesa: db.ordenador_despesa,
                numero_identificacao: db.numero_identificacao,
                secretaria_concedente: db.secretaria_concedente_str,
                interface: db.interface,
                esfera: db.esfera,
                tipo_transferencia: db.tipo_transferencia,
                classificacao: db.classificacao,
                cargo: db.cargo,

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
                          orgao_gestor_descricao: db.distribuicao_recurso_orgao_gestor,
                          objeto: db.distribuicao_recurso_objeto,
                          valor: db.distribuicao_recurso_valor,
                          valor_total: db.distribuicao_recurso_valor_total,
                          valor_contrapartida: db.distribuicao_recurso_valor_contrapartida,
                          empenho: db.distribuicao_recurso_empenho ? 'Sim' : 'Não',
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
                          registro_sei: db.distribuicao_recurso_sei ? formataSEI(db.distribuicao_recurso_sei) : null,
                      }
                    : null,
            });
        }
    }

    async toFileOutput(myInput: any, params: any): Promise<FileOutput[]> {
        //const dados = myInput as TransferenciasRelatorioDto;
        const dados = await this.asJSON(params);

        const out: FileOutput[] = [];

        let fields: { value: string; label: string }[];
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
                { value: 'programa', label: 'Programa / Portfólio' },
                { value: 'empenho', label: 'Empenho' },
                { value: 'valor', label: 'Valor' },
                { value: 'valor_total', label: 'Valor Total' },
                { value: 'valor_contrapartida', label: 'Contrapartida' },
                { value: 'emenda', label: 'Emenda' },
                { value: 'dotacao', label: 'Dotação Orçamentária' },
                { value: 'demanda', label: 'Número da Demanda' },
                { value: 'banco_fim', label: 'Conta - Banco da Secretaria fim' },
                { value: 'conta_fim', label: 'Conta - Número da secretaria fim' },
                { value: 'agencia_fim', label: 'Conta - Agência da secretaria fim' },
                { value: 'banco_aceite', label: 'Conta - Banco do aceite' },
                { value: 'conta_aceite', label: 'Conta - Agência do aceite' },
                { value: 'nome_programa', label: 'Nome do Programa' },
                { value: 'agencia_aceite', label: 'Conta - Agência do aceite' },
                { value: 'emenda_unitaria', label: 'Emenda Unitária' },
                { value: 'gestor_contrato', label: 'Gestor Municipal do Contrato (secretaria)' },
                { value: 'ordenador_despesa', label: 'Ordenador de despesas' },
                { value: 'numero_identificacao', label: 'Nº de identificação' },
                { value: 'secretaria_concedente_str', label: 'Secretaria do órgão concedente' },
                { value: 'interface', label: 'Interface' },
                { value: 'esfera', label: 'Esfera' },
                { value: 'cargo', label: 'Cargo' },
                { value: 'partido.sigla', label: 'Partido' },
                { value: 'parlamentar.nome_popular', label: 'Parlamentar' },
                { value: 'orgao_concedente.descricao', label: 'Orgão Concedente' },
                { value: 'distribuicao_recurso.id', label: 'ID Distribuição de Recurso' },
                { value: 'distribuicao_recurso.orgao_gestor_descricao', label: 'Gestor Municipal (servidor)' },
                { value: 'distribuicao_recurso.objeto', label: 'Objeto' },
                { value: 'distribuicao_recurso.valor', label: 'distribuicao_recurso_valor' },
                { value: 'distribuicao_recurso.valor_total', label: 'distribuicao_recurso_valor_total' },
                {
                    value: 'distribuicao_recurso.valor_contrapartida',
                    label: 'distribuicao_recurso_valor_contrapartida',
                },
                { value: 'distribuicao_recurso.empenho', label: 'distribuicao_recurso_empenho' },
                {
                    value: 'distribuicao_recurso.programa_orcamentario_estadual',
                    label: 'Programa Orçamentário Estadual ou Federal',
                },
                {
                    value: 'distribuicao_recurso.programa_orcamentario_municipal',
                    label: 'Programa Orçamentário Municipal',
                },
                { value: 'distribuicao_recurso.dotacao', label: 'Dotação orçamentária' },
                { value: 'distribuicao_recurso.proposta', label: 'Nº da Proposta' },
                { value: 'distribuicao_recurso.contrato', label: 'Nº do Contrato' },
                { value: 'distribuicao_recurso.convenio', label: 'Nº do Covênio/Pré Convênio' },
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
                { value: 'distribuicao_recurso.vigencia', label: 'Data de vigência' },
                {
                    value: 'distribuicao_recurso.conclusao_suspensiva',
                    label: 'Data de conclusão da Suspensiva',
                },
                { value: 'distribuicao_recurso.registro_sei', label: 'Nº SEI' },
            ];
        } else {
            fields = [
                { value: 'identificador', label: 'identificador' },
                { value: 'esfera', label: 'esfera' },
                { value: 'demanda', label: 'demanda' },
                { value: 'orgao_concedente.descricao', label: 'orgao_concedente.descricao' },
                { value: 'secretaria_concedente_str', label: 'secretaria_concedente' },
                { value: 'parlamentar.nome_popular', label: 'parlamentar.nome_popular' },
                { value: 'partido.sigla', label: 'partido.sigla' },
                { value: 'programa', label: 'programa' },
                { value: 'ano', label: 'ano' },
                { value: 'objeto', label: 'objeto' },
                { value: 'detalhamento', label: 'detalhamento' },
                { value: 'clausula_suspensiva_vencimento', label: 'clausula_suspensiva_vencimento' },
                { value: 'observacoes', label: 'observacoes' },
                { value: 'valor', label: 'valor' },
                { value: 'valor_contrapartida', label: 'valor_contrapartida' },
                { value: 'valor_total', label: 'valor_total' },
                { value: 'gestor_contrato', label: 'orgao_gestor_contrato' },
                { value: 'distribuicao_recurso.orgao_gestor_descricao', label: 'orgao_gestor.descricao' },
                { value: 'distribuicao_recurso.registro_sei', label: 'sei' },
                { value: 'distribuicao_recurso.convenio', label: 'convenio' },
                {
                    value: 'distribuicao_recurso.assinatura_termo_aceite',
                    label: 'assinatura_termo_aceite',
                },
                {
                    value: 'distribuicao_recurso.assinatura_municipio',
                    label: 'assinatura_municipio',
                },
                {
                    value: 'distribuicao_recurso.assinatura_estado',
                    label: 'assinatura_estado',
                },
                { value: 'distribuicao_recurso.vigencia', label: 'vigencia' },
                {
                    value: 'distribuicao_recurso.conclusao_suspensiva',
                    label: 'conclusao_suspensiva',
                },
            ];
        }

        if (dados.linhas?.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: fields,
            });
            const linhas = json2csvParser.parse(
                dados.linhas.map((r) => {
                    return { ...r };
                })
            );
            out.push({
                name: 'transferencias.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.linhas_cronograma?.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(
                dados.linhas_cronograma.map((r) => {
                    return { ...r };
                })
            );
            out.push({
                name: 'cronograma.csv',
                buffer: Buffer.from(linhas, 'utf8'),
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
