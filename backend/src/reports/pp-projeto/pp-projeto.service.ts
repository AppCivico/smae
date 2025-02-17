import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AcompanhamentoService } from 'src/pp/acompanhamento/acompanhamento.service';
import { PlanoAcaoService } from 'src/pp/plano-de-acao/plano-de-acao.service';
import { ProjetoDetailDto } from 'src/pp/projeto/entities/projeto.entity';
import { RiscoService } from 'src/pp/risco/risco.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { ProjetoRiscoStatus } from '../../pp/risco/entities/risco.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportContext, ReportableService } from '../utils/utils.service';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import {
    PPProjetoRelatorioDto,
    RelProjetoAcompanhamentoDto,
    RelProjetoCronogramaDto,
    RelProjetoEncaminhamentoDto,
    RelProjetoOrigemDto,
    RelProjetoPlanoAcaoDto,
    RelProjetoRelatorioDto,
    RelProjetoRiscoDto,
} from './entities/previsao-custo.entity';
import { Stream2Buffer } from '../../common/helpers/Streaming';
import { StatusContrato, ContratoPrazoUnidade } from '@prisma/client';
import { RelProjetosAditivosDto, RelProjetosContratosDto } from '../pp-projetos/entities/projetos.entity';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class RetornoDbAditivos {
    aditivo_id: number;
    contrato_id: number;
    numero: number;
    tipo_aditivo_id: number;
    tipo_aditivo_nome: string;
    data: Date | null;
    data_termino_atual: Date | null;
    valor_com_reajuste: number | null;
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
    prazo: number | null;
    unidade_prazo: ContratoPrazoUnidade | null;
    data_inicio: Date | null;
    data_termino: Date | null;
    valor: number | null;
    valor_reajustado: number | null;
    observacoes: string | null;
    data_base: string | null;
    modalidade_contratacao_id: number | null;
    modalidade_contratacao_nome: string | null;
    orgao_id: number | null;
    orgao_sigla: string | null;
    orgao_descricao: string | null;
    valor_com_reajuste: number | null;
    data_termino_atualizada: Date | null;
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

@Injectable()
export class PPProjetoService implements ReportableService {
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
            id: projetoRow.id,
            arquivado: projetoRow.arquivado,
            origem_tipo: projetoRow.origem_tipo,
            meta_id: projetoRow.meta_id,
            iniciativa_id: projetoRow.iniciativa_id,
            atividade_id: projetoRow.atividade_id,
            origem_outro: projetoRow.origem_outro,
            portfolio_id: projetoRow.portfolio_id,
            meta_codigo: projetoRow.meta_codigo,
            nome: projetoRow.nome,
            status: projetoRow.status,
            resumo: projetoRow.resumo,
            codigo: projetoRow.codigo,
            objeto: projetoRow.objeto,
            objetivo: projetoRow.objetivo,
            data_aprovacao: projetoRow.data_aprovacao,
            data_revisao: projetoRow.data_revisao,
            versao: projetoRow.versao,
            publico_alvo: projetoRow.publico_alvo,
            previsao_inicio: projetoRow.previsao_inicio,
            previsao_custo: projetoRow.previsao_custo,
            previsao_duracao: projetoRow.previsao_duracao,
            previsao_termino: projetoRow.previsao_termino,
            realizado_inicio: projetoRow.realizado_inicio,
            realizado_termino: projetoRow.realizado_termino,
            realizado_custo: projetoRow.realizado_custo,
            nao_escopo: projetoRow.nao_escopo,
            principais_etapas: projetoRow.principais_etapas,
            responsavel_id: projetoRow.responsavel ? projetoRow.responsavel.id : null,
            responsavel_nome_exibicao: projetoRow.responsavel ? projetoRow.responsavel.nome_exibicao : null,
            eh_prioritario: projetoRow.eh_prioritario,
            secretario_executivo: projetoRow.secretario_executivo,
            secretario_responsavel: projetoRow.secretario_responsavel,
            coordenador_ue: projetoRow.coordenador_ue,
            atraso: projetoRow.atraso,
            em_atraso: projetoRow.em_atraso,
            tolerancia_atraso: projetoRow.tolerancia_atraso,
            projecao_termino: projetoRow.projecao_termino,
            realizado_duracao: projetoRow.realizado_duracao,
            percentual_concluido: projetoRow.percentual_concluido,
            portfolio_titulo: projetoRow.portfolio.titulo,
            portfolio_nivel_maximo_tarefa: projetoRow.portfolio.nivel_maximo_tarefa,
            orgao_gestor_id: projetoRow.orgao_gestor.id,
            orgao_gestor_sigla: projetoRow.orgao_gestor.sigla,
            orgao_gestor_descricao: projetoRow.orgao_gestor.descricao,
            orgao_responsavel_id: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.id : null,
            orgao_responsavel_sigla: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.sigla : null,
            orgao_responsavel_descricao: projetoRow.orgao_responsavel ? projetoRow.orgao_responsavel.descricao : null,
            meta: projetoRow.meta,
            responsaveis_no_orgao_gestor: projetoRow.responsaveis_no_orgao_gestor.length
                ? projetoRow.responsaveis_no_orgao_gestor.map((e) => e.nome_exibicao).join('|')
                : null,
            projeto_etapa: projetoRow.projeto_etapa,

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
            return {
                hirearquia: tarefasHierarquia[e.id],
                tarefa: e.tarefa,
                inicio_planejado: e.inicio_planejado,
                termino_planejado: e.termino_planejado,
                custo_estimado: e.custo_estimado,
                duracao_planejado: e.duracao_planejado,
                inicio_real: e.inicio_real,
                termino_real: e.termino_real,
                duracao_real: e.duracao_real,
                percentual_concluido: e.percentual_concluido,
                custo_real: e.custo_real,
            };
        });

        const riscoRows = await this.riscoService.findAll(dto.projeto_id, undefined);
        const riscosOut: RelProjetoRiscoDto[] = riscoRows.map((e) => {
            return {
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
                codigo_risco: e.projeto_risco.codigo,
                contramedida: e.contramedida,
                prazo_contramedida: e.prazo_contramedida,
                responsavel: e.responsavel,
                medidas_de_contingencia: e.medidas_de_contingencia,
            };
        });

        const acompanhamentoRows = await this.acompanhamentoService.findAll('PP', dto.projeto_id, undefined);
        const acompanhamentoOut: RelProjetoAcompanhamentoDto[] = acompanhamentoRows.map((a) => {
            return {
                id: a.id,
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
        await this.queryDataContratos(projetoRow.id, out_contratos);
        await this.queryDataAditivos(projetoRow.id, out_aditivos);
        await this.queryDataOrigens(projetoRow.id, out_origens);

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
        };
    }

    private async queryDataContratos(projetoId: number, out: RelProjetosContratosDto[]) {
        const sql = `SELECT
            contrato.id AS id,
            projeto.id AS obra_id,
            contrato.numero AS numero,
            contrato.contrato_exclusivo AS exclusivo,
            contrato.status AS status,
            contrato.objeto_resumo AS objeto,
            contrato.objeto_detalhado AS descricao_detalhada,
            contrato.contratante AS contratante,
            contrato.empresa_contratada AS empresa_contratada,
            contrato.prazo_numero AS prazo,
            contrato.prazo_unidade AS unidade_prazo,
            contrato.data_inicio AS data_inicio,
            contrato.data_termino AS data_termino,
            contrato.observacoes AS observacoes,
            contrato.data_base_mes::text || '/' ||  contrato.data_base_ano::text AS data_base,
            modalidade_contratacao.id AS modalidade_contratacao_id,
            modalidade_contratacao.nome AS modalidade_contratacao_nome,
            orgao.id AS orgao_id,
            orgao.sigla AS orgao_sigla,
            orgao.descricao AS orgao_descricao,
            contrato.valor AS valor,
            (
                SELECT max(valor)
                FROM contrato_aditivo
                JOIN tipo_aditivo ON tipo_aditivo.id = contrato_aditivo.tipo_aditivo_id
                WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL AND tipo_aditivo.habilita_valor = true GROUP BY contrato_aditivo.data ORDER BY contrato_aditivo.data DESC LIMIT 1
            ) AS valor_reajustado,
            (
                SELECT valor FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL ORDER BY contrato_aditivo.data DESC LIMIT 1
            ) AS valor_com_reajuste,
            (
                SELECT max(data_termino_atualizada) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
            ) AS data_termino_atualizada,
            (
                SELECT max(percentual_medido) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
            ) AS percentual_medido,
            (
                SELECT string_agg(contrato_sei.numero_sei::text, '|')
                FROM contrato_sei
                WHERE contrato_sei.contrato_id = contrato.id
            ) AS processos_sei,
            (
                SELECT string_agg(cod_sof::text, '|')
                FROM contrato_fonte_recurso
                WHERE contrato_id = contrato.id
            ) AS fontes_recurso
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
          LEFT JOIN orgao ON orgao.id = contrato.orgao_id AND orgao.removido_em IS NULL
          LEFT JOIN modalidade_contratacao ON contrato.modalidade_contratacao_id = modalidade_contratacao.id AND modalidade_contratacao.removido_em IS NULL
        WHERE projeto.id = $1
        `;

        const data: RetornoDbContratos[] = await this.prisma.$queryRawUnsafe(sql, projetoId);

        out.push(...this.convertRowsContratos(data));
    }

    private convertRowsContratos(input: RetornoDbContratos[]): RelProjetosContratosDto[] {
        return input.map((db) => {
            return {
                id: db.id,
                projeto_id: db.projeto_id,
                numero: db.numero,
                exclusivo: db.exclusivo,
                processos_SEI: db.processos_sei,
                status: db.status,
                modalidade_licitacao: db.modalidade_contratacao_id
                    ? { id: db.modalidade_contratacao_id!, nome: db.modalidade_contratacao_nome!.toString() }
                    : null,
                fontes_recurso: db.fontes_recurso,
                area_gestora: db.orgao_id
                    ? { id: db.orgao_id, sigla: db.orgao_sigla!.toString(), descricao: db.orgao_descricao!.toString() }
                    : null,
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
                valor_reajustado: db.valor_reajustado,
                percentual_medido: db.percentual_medido,
                observacoes: db.observacoes,
            };
        });
    }

    private async queryDataAditivos(projetoId: number, out: RelProjetosAditivosDto[]) {
        const sql = `SELECT
            contrato_aditivo.id AS aditivo_id,
            contrato.id AS contrato_id,
            contrato_aditivo.numero AS numero,
            tipo_aditivo.id AS tipo_aditivo_id,
            tipo_aditivo.nome AS tipo_aditivo_nome,
            contrato_aditivo.data,
            contrato_aditivo.data_termino_atualizada AS data_termino_atual,
            contrato_aditivo.valor AS valor_com_reajuste,
            contrato_aditivo.percentual_medido
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
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
                id: db.aditivo_id,
                contrato_id: db.contrato_id,
                tipo: { id: db.tipo_aditivo_id, nome: db.tipo_aditivo_nome },
                data: db.data ?? null,
                valor_com_reajuste: db.valor_com_reajuste ?? null,
                percentual_medido: db.percentual_medido ?? null,
                data_termino_atual: db.data_termino_atual ?? null,
            };
        });
    }

    private async queryDataOrigens(projetoId: number, out: RelProjetoOrigemDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            meta.pdm_id,
            pdm.nome AS pdm_nome,
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

    async toFileOutput(
        params: CreateRelProjetoDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        await ctx.progress(1);
        // relatório de apenas 1 item, por enquanto não há problemas de performance / memória
        const dados = await this.asJSON(params, user);

        await ctx.progress(40);

        const out: FileOutput[] = [];

        const json2csvParser = new Parser({
            ...DefaultCsvOptions,
            transforms: defaultTransform,
        });

        if (dados.detail.status)
            (dados.detail as any)['status-traduzido'] = ProjetoStatusParaExibicao[dados.detail.status];

        const linhas = json2csvParser.parse([dados.detail]);

        out.push({
            name: 'detalhes-do-projeto.csv',
            buffer: Buffer.from(linhas, 'utf8'),
        });
        await ctx.progress(50);

        if (dados.cronograma.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.cronograma);
            out.push({
                name: 'cronograma.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(55);

        if (dados.acompanhamentos.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.acompanhamentos);
            out.push({
                name: 'acompanhamentos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(60);

        if (dados.encaminhamentos.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.encaminhamentos);
            out.push({
                name: 'encaminhamentos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(65);

        if (dados.planos_acao.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    { value: 'codigo_risco', label: 'codigo_risco' },
                    { value: 'contramedida', label: 'contramedida' },
                    { value: 'prazo_contramedida', label: 'prazo_contramedida' },
                    { value: 'responsavel', label: 'responsavel' },
                    { value: 'medidas_de_contingencia', label: 'medidas_de_contingencia' },
                ],
            });
            const linhas = json2csvParser.parse(dados.planos_acao);
            out.push({
                name: 'planos-acao.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(70);

        if (dados.riscos.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.riscos);
            out.push({
                name: 'riscos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(80);

        const uploads = await this.prisma.projetoDocumento.findMany({
            where: {
                removido_em: null,
                projeto_id: dados.detail.id,
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

        if (uploads.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
                fields: [
                    { value: 'arquivo.nome_original', label: 'Nome Original' },
                    {
                        label: 'Criado em',
                        value: (r: (typeof uploads)[0]) => {
                            return r.criado_em.toISOString();
                        },
                    },
                    { value: 'criador.id', label: 'Criador (ID)' },
                    { value: 'criador.nome_exibicao', label: 'Criador (Nome de Exibição)' },
                    { value: 'arquivo.caminho', label: 'Caminho no Object Storage' },
                    { value: 'descricao', label: 'descricao do Documento' },
                    { value: 'arquivo.id', label: 'ID do arquivo' },
                ],
            });

            const linhas = json2csvParser.parse(uploads);
            out.push({
                name: 'arquivos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
        await ctx.progress(90);

        if (dados.detail && dados.detail.id) {
            const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
                where: {
                    projeto_id: dados.detail.id,
                    removido_em: null,
                },
                select: { id: true },
            });

            if (tarefaCronoId) {
                const eap = await this.tarefaService.getEap(tarefaCronoId.id, { projeto_id: dados.detail.id }, 'svg');

                out.push({
                    name: 'eap.svg',
                    buffer: await Stream2Buffer(eap),
                });
            }
        }
        await ctx.progress(95);

        if (dados.contratos.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.contratos);
            out.push({
                name: 'contratos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.aditivos.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.aditivos);
            out.push({
                name: 'aditivos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.origens.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.origens);
            out.push({
                name: 'origens.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }
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
}
