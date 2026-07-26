import { flatten } from '@json2csv/transforms';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ContratoPrazoUnidade, StatusContrato } from '@prisma/client';
import { DateTime } from 'luxon';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { AcompanhamentoService } from 'src/pp/acompanhamento/acompanhamento.service';
import { PlanoAcaoService } from 'src/pp/plano-de-acao/plano-de-acao.service';
import { ProjetoDetailDto } from 'src/pp/projeto/entities/projeto.entity';
import { RiscoService } from 'src/pp/risco/risco.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { Stream2Buffer } from '../../common/helpers/Streaming';
import { Html2Text } from '../../common/Html2Text';
import { ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { ProjetoRiscoStatus } from '../../pp/risco/entities/risco.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { getReportRowSchema } from '../post-process/report-column.decorator';
import { ReportFileSchema, SchemaAwareReportableService, findFileSchema } from '../post-process/report-schema';
import {
    RelProjetosAditivosDto,
    RelProjetosContratosDto,
    RelProjetosTermoEncerramentoDto,
} from '../pp-projetos/entities/projetos.entity';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService } from '../utils/utils.service';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import {
    RelProjetoAcompanhamentoCsvRow,
    RelProjetoAditivoCsvRow,
    RelProjetoArquivoCsvRow,
    RelProjetoContratoCsvRow,
    RelProjetoCronogramaCsvRow,
    RelProjetoDetalheCsvRow,
    RelProjetoEncaminhamentoCsvRow,
    RelProjetoEnderecoCsvRow,
    RelProjetoOrigemCsvRow,
    RelProjetoPlanoAcaoCsvRow,
    RelProjetoRiscoCsvRow,
    RelProjetoTermoEncerramentoCsvRow,
} from './entities/pp-projeto-csv.entity';
import {
    PPProjetoRelatorioDto,
    RelProjetoAcompanhamentoDto,
    RelProjetoCronogramaDto,
    RelProjetoEncaminhamentoDto,
    RelProjetoGeolocDto,
    RelProjetoOrigemDto,
    RelProjetoPlanoAcaoDto,
    RelProjetoRelatorioDto,
    RelProjetoRiscoDto,
} from './entities/previsao-custo.entity';

/**
 * O CSV bruto usa `__` como separador do aninhamento (`meta`, `projeto_etapa`,
 * `modalidade_licitacao`, `area_gestora`, `tipo`, `arquivo`, `criador`) porque o builder
 * DuckDB trata `.` como referência qualificada por fonte — `meta.id` seria lido como
 * "coluna id da fonte meta".
 *
 * `arrays: false` (o padrão do json2csv) é deliberado: campo array vira **uma** célula
 * serializada, e é isso que mantém o conjunto de colunas fixo. Ligar `arrays: true` criaria
 * colunas que aparecem/somem conforme os dados.
 */
const PPProjetoFlattenTransforms = [flatten({ objects: true, arrays: false, separator: '__' })];

/**
 * Data vinda do banco → `YYYY-MM-DD` (ou `null`).
 *
 * Tolera string porque parte dos campos já chega em ISO das conversões anteriores;
 * `Date2YMD.toString` lança exceção para não-Date, e derrubar o relatório inteiro por causa
 * de uma célula de data não é aceitável aqui.
 */
function DataParaYMD(d: Date | string | null | undefined): string | null {
    if (d === null || d === undefined) return null;
    if (d instanceof Date) return Date2YMD.toString(d);
    return String(d).substring(0, 10);
}

/**
 * Numérico do banco → string, preservando a precisão.
 *
 * Colunas `numeric` voltam como `Decimal` do Prisma; `toNumber()` passaria por `double` e
 * perderia centavos em valores grandes. O DuckDB relê a string como `DECIMAL(18,x)`.
 */
function NumeroParaString(v: unknown): string | null {
    if (v === null || v === undefined) return null;
    return String(v);
}

class RetornoDbAditivos {
    aditivo_id: number;
    contrato_id: number;
    numero: number;
    tipo_aditivo_id: number;
    tipo_aditivo_nome: string;
    tipo_categoria: string;
    data: Date | null;
    data_termino_atual: Date | null;
    valor: number | null;
    percentual_medido: number | null;
}

class RetornoDbContratos {
    id: number;
    projeto_id: number;
    numero: string;
    exclusivo: boolean;
    status: StatusContrato;
    objeto: string | null;
    descricao_detalhada: string | null;
    contratante: string | null;
    empresa_contratada: string | null;
    cnpj_contratada: string | null;
    prazo: number | null;
    unidade_prazo: ContratoPrazoUnidade | null;
    data_base: string | null;
    data_inicio: Date | null;
    data_termino: Date | null;
    data_termino_atualizada: Date | null;
    valor: number | null;
    observacoes: string | null;
    valor_contrato_atualizado: number | null;
    total_aditivos: number | null;
    total_reajustes: number | null;
    modalidade_contratacao_id: number | null;
    modalidade_contratacao_nome: string | null;
    orgao_id: number | null;
    orgao_sigla: string | null;
    orgao_descricao: string | null;
    percentual_medido: number | null;
    processos_sei: string | null;
    fontes_recurso: string | null;
}

class RetornoDbOrigens {
    projeto_id: number;
    pdm_id: number | null;
    pdm_titulo: string | null;
    meta_id: number | null;
    meta_titulo: string | null;
    iniciativa_id: number | null;
    iniciativa_titulo: string | null;
    atividade_id: number | null;
    atividade_titulo: string | null;
}

class RetornoDbLoc {
    projeto_id: number;
    endereco: string;
    zona: string | null;
    distrito: string | null;
    subprefeitura: string | null;
    coordinates: string | null;
    geojson_type: string | null;
    geometry_type: string | null;
    cep: string | null;
    rua: string | null;
    pais: string | null;
    bairro: string | null;
    cidade: string | null;
    estado: string | null;
    rotulo: string | null;
    osm_type: string | null;
    codigo_pais: string | null;
    string_endereco: string | null;
    geometry_name: string | null;
    bbox: string | null;
}

class RetornoDbTermoEncerramento {
    projeto_id: number;
    projeto_codigo: string | null;
    nome_projeto: string;
    orgao_responsavel_nome: string;
    portfolios_nomes: string;
    objeto: string;
    previsao_inicio: Date | null;
    previsao_termino: Date | null;
    data_inicio_real: Date | null;
    data_termino_real: Date | null;
    previsao_custo: number | null;
    valor_executado_total: number | null;
    status_final: string;
    etapa_nome: string;
    justificativa: string | null;
    justificativa_complemento: string | null;
    responsavel_encerramento_nome: string;
    data_encerramento: Date;
}

@Injectable()
export class PPProjetoService implements ReportableService, SchemaAwareReportableService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => RiscoService)) private readonly riscoService: RiscoService,
        @Inject(forwardRef(() => PlanoAcaoService)) private readonly planoAcaoService: PlanoAcaoService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefaService: TarefaService,
        @Inject(forwardRef(() => AcompanhamentoService)) private readonly acompanhamentoService: AcompanhamentoService
    ) {}

    async asJSON(dto: CreateRelProjetoDto, user: PessoaFromJwt | null): Promise<PPProjetoRelatorioDto> {
        const projetoRow: ProjetoDetailDto = await this.projetoService.findOne(
            'PP',
            dto.projeto_id,
            user ?? undefined,
            'ReadOnly'
        );

        const anoCorrente = DateTime.local({ locale: SYSTEM_TIMEZONE }).year;
        const detail: RelProjetoRelatorioDto = {
            projeto_id: projetoRow.id,
            codigo: projetoRow.codigo,
            portfolio_id: projetoRow.portfolio_id,
            nome: projetoRow.nome,
            portfolio_titulo: projetoRow.portfolio.titulo,
            etiquetas: projetoRow.tags_portfolio ? projetoRow.tags_portfolio.map((e) => e.descricao).join('|') : null,
            status: projetoRow.status,
            projeto_etapa: projetoRow.projeto_etapa,
            previsao_inicio: projetoRow.previsao_inicio,
            previsao_termino: projetoRow.previsao_termino,
            previsao_duracao: projetoRow.previsao_duracao,
            previsao_custo: projetoRow.previsao_custo,
            objeto: projetoRow.objeto,
            objetivo: projetoRow.objetivo,
            nao_escopo: projetoRow.nao_escopo,
            orgao_responsavel_id: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.id : null,
            orgao_responsavel_sigla: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.sigla : null,
            orgao_responsavel_descricao: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.descricao : null,
            responsavel_id: projetoRow.responsavel ? projetoRow.responsavel.id : null,
            responsavel_nome_exibicao: projetoRow.responsavel ? projetoRow.responsavel.nome_exibicao : null,
            orgao_gestor_id: projetoRow.orgao_gestor.id,
            orgao_gestor_sigla: projetoRow.orgao_gestor.sigla,
            orgao_gestor_descricao: projetoRow.orgao_gestor.descricao,
            meta_id: projetoRow.meta_id,
            responsaveis_no_orgao_gestor: projetoRow.responsaveis_no_orgao_gestor.length
                ? projetoRow.responsaveis_no_orgao_gestor.map((e) => e.nome_exibicao).join('|')
                : null,
            origem_tipo: projetoRow.origem_tipo,
            origem_outro: projetoRow.origem_outro,
            secretario_responsavel: projetoRow.secretario_responsavel,
            secretario_executivo: projetoRow.secretario_executivo,
            coordenador_ue: projetoRow.coordenador_ue,
            data_aprovacao: projetoRow.data_aprovacao,
            data_revisao: projetoRow.data_revisao,
            versao: projetoRow.versao,
            arquivado: projetoRow.arquivado,
            iniciativa_id: projetoRow.iniciativa_id,
            atividade_id: projetoRow.atividade_id,
            meta_codigo: projetoRow.meta_codigo,
            resumo: projetoRow.resumo,
            publico_alvo: projetoRow.publico_alvo,
            realizado_inicio: projetoRow.realizado_inicio,
            realizado_termino: projetoRow.realizado_termino,
            realizado_custo: projetoRow.realizado_custo,
            principais_etapas: projetoRow.principais_etapas,
            eh_prioritario: projetoRow.eh_prioritario,
            atraso: projetoRow.atraso,
            em_atraso: projetoRow.em_atraso,
            tolerancia_atraso: projetoRow.tolerancia_atraso,
            projecao_termino: projetoRow.projecao_termino,
            realizado_duracao: projetoRow.realizado_duracao,
            percentual_concluido: projetoRow.percentual_concluido,
            portfolio_nivel_maximo_tarefa: projetoRow.portfolio.nivel_maximo_tarefa,
            meta: projetoRow.meta,

            fonte_recursos: projetoRow.fonte_recursos
                ? (
                      await Promise.all(
                          projetoRow.fonte_recursos.map(async (e) => {
                              let valor: string;

                              class queryRet {
                                  descricao: string;
                              }

                              let ano = e.fonte_recurso_ano;
                              if (ano > anoCorrente) ano = anoCorrente;

                              const nome_fonte: queryRet[] = await this.prisma
                                  .$queryRaw`SELECT descricao FROM sof_entidades_linhas WHERE codigo = ${e.fonte_recurso_cod_sof} AND ano = ${ano} AND col = 'fonte_recursos'`;

                              if (e.valor_nominal) {
                                  valor = e.valor_nominal.toString();
                              } else {
                                  valor = e.valor_percentual!.toString();
                              }

                              return `${nome_fonte[0].descricao}: ${valor}`;
                          })
                      )
                  ).join('|')
                : null,

            premissas: projetoRow.premissas ? projetoRow.premissas.map((e) => e.premissa).join('|') : null,
            restricoes: projetoRow.restricoes ? projetoRow.restricoes.map((e) => e.restricao).join('|') : null,
            orgaos_participantes: projetoRow.orgaos_participantes
                ? projetoRow.orgaos_participantes.map((e) => e.sigla).join('|')
                : null,
        };

        const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
            where: {
                projeto_id: projetoRow.id,
                removido_em: null,
            },
            select: { id: true },
        });

        let tarefasHierarquia: Record<string, string> = {};

        if (tarefaCronoId) tarefasHierarquia = await this.tarefaService.tarefasHierarquia(tarefaCronoId.id);

        const tarefasRows = tarefaCronoId
            ? await this.tarefaService.buscaLinhasRecalcProjecao(tarefaCronoId.id, null)
            : { linhas: [] };

        const tarefasOut: RelProjetoCronogramaDto[] = tarefasRows.linhas.map((e) => {
            // Tratando custos anualizados.
            let custo_estimado: number | null | string = null;
            let custo_real: number | null | string = null;

            if (e.custo_estimado_anualizado && e.custo_estimado_anualizado.length > 0) {
                // Retornamos no formato "ano: valor; ano: valor; ..."""
                custo_estimado = e.custo_estimado_anualizado
                    .filter((e) => e.valor !== null)
                    .map((e) => {
                        return `${e.ano}: ${e.valor}`;
                    })
                    .join('; ');
            } else {
                custo_estimado = e.backup_custo_estimado ? e.backup_custo_estimado : null;
            }

            if (e.custo_real_anualizado && e.custo_real_anualizado.length > 0) {
                // Retornamos no formato "ano: valor; ano: valor; ..."""
                custo_real = e.custo_real_anualizado
                    .filter((e) => e.valor !== null)
                    .map((e) => {
                        return `${e.ano}: ${e.valor}`;
                    })
                    .join('; ');
            } else {
                custo_real = e.backup_custo_real ? e.backup_custo_real : null;
            }

            return {
                projeto_id: projetoRow.id,
                tarefa_id: e.id,
                hirearquia: tarefasHierarquia[e.id],
                tarefa: e.tarefa,
                // Ausência de data é `null`, nunca `''`: o CSV bruto é relido com tipo DATE
                // no pós-processamento, e string vazia entre aspas não é NULL em toda
                // configuração de leitura.
                inicio_planejado: DataParaYMD(e.inicio_planejado),
                termino_planejado: DataParaYMD(e.termino_planejado),
                custo_estimado: custo_estimado,
                duracao_planejado: e.duracao_planejado,
                inicio_real: DataParaYMD(e.inicio_real),
                termino_real: DataParaYMD(e.termino_real),
                duracao_real: e.duracao_real,
                percentual_concluido: e.percentual_concluido,
                custo_real: custo_real,
            };
        });

        const riscoRows = await this.riscoService.findAll(dto.projeto_id, undefined);
        const riscosOut: RelProjetoRiscoDto[] = riscoRows.map((e) => {
            return {
                risco_id: e.id,
                codigo: e.codigo,
                titulo: e.titulo,
                descricao: e.descricao,
                probabilidade: e.probabilidade,
                probabilidade_descricao: e.probabilidade_descricao,
                impacto: e.impacto,
                impacto_descricao: e.impacto_descricao,
                grau: e.grau,
                grau_descricao: e.grau_descricao,
                status: ProjetoRiscoStatus[e.status_risco],
            };
        });

        const planoAcaoRows = await this.planoAcaoService.findAll(dto.projeto_id, { risco_id: undefined }, undefined);
        const planoAcaoOut: RelProjetoPlanoAcaoDto[] = planoAcaoRows.map((e) => {
            return {
                risco_id: e.projeto_risco.id,
                codigo_risco: e.projeto_risco.codigo,
                contramedida: e.contramedida,
                prazo_contramedida: e.prazo_contramedida,
                responsavel: e.responsavel,
                medidas_de_contingencia: e.medidas_de_contingencia,
                contramedida_texto: Html2Text(e.contramedida),
                medidas_de_contingencia_texto: Html2Text(e.medidas_de_contingencia),
            };
        });

        const acompanhamentoRows = await this.acompanhamentoService.findAll('PP', dto.projeto_id, undefined);
        const acompanhamentoOut: RelProjetoAcompanhamentoDto[] = acompanhamentoRows.map((a) => {
            return {
                acompanhamento_id: a.id,
                projeto_id: dto.projeto_id,
                acompanhamento_tipo: a.acompanhamento_tipo ? a.acompanhamento_tipo.nome : null,
                numero: a.ordem,
                data_registro: a.data_registro,
                participantes: a.participantes,
                detalhamento: a.detalhamento,
                observacao: a.observacao,
                detalhamento_status: a.detalhamento_status,
                pontos_atencao: a.pontos_atencao,
                pauta: a.pauta,
                cronograma_paralisado: a.cronograma_paralisado,
                riscos: a.risco ? a.risco.map((r) => r.codigo).join('|') : null,
                pauta_texto: Html2Text(a.pauta),
                detalhamento_texto: Html2Text(a.detalhamento),
                pontos_atencao_texto: Html2Text(a.pontos_atencao),
            };
        });

        // Encaminhamentos são retornados já junto com os acompanhamentos
        const encaminhamentoOut: RelProjetoEncaminhamentoDto[] = acompanhamentoRows.flatMap((a) => {
            return a.acompanhamentos.map((e) => {
                return {
                    acompanhamento_id: a.id,
                    numero_encaminhamento: e.numero_identificador,
                    encaminhamento: e.encaminhamento,
                    responsavel: e.responsavel,
                    prazo_encaminhamento: e.prazo_encaminhamento,
                    prazo_realizado: e.prazo_realizado,
                };
            });
        });

        const out_contratos: RelProjetosContratosDto[] = [];
        const out_aditivos: RelProjetosAditivosDto[] = [];
        const out_origens: RelProjetoOrigemDto[] = [];
        const out_enderecos: RelProjetoGeolocDto[] = [];
        const out_termos_encerramento: RelProjetosTermoEncerramentoDto[] = [];
        await this.queryDataContratos(projetoRow.id, out_contratos);
        await this.queryDataAditivos(projetoRow.id, out_aditivos);
        await this.queryDataOrigens(projetoRow.id, out_origens);
        await this.queryDataProjetosGeoloc(projetoRow.id, out_enderecos);
        await this.queryDataTermoEncerramento(projetoRow.id, out_termos_encerramento);

        return {
            detail: detail,
            cronograma: tarefasOut,
            riscos: riscosOut,
            planos_acao: planoAcaoOut,
            acompanhamentos: acompanhamentoOut,
            encaminhamentos: encaminhamentoOut,
            contratos: out_contratos,
            aditivos: out_aditivos,
            origens: out_origens,
            enderecos: out_enderecos,
            termos_encerramento: out_termos_encerramento,
        };
    }

    private async queryDataContratos(projetoId: number, out: RelProjetosContratosDto[]) {
        const sql = `SELECT
            contrato.id AS id,
            projeto.id AS projeto_id,
            contrato.numero AS numero,
            contrato.contrato_exclusivo AS exclusivo,
            contrato.status AS status,
            contrato.objeto_resumo AS objeto,
            contrato.objeto_detalhado AS descricao_detalhada,
            contrato.contratante AS contratante,
            contrato.empresa_contratada AS empresa_contratada,
            contrato.prazo_numero AS prazo,
            contrato.prazo_unidade AS unidade_prazo,
            contrato.data_base_mes::text || '/' ||  contrato.data_base_ano::text AS data_base,
            contrato.data_inicio AS data_inicio,
            contrato.data_termino AS data_termino,
            (
                SELECT max(data_termino_atualizada) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
                ) AS data_termino_atualizada,
            contrato.valor AS valor,
            contrato.observacoes AS observacoes,
            COALESCE(contrato.valor, 0) + aditivo_totals.total_aditivos + aditivo_totals.total_reajustes AS valor_contrato_atualizado,
            aditivo_totals.total_aditivos,
            aditivo_totals.total_reajustes,
            modalidade_contratacao.id AS modalidade_contratacao_id,
            modalidade_contratacao.nome AS modalidade_contratacao_nome,
            orgao.id AS orgao_id,
            orgao.sigla AS orgao_sigla,
            orgao.descricao AS orgao_descricao,
            (
                SELECT max(percentual_medido) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
                ) AS percentual_medido,
            (
                SELECT string_agg(format_proc_sei_sinproc(contrato_sei.numero_sei::text), '|')
                FROM contrato_sei
                WHERE contrato_sei.contrato_id = contrato.id
                ) AS processos_sei,
            (
                SELECT string_agg(cod_sof::text, '|')
                FROM contrato_fonte_recurso
                WHERE contrato_id = contrato.id
                ) AS fontes_recurso,
            f_formata_cnpj(contrato.cnpj_contratada) AS cnpj_contratada
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato_projeto ON contrato_projeto.projeto_id = projeto.id AND contrato_projeto.removido_em IS NULL
          JOIN contrato ON contrato.id = contrato_projeto.contrato_id AND contrato.removido_em IS NULL
          LEFT JOIN orgao ON orgao.id = contrato.orgao_id AND orgao.removido_em IS NULL
          LEFT JOIN modalidade_contratacao ON contrato.modalidade_contratacao_id = modalidade_contratacao.id AND modalidade_contratacao.removido_em IS NULL
          LEFT JOIN LATERAL (
              SELECT
                  COALESCE(SUM(CASE WHEN ta.tipo = 'Aditivo' THEN ca.valor ELSE 0 END), 0) AS total_aditivos,
                  COALESCE(SUM(CASE WHEN ta.tipo = 'Reajuste' THEN ca.valor ELSE 0 END), 0) AS total_reajustes
              FROM contrato_aditivo ca
              JOIN tipo_aditivo ta ON ta.id = ca.tipo_aditivo_id AND ta.removido_em IS NULL
              WHERE ca.contrato_id = contrato.id AND ca.removido_em IS NULL
          ) aditivo_totals ON true
        WHERE projeto.id = $1
        `;

        const data: RetornoDbContratos[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsContratos(data));
    }

    private convertRowsContratos(input: RetornoDbContratos[]): RelProjetosContratosDto[] {
        return input.map((db) => {
            return {
                contrato_id: db.id,
                projeto_id: db.projeto_id,
                numero: db.numero,
                exclusivo: db.exclusivo,
                status: db.status,
                objeto: db.objeto,
                descricao_detalhada: db.descricao_detalhada,
                contratante: db.contratante,
                empresa_contratada: db.empresa_contratada,
                prazo: db.prazo,
                unidade_prazo: db.unidade_prazo,
                data_base: db.data_base,
                data_inicio: db.data_inicio,
                data_termino: db.data_termino,
                data_termino_atualizada: db.data_termino_atualizada,
                valor: db.valor,
                observacoes: db.observacoes,
                valor_contrato_atualizado: db.valor_contrato_atualizado ?? null,
                total_aditivos: db.total_aditivos ?? null,
                total_reajustes: db.total_reajustes ?? null,
                modalidade_licitacao: db.modalidade_contratacao_id
                    ? { id: db.modalidade_contratacao_id!, nome: db.modalidade_contratacao_nome!.toString() }
                    : null,
                area_gestora: db.orgao_id
                    ? { id: db.orgao_id, sigla: db.orgao_sigla!.toString(), descricao: db.orgao_descricao!.toString() }
                    : null,
                percentual_medido: db.percentual_medido ?? null,
                processos_sei: db.processos_sei,
                fontes_recurso: db.fontes_recurso,
                cnpj_contratada: db.cnpj_contratada ?? null,
            } satisfies RelProjetosContratosDto;
        });
    }

    private async queryDataAditivos(projetoId: number, out: RelProjetosAditivosDto[]) {
        const sql = `SELECT
            contrato_aditivo.id AS aditivo_id,
            contrato.id AS contrato_id,
            contrato_aditivo.numero AS numero,
            tipo_aditivo.id AS tipo_aditivo_id,
            tipo_aditivo.nome AS tipo_aditivo_nome,
            tipo_aditivo.tipo AS tipo_categoria,
            contrato_aditivo.data,
            contrato_aditivo.data_termino_atualizada AS data_termino_atual,
            contrato_aditivo.valor,
            contrato_aditivo.percentual_medido
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato_projeto ON contrato_projeto.projeto_id = projeto.id AND contrato_projeto.removido_em IS NULL
          JOIN contrato ON contrato.id = contrato_projeto.contrato_id AND contrato.removido_em IS NULL
          JOIN contrato_aditivo ON contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
          JOIN tipo_aditivo ON tipo_aditivo.id = contrato_aditivo.tipo_aditivo_id AND tipo_aditivo.removido_em IS NULL
        WHERE projeto.id = $1
        `;

        const data: RetornoDbAditivos[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsAditivos(data));
    }

    private convertRowsAditivos(input: RetornoDbAditivos[]): RelProjetosAditivosDto[] {
        return input.map((db) => {
            return {
                aditivo_id: db.aditivo_id,
                contrato_id: db.contrato_id,
                tipo_categoria: db.tipo_categoria,
                tipo: { id: db.tipo_aditivo_id, nome: db.tipo_aditivo_nome },
                data: db.data ?? null,
                valor: db.valor ?? null,
                percentual_medido: db.percentual_medido ?? null,
                data_termino_atual: db.data_termino_atual ?? null,
            };
        });
    }

    private async queryDataOrigens(projetoId: number, out: RelProjetoOrigemDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            meta.pdm_id,
            pdm.nome AS pdm_titulo,
            meta.id as meta_id,
            meta.titulo as meta_titulo,
            iniciativa.id iniciativa_id,
            iniciativa.titulo as iniciativa_titulo,
            atividade.id atividade_id,
            atividade.titulo as atividade_titulo
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_origem ON projeto_origem.projeto_id = projeto.id AND projeto_origem.removido_em IS NULL
          LEFT JOIN meta ON meta.id = projeto_origem.meta_id AND meta.removido_em IS NULL
          LEFT JOIN iniciativa ON iniciativa.id = projeto_origem.iniciativa_id AND iniciativa.removido_em IS NULL
          LEFT JOIN atividade ON atividade.id = projeto_origem.atividade_id AND atividade.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id
        WHERE projeto.id = $1
        `;

        const data: RetornoDbOrigens[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsOrigens(data));
    }

    private convertRowsOrigens(input: RetornoDbOrigens[]): RelProjetoOrigemDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                pdm_id: db.pdm_id ?? null,
                pdm_titulo: db.pdm_titulo ?? null,
                meta_id: db.meta_id ?? null,
                meta_titulo: db.meta_titulo ?? null,
                iniciativa_id: db.iniciativa_id ?? null,
                iniciativa_titulo: db.iniciativa_titulo ?? null,
                atividade_id: db.atividade_id ?? null,
                atividade_titulo: db.atividade_titulo ?? null,
            };
        });
    }

    /**
     * `RelProjetosContratosDto` → linha do CSV bruto.
     *
     * O DTO é compartilhado com o relatório `Projetos` (e é resposta de API), por isso a
     * adaptação para o "compute store" acontece aqui e não na extração: datas viram ISO
     * `YYYY-MM-DD`, `Decimal` do Prisma vira string (sem passar por `double`) e os objetos
     * aninhados viram colunas `__`.
     */
    private toCsvRowsContratos(rows: RelProjetosContratosDto[]): RelProjetoContratoCsvRow[] {
        return rows.map((r) => {
            return {
                contrato_id: r.contrato_id,
                projeto_id: r.projeto_id,
                numero: r.numero,
                exclusivo: r.exclusivo,
                status: r.status,
                objeto: r.objeto,
                descricao_detalhada: r.descricao_detalhada,
                contratante: r.contratante,
                empresa_contratada: r.empresa_contratada,
                prazo: r.prazo,
                unidade_prazo: r.unidade_prazo,
                data_base: r.data_base,
                data_inicio: DataParaYMD(r.data_inicio),
                data_termino: DataParaYMD(r.data_termino),
                data_termino_atualizada: DataParaYMD(r.data_termino_atualizada),
                valor: NumeroParaString(r.valor),
                observacoes: r.observacoes,
                valor_contrato_atualizado: NumeroParaString(r.valor_contrato_atualizado),
                total_aditivos: NumeroParaString(r.total_aditivos),
                total_reajustes: NumeroParaString(r.total_reajustes),
                modalidade_licitacao__id: r.modalidade_licitacao?.id ?? null,
                modalidade_licitacao__nome: r.modalidade_licitacao?.nome ?? null,
                area_gestora__id: r.area_gestora?.id ?? null,
                area_gestora__sigla: r.area_gestora?.sigla ?? null,
                area_gestora__descricao: r.area_gestora?.descricao ?? null,
                percentual_medido: NumeroParaString(r.percentual_medido),
                processos_sei: r.processos_sei,
                fontes_recurso: r.fontes_recurso,
                cnpj_contratada: r.cnpj_contratada,
            };
        });
    }

    /** Idem `toCsvRowsContratos`, para `RelProjetosAditivosDto`. */
    private toCsvRowsAditivos(rows: RelProjetosAditivosDto[]): RelProjetoAditivoCsvRow[] {
        return rows.map((r) => {
            return {
                aditivo_id: r.aditivo_id,
                contrato_id: r.contrato_id,
                tipo_categoria: r.tipo_categoria,
                tipo__id: r.tipo?.id ?? null,
                tipo__nome: r.tipo?.nome ?? null,
                data: DataParaYMD(r.data),
                valor: NumeroParaString(r.valor),
                percentual_medido: NumeroParaString(r.percentual_medido),
                data_termino_atual: DataParaYMD(r.data_termino_atual),
            };
        });
    }

    /**
     * Schema dos CSVs brutos — habilita o pós-processamento (seleção/filtro/ordenação de
     * colunas e geração de CSV pt-BR + XLSX tipado a partir do mesmo arquivo).
     *
     * A lista segue a mesma ordem em que `toFileOutput` emite os arquivos. Nenhum arquivo
     * depende de `params` (a fonte tem um único parâmetro, `projeto_id`), então o conjunto
     * de schemas é sempre o mesmo — arquivos sem linha simplesmente não são escritos, e
     * `findFileSchema` só é consultado para os arquivos que existirem.
     *
     * `eap.svg` não entra: não é CSV e é repassado intacto pelo pós-processamento.
     */
    async describeSchema(_params: CreateRelProjetoDto): Promise<ReportFileSchema[]> {
        return [
            getReportRowSchema(RelProjetoDetalheCsvRow),
            getReportRowSchema(RelProjetoCronogramaCsvRow),
            getReportRowSchema(RelProjetoAcompanhamentoCsvRow),
            getReportRowSchema(RelProjetoEncaminhamentoCsvRow),
            getReportRowSchema(RelProjetoPlanoAcaoCsvRow),
            getReportRowSchema(RelProjetoRiscoCsvRow),
            getReportRowSchema(RelProjetoArquivoCsvRow),
            getReportRowSchema(RelProjetoContratoCsvRow),
            getReportRowSchema(RelProjetoAditivoCsvRow),
            getReportRowSchema(RelProjetoOrigemCsvRow),
            getReportRowSchema(RelProjetoTermoEncerramentoCsvRow),
            getReportRowSchema(RelProjetoEnderecoCsvRow),
        ];
    }

    /**
     * Escreve os CSVs **brutos**: cabeçalho com as chaves de máquina (nomes das colunas do
     * schema) e valores crus. Rótulos, moeda, `dd/mm/aaaa` e o guard do Excel voltam na
     * etapa de pós-processamento, a partir do próprio schema.
     */
    async toFileOutput(
        params: CreateRelProjetoDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        await ctx.progress(1);
        // relatório de apenas 1 item, por enquanto não há problemas de performance / memória
        const dados = await this.asJSON(params, user);

        // relatorio está sendo gerado pelo sistema, vamos configurar a restrição de acesso de acordo
        // com os dados do relatório
        if (!user) {
            const orgao_port = await this.prisma.portfolio.findFirstOrThrow({
                where: { id: dados.detail.portfolio_id },
                select: { orgaos: { select: { id: true } } },
            });

            ctx.setRestricaoAcesso({
                portfolio_orgao_ids: orgao_port.orgaos.map((o) => o.id),
                //                roles: [
                //                    'Projeto.administrador_no_orgao',
                //                    'ProjetoMDO.administrador_no_orgao',
                //                    'Projeto.administrador',
                //                    'ProjetoMDO.administrador',
                //                ],
            });
        }

        await ctx.progress(40);

        const out: FileOutput[] = [];
        const schemas = await this.describeSchema(params);

        /**
         * Escreve um CSV bruto em arquivo temporário, com as colunas (nome e ordem) vindas
         * do schema declarado.
         *
         * Precisa ser `localFile` (e não `buffer`): o pós-processamento só reprocessa
         * arquivos com caminho local — é ele que aplica rótulos e formatação.
         */
        const toCsvOut = async <T>(name: string, rows: T[]): Promise<void> => {
            if (!rows?.length) return;

            const schema = findFileSchema(schemas, name);
            if (!schema) throw new Error(`Schema de colunas não declarado para ${name}.`);

            const tmp = ctx.getTmpFile(name);
            const opts: CsvWriterOptions<T> = {
                csvOptions: DefaultCsvOptions,
                transforms: PPProjetoFlattenTransforms,
                fields: schema.colunas.map((c) => c.name),
            };
            await WriteCsvToFile(rows, tmp.stream, opts);
            out.push({ name, localFile: tmp.path });
        };

        // Tradução de domínio (não é formatação de locale), por isso segue na extração.
        // A chave usa `_` para virar um nome de coluna válido no schema; o rótulo entregue
        // continua sendo `status-traduzido`.
        if (dados.detail.status)
            (dados.detail as any)['status_traduzido'] = ProjetoStatusParaExibicao[dados.detail.status];
        await toCsvOut('detalhes-do-projeto.csv', [dados.detail]);
        await ctx.resumoSaida(`Detalhes do Projeto - ${dados.detail.nome}`, 1);
        await ctx.progress(50);

        await toCsvOut('cronograma.csv', dados.cronograma satisfies RelProjetoCronogramaCsvRow[]);
        await ctx.progress(55);

        await toCsvOut('acompanhamentos.csv', dados.acompanhamentos satisfies RelProjetoAcompanhamentoCsvRow[]);
        await ctx.progress(60);

        await toCsvOut('encaminhamentos.csv', dados.encaminhamentos satisfies RelProjetoEncaminhamentoCsvRow[]);
        await ctx.progress(65);

        await toCsvOut('planos-acao.csv', dados.planos_acao satisfies RelProjetoPlanoAcaoCsvRow[]);
        await ctx.progress(70);

        await toCsvOut('riscos.csv', dados.riscos satisfies RelProjetoRiscoCsvRow[]);
        await ctx.progress(80);

        const uploads = await this.prisma.projetoDocumento.findMany({
            where: {
                removido_em: null,
                projeto_id: dados.detail.projeto_id,
            },
            include: {
                arquivo: {
                    select: { id: true, nome_original: true, caminho: true },
                },
                criador: {
                    select: { id: true, nome_exibicao: true },
                },
            },
            orderBy: { criado_em: 'asc' },
        });

        // Achatado à mão (e não pelo `flatten`) por causa do `criado_em`: um `Date` cru sairia
        // como JSON e o `Z` do ISO impede o DuckDB de reler a coluna como TIMESTAMP.
        const arquivosOut: RelProjetoArquivoCsvRow[] = uploads.map((r) => {
            return {
                arquivo__nome_original: r.arquivo.nome_original,
                criado_em: r.criado_em.toISOString().replace('Z', ''),
                criador__id: r.criador?.id ?? null,
                criador__nome_exibicao: r.criador?.nome_exibicao ?? null,
                arquivo__caminho: r.arquivo.caminho,
                descricao: r.descricao,
                arquivo__id: r.arquivo.id,
            };
        });
        await toCsvOut('arquivos.csv', arquivosOut);
        await ctx.progress(90);

        if (dados.detail && dados.detail.projeto_id) {
            const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
                where: {
                    projeto_id: dados.detail.projeto_id,
                    removido_em: null,
                },
                select: { id: true },
            });

            if (tarefaCronoId) {
                const eap = await this.tarefaService.getEap(
                    tarefaCronoId.id,
                    { projeto_id: dados.detail.projeto_id },
                    'svg'
                );

                out.push({
                    name: 'eap.svg',
                    buffer: await Stream2Buffer(eap),
                });
            }
        }
        await ctx.progress(95);

        await toCsvOut('contratos.csv', this.toCsvRowsContratos(dados.contratos));
        await toCsvOut('aditivos.csv', this.toCsvRowsAditivos(dados.aditivos));
        // `origens`, `termos-encerramento` e `enderecos` já saem no formato do CSV bruto
        // (escalares, datas em ISO), então vão direto — os nomes das colunas do schema são
        // os próprios nomes das propriedades do DTO.
        await toCsvOut('origens.csv', dados.origens satisfies RelProjetoOrigemCsvRow[]);
        await toCsvOut(
            'termos-encerramento.csv',
            dados.termos_encerramento satisfies RelProjetoTermoEncerramentoCsvRow[]
        );
        await toCsvOut('enderecos.csv', dados.enderecos satisfies RelProjetoEnderecoCsvRow[]);

        await ctx.progress(99);

        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                        uploads: uploads,
                    }),
                    'utf8'
                ),
            },
            ...out,
        ];
    }

    private async queryDataTermoEncerramento(projetoId: number, out: RelProjetosTermoEncerramentoDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            pte.nome_projeto,
            pte.orgao_responsavel_nome,
            pte.portfolios_nomes,
            pte.objeto,
            pte.previsao_inicio,
            pte.previsao_termino,
            pte.data_inicio_real,
            pte.data_termino_real,
            pte.previsao_custo,
            pte.valor_executado_total,
            pte.status_final,
            pte.etapa_nome,
            pte_justif.descricao AS justificativa,
            pte.justificativa_complemento,
            pte.responsavel_encerramento_nome,
            pte.data_encerramento
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN projeto_termo_encerramento pte
              ON pte.projeto_id = projeto.id
              AND pte.removido_em IS NULL
              AND pte.ultima_versao = true
          LEFT JOIN projeto_tipo_encerramento pte_justif
              ON pte_justif.id = pte.justificativa_id
        WHERE projeto.id = $1
        `;

        const data: RetornoDbTermoEncerramento[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsTermoEncerramento(data));
    }

    private convertRowsTermoEncerramento(input: RetornoDbTermoEncerramento[]): RelProjetosTermoEncerramentoDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo ?? null,
                nome_projeto: db.nome_projeto,
                orgao_responsavel_nome: db.orgao_responsavel_nome,
                portfolios_nomes: db.portfolios_nomes,
                objeto: db.objeto,
                previsao_inicio: db.previsao_inicio ? Date2YMD.toString(db.previsao_inicio) : null,
                previsao_termino: db.previsao_termino ? Date2YMD.toString(db.previsao_termino) : null,
                data_inicio_real: db.data_inicio_real ? Date2YMD.toString(db.data_inicio_real) : null,
                data_termino_real: db.data_termino_real ? Date2YMD.toString(db.data_termino_real) : null,
                previsao_custo: db.previsao_custo ?? null,
                valor_executado_total: db.valor_executado_total ?? null,
                status_final: db.status_final,
                etapa_nome: db.etapa_nome,
                justificativa: db.justificativa ?? null,
                justificativa_complemento: db.justificativa_complemento ?? null,
                responsavel_encerramento_nome: db.responsavel_encerramento_nome,
                data_encerramento: Date2YMD.toString(db.data_encerramento),
            };
        });
    }

    private async queryDataProjetosGeoloc(projetoId: number, out: RelProjetoGeolocDto[]) {
        const sql = `
            SELECT
                projeto.id AS projeto_id,
                geo.endereco_exibicao AS endereco,
                zona_agg.zona,
                distrito_agg.distrito,
                subprefeitura_agg.subprefeitura,
                CONCAT(
                    (geo.geom_geojson->'geometry'->'coordinates'->1)::float,
                    ',',
                    (geo.geom_geojson->'geometry'->'coordinates'->0)::float
                ) AS coordinates,
                (geo.geom_geojson->>'type') AS geojson_type,
                (geo.geom_geojson->'geometry'->>'type') AS geometry_type,
                (geo.geom_geojson->'properties'->>'cep') AS cep,
                (geo.geom_geojson->'properties'->>'rua') AS rua,
                (geo.geom_geojson->'properties'->>'pais') AS pais,
                (geo.geom_geojson->'properties'->>'bairro') AS bairro,
                (geo.geom_geojson->'properties'->>'cidade') AS cidade,
                (geo.geom_geojson->'properties'->>'estado') AS estado,
                (geo.geom_geojson->'properties'->>'rotulo') AS rotulo,
                (geo.geom_geojson->'properties'->>'osm_type') AS osm_type,
                (geo.geom_geojson->'properties'->>'codigo_pais') AS codigo_pais,
                (geo.geom_geojson->'properties'->>'string_endereco') AS string_endereco,
                (geo.geom_geojson->>'geometry_name') AS geometry_name,
                (geo.geom_geojson->'bbox')::text AS bbox
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
            JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS zona
                FROM unnest(geo.calc_regioes_nivel_2) AS regiao_id
                LEFT JOIN regiao r ON r.id = regiao_id
            ) zona_agg ON true
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS subprefeitura
                FROM unnest(geo.calc_regioes_nivel_3) AS regiao_id
                LEFT JOIN regiao r ON r.id = regiao_id
            ) subprefeitura_agg ON true
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS distrito
                FROM unnest(geo.calc_regioes_nivel_4) AS regiao_id
                LEFT JOIN regiao r ON r.id = regiao_id
            ) distrito_agg ON true
            WHERE projeto.id = $1
        `;

        const data: RetornoDbLoc[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsLoc(data));
    }

    private convertRowsLoc(input: RetornoDbLoc[]): RelProjetoGeolocDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                endereco: db.endereco,
                zona: db.zona,
                distrito: db.distrito,
                subprefeitura: db.subprefeitura,
                coordinates: db.coordinates,
                geojson_type: db.geojson_type,
                geometry_type: db.geometry_type,
                cep: db.cep,
                rua: db.rua,
                pais: db.pais,
                bairro: db.bairro,
                cidade: db.cidade,
                estado: db.estado,
                rotulo: db.rotulo,
                osm_type: db.osm_type,
                codigo_pais: db.codigo_pais,
                string_endereco: db.string_endereco,
                geometry_name: db.geometry_name,
                bbox: db.bbox,
            };
        });
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
