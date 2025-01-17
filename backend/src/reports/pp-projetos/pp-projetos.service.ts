import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { ContratoPrazoUnidade, ProjetoStatus, StatusContrato, StatusRisco } from '@prisma/client';
import { DateTime } from 'luxon';
import { RiscoCalc } from 'src/common/RiscoCalc';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { ProjetoRiscoStatus } from '../../pp/risco/entities/risco.entity';
import { DefaultCsvOptions, FileOutput, ReportContext, ReportableService } from '../utils/utils.service';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import {
    PPProjetosRelatorioDto,
    RelProjetosAcompanhamentosDto,
    RelProjetosAditivosDto,
    RelProjetosContratosDto,
    RelProjetosCronogramaDto,
    RelProjetosDto,
    RelProjetosGeolocDto,
    RelProjetosLicoesAprendidasDto,
    RelProjetosOrigemDto,
    RelProjetosPlanoAcaoDto,
    RelProjetosPlanoAcaoMonitoramentosDto,
    RelProjetosRiscosDto,
} from './entities/projetos.entity';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');

type WhereCond = {
    whereString: string;
    queryParams: any[];
};

const defaultTransform = [flatten({ paths: [] })];

class RetornoDbProjeto {
    id: number;
    portfolio_id: number;
    portfolio_titulo: string;
    meta_id?: number;
    iniciativa_id?: number;
    atividade_id?: number;
    nome: string;
    codigo?: string;
    objeto: string;
    objetivo: string;
    publico_alvo: string;
    previsao_inicio?: Date;
    previsao_termino?: Date;
    previsao_duracao?: number;
    previsao_custo?: number;
    escopo?: string;
    nao_escopo?: string;
    secretario_responsavel?: string;
    secretario_executivo?: string;
    coordenador_ue?: string;
    data_aprovacao?: Date;
    data_revisao?: Date;
    versao?: string;
    status: ProjetoStatus;

    orgao_responsavel_id: number;
    orgao_responsavel_sigla: string;
    orgao_responsavel_descricao: string;
    orgao_gestor_id: number;
    orgao_gestor_sigla: string;
    orgao_gestor_descricao: string;
    gestores: string;
    responsavel_id: number;
    responsavel_nome_exibicao: string;

    fonte_recurso_id: number;
    fonte_recurso_nome: string;
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    fonte_recurso_valor_pct: number;
    fonte_recurso_valor_nominal: number;

    premisa_id: number;
    premissa: string;

    restricao_id: number;
    restricao: string;

    orgao_id: number;
    orgao_sigla: string;
    orgao_descricao: string;

    projeto_etapa: string | null;
}

class RetornoDbCronograma {
    projeto_id: number;
    projeto_codigo: string;
    id: number;
    hierarquia?: string;
    numero: number;
    nivel: number;
    tarefa: string;
    inicio_planejado?: Date;
    termino_planejado?: Date;
    custo_estimado?: number;
    inicio_real?: Date;
    termino_real?: Date;
    duracao_real?: number;
    percentual_concluido?: number;
    custo_real?: number;
    dependencias?: string;

    responsavel_id: number;
    responsavel_nome_exibicao: string;

    atraso?: number;
}

class RetornoDbRiscos {
    projeto_id: number;
    projeto_codigo: string;
    codigo: string;
    titulo: string;
    data_registro: string;
    status_risco: StatusRisco;
    descricao?: string;
    causa?: string;
    consequencia?: string;
    probabilidade?: number;
    impacto?: number;
    nivel?: number;
    grau?: number;
    resposta?: string;
    tarefas_afetadas?: string;
}

class RetornoDbPlanosAcao {
    projeto_id: number;
    projeto_codigo: string;
    plano_acao_id: number;
    risco_codigo: string;
    contramedida: string;
    medidas_de_contingencia: string;
    prazo_contramedida?: Date;
    custo?: number;
    custo_percentual?: number;
    responsavel?: string;
    data_termino?: Date;
}

class RetornoDbPlanosAcaoMonitoramentos {
    projeto_id: number;
    projeto_codigo: string;
    risco_codigo: string;
    plano_acao_id: number;
    data_afericao: Date;
    descricao: string;
}

class RetornoDbLicoesAprendidas {
    projeto_id: number;
    projeto_codigo: string;
    sequencial: number;
    data_registro: Date;
    responsavel: string;
    descricao: string;
    observacao?: string;
    contexto?: string;
    resultado?: string;
}

class RetornoDbAcompanhamentos {
    projeto_id: number;
    projeto_codigo: string;
    data_registro: Date;
    participantes: string;
    cronograma_paralizado: boolean;
    prazo_encaminhamento: Date | null;
    pauta: string | null;
    prazo_realizado: Date | null;
    detalhamento: string | null;
    encaminhamento: string | null;
    responsavel: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    riscos: string | null;
}

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

class RetornoDbLoc {
    projeto_id: number;
    endereco: string;
}

@Injectable()
export class PPProjetosService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefasService: TarefaService,
        @Inject(forwardRef(() => TarefaUtilsService)) private readonly tarefasUtilsService: TarefaUtilsService
    ) {}

    async asJSON(dto: CreateRelProjetosDto): Promise<PPProjetosRelatorioDto> {
        const out_projetos: RelProjetosDto[] = [];
        const out_cronogramas: RelProjetosCronogramaDto[] = [];
        const out_riscos: RelProjetosRiscosDto[] = [];
        const out_planos_acao: RelProjetosPlanoAcaoDto[] = [];
        const out_monitoramento_planos_acao: RelProjetosPlanoAcaoMonitoramentosDto[] = [];
        const out_licoes_aprendidas: RelProjetosLicoesAprendidasDto[] = [];
        const out_acompanhamentos: RelProjetosAcompanhamentosDto[] = [];
        const out_contratos: RelProjetosContratosDto[] = [];
        const out_aditivos: RelProjetosAditivosDto[] = [];
        const out_origens: RelProjetosOrigemDto[] = [];
        const out_enderecos: RelProjetosGeolocDto[] = [];

        const whereCond = await this.buildFilteredWhereStr(dto);

        await this.queryDataProjetos(whereCond, out_projetos);
        await this.queryDataCronograma(whereCond, out_cronogramas);
        await this.queryDataRiscos(whereCond, out_riscos);
        await this.queryDataPlanosAcao(whereCond, out_planos_acao);
        await this.queryDataPlanosAcaoMonitoramento(whereCond, out_monitoramento_planos_acao);
        await this.queryDataLicoesAprendidas(whereCond, out_licoes_aprendidas);
        await this.queryDataAcompanhamentos(whereCond, out_acompanhamentos);
        await this.queryDataContratos(whereCond, out_contratos);
        await this.queryDataAditivos(whereCond, out_aditivos);
        await this.queryDataOrigens(whereCond, out_origens);
        await this.queryDataProjetosGeoloc(whereCond, out_enderecos);

        return {
            linhas: out_projetos,
            cronograma: out_cronogramas,
            riscos: out_riscos,
            planos_de_acao: out_planos_acao,
            monitoramento_planos_de_acao: out_monitoramento_planos_acao,
            licoes_aprendidas: out_licoes_aprendidas,
            acompanhamentos: out_acompanhamentos,
            contratos: out_contratos,
            aditivos: out_aditivos,
            origens: out_origens,
            enderecos: out_enderecos,
        };
    }

    async toFileOutput(params: CreateRelProjetosDto, ctx: ReportContext): Promise<FileOutput[]> {
        const dados = await this.asJSON(params);
        await ctx.progress(50);

        const out: FileOutput[] = [];

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });

            for (const r of dados.linhas) {
                if (r.status) (r as any)['status-traduzido'] = ProjetoStatusParaExibicao[r.status];
            }
            const linhas = json2csvParser.parse(dados.linhas);
            out.push({
                name: 'projetos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

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

        if (dados.planos_de_acao.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.planos_de_acao);
            out.push({
                name: 'planos_de_acao.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.monitoramento_planos_de_acao.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.monitoramento_planos_de_acao);
            out.push({
                name: 'monitoramento_planos_de_acao.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.licoes_aprendidas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.licoes_aprendidas);
            out.push({
                name: 'licoes_aprendidas.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

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

    private async buildFilteredWhereStr(filters: CreateRelProjetosDto): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        if (filters.portfolio_id) {
            whereConditions.push(`projeto.portfolio_id = $${paramIndex}`);
            queryParams.push(filters.portfolio_id);
            paramIndex++;
        }

        if (filters.orgao_responsavel_id) {
            whereConditions.push(`projeto.orgao_responsavel_id = $${paramIndex}`);
            queryParams.push(filters.orgao_responsavel_id);
            paramIndex++;
        }

        if (filters.codigo) {
            whereConditions.push(`projeto.codigo = $${paramIndex}`);
            queryParams.push(filters.codigo);
            paramIndex++;
        }

        if (filters.status) {
            whereConditions.push(`projeto.status::text = $${paramIndex}`);
            queryParams.push(filters.status);
            paramIndex++;
        }

        whereConditions.push(`projeto.removido_em IS NULL`);
        whereConditions.push(`portfolio.modelo_clonagem = false`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        return { whereString, queryParams };
    }

    private async queryDataProjetos(whereCond: WhereCond, out: RelProjetosDto[]) {
        const anoCorrente = DateTime.local({ locale: SYSTEM_TIMEZONE }).year;

        let portfolioParamIdx;
        if (whereCond.whereString.match(/portfolio_id = \$([0-9]+)/)) {
            const match = whereCond.whereString.match(/portfolio_id = \$([0-9]+)/);
            portfolioParamIdx = match ? parseInt(match[1], 10) : null;

            if (!portfolioParamIdx) throw new Error('Erro interno ao extrair relatório');
        }

        const sql = `SELECT
            projeto.id,
            projeto.portfolio_id,
            portfolio.titulo as portfolio_titulo,
            projeto.meta_id,
            projeto.iniciativa_id,
            projeto.atividade_id,
            projeto.nome,
            projeto.codigo,
            projeto.objeto,
            projeto.objetivo,
            projeto.publico_alvo,
            coalesce(tc.previsao_inicio, projeto.previsao_inicio) AS previsao_inicio,
            coalesce(tc.previsao_termino, projeto.previsao_termino) AS previsao_termino,
            coalesce(tc.previsao_duracao, projeto.previsao_duracao) AS previsao_duracao,
            coalesce(tc.previsao_custo, projeto.previsao_custo) AS previsao_custo,
            projeto.escopo,
            projeto.nao_escopo,
            projeto.secretario_responsavel,
            projeto.secretario_executivo,
            projeto.coordenador_ue,
            projeto.data_aprovacao,
            projeto.data_revisao,
            projeto.versao,
            projeto.status,
            orgao_responsavel.id AS orgao_responsavel_id,
            orgao_responsavel.sigla AS orgao_responsavel_sigla,
            orgao_responsavel.descricao AS orgao_responsavel_descricao,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            orgao_gestor.id as orgao_gestor_id,
            orgao_gestor.sigla as orgao_gestor_sigla,
            orgao_gestor.descricao as orgao_gestor_descricao,
            (
                SELECT
                    string_agg(nome_exibicao, '/')
                FROM pessoa
                WHERE id = ANY(projeto.responsaveis_no_orgao_gestor)
            ) as gestores,
            r.id AS fonte_recurso_id,
            sof.descricao AS fonte_recurso_nome,
            r.fonte_recurso_cod_sof AS fonte_recurso_cod_sof,
            r.fonte_recurso_ano AS fonte_recurso_ano,
            r.valor_percentual AS fonte_recurso_valor_pct,
            r.valor_nominal AS fonte_recurso_valor_nominal,
            pp.id AS premisa_id,
            pp.premissa,
            pr.id AS restricao_id,
            pr.restricao,
            o.id AS orgao_id,
            o.sigla AS orgao_sigla,
            o.descricao AS orgao_descricao,
            pe.descricao AS projeto_etapa
        FROM projeto
          LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
          LEFT JOIN portfolio ON portfolio.id = projeto.portfolio_id
          LEFT JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          LEFT JOIN sof_entidades_linhas sof ON sof.codigo = r.fonte_recurso_cod_sof
            AND sof.ano = ( case when r.fonte_recurso_ano > ${anoCorrente}::int then ${anoCorrente}::int else r.fonte_recurso_ano end )
            AND sof.col = 'fonte_recursos'
          LEFT JOIN projeto_premissa pp ON pp.projeto_id = projeto.id
          LEFT JOIN projeto_restricao pr ON pr.projeto_id = projeto.id
          LEFT JOIN projeto_orgao_participante po ON po.projeto_id = projeto.id
          LEFT JOIN orgao o ON po.orgao_id = o.id
          LEFT JOIN orgao orgao_responsavel ON orgao_responsavel.id = projeto.orgao_responsavel_id
          LEFT JOIN orgao orgao_gestor ON orgao_gestor.id = projeto.orgao_gestor_id
          LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
          LEFT JOIN projeto_etapa pe ON pe.id = projeto.projeto_etapa_id
        ${whereCond.whereString}

        UNION

        SELECT
            projeto.id,
            portfolio.id as portfolio_id,
            portfolio.titulo as portfolio_titulo,
            projeto.meta_id,
            projeto.iniciativa_id,
            projeto.atividade_id,
            projeto.nome,
            projeto.codigo,
            projeto.objeto,
            projeto.objetivo,
            projeto.publico_alvo,
            coalesce(tc.previsao_inicio, projeto.previsao_inicio) AS previsao_inicio,
            coalesce(tc.previsao_termino, projeto.previsao_termino) AS previsao_termino,
            coalesce(tc.previsao_duracao, projeto.previsao_duracao) AS previsao_duracao,
            coalesce(tc.previsao_custo, projeto.previsao_custo) AS previsao_custo,
            projeto.escopo,
            projeto.nao_escopo,
            projeto.secretario_responsavel,
            projeto.secretario_executivo,
            projeto.coordenador_ue,
            projeto.data_aprovacao,
            projeto.data_revisao,
            projeto.versao,
            projeto.status,
            orgao_responsavel.id AS orgao_responsavel_id,
            orgao_responsavel.sigla AS orgao_responsavel_sigla,
            orgao_responsavel.descricao AS orgao_responsavel_descricao,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            orgao_gestor.id as orgao_gestor_id,
            orgao_gestor.sigla as orgao_gestor_sigla,
            orgao_gestor.descricao as orgao_gestor_descricao,
            (
                SELECT
                    string_agg(nome_exibicao, '/')
                FROM pessoa
                WHERE id = ANY(projeto.responsaveis_no_orgao_gestor)
            ) as gestores,
            r.id AS fonte_recurso_id,
            sof.descricao AS fonte_recurso_nome,
            r.fonte_recurso_cod_sof AS fonte_recurso_cod_sof,
            r.fonte_recurso_ano AS fonte_recurso_ano,
            r.valor_percentual AS fonte_recurso_valor_pct,
            r.valor_nominal AS fonte_recurso_valor_nominal,
            pp.id AS premisa_id,
            pp.premissa,
            pr.id AS restricao_id,
            pr.restricao,
            o.id AS orgao_id,
            o.sigla AS orgao_sigla,
            o.descricao AS orgao_descricao,
            pe.descricao AS projeto_etapa
        FROM projeto
        LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
          JOIN portfolio_projeto_compartilhado ppc ON ppc.projeto_id = projeto.id
          LEFT JOIN portfolio ON portfolio.id = ppc.portfolio_id
          LEFT JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          LEFT JOIN sof_entidades_linhas sof ON sof.codigo = r.fonte_recurso_cod_sof
            AND sof.ano = ( case when r.fonte_recurso_ano > ${anoCorrente}::int then ${anoCorrente}::int else r.fonte_recurso_ano end )
            AND sof.col = 'fonte_recursos'
          LEFT JOIN projeto_premissa pp ON pp.projeto_id = projeto.id
          LEFT JOIN projeto_restricao pr ON pr.projeto_id = projeto.id
          LEFT JOIN projeto_orgao_participante po ON po.projeto_id = projeto.id
          LEFT JOIN orgao o ON po.orgao_id = o.id
          LEFT JOIN orgao orgao_responsavel ON orgao_responsavel.id = projeto.orgao_responsavel_id
          LEFT JOIN orgao orgao_gestor ON orgao_gestor.id = projeto.orgao_gestor_id
          LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
          LEFT JOIN projeto_etapa pe ON pe.id = projeto.projeto_etapa_id
          WHERE ppc.removido_em IS NULL AND projeto.removido_em IS NULL AND ppc.portfolio_id = $${portfolioParamIdx}
        `;

        const data: RetornoDbProjeto[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        this.convertRowsProjetosInto(data, out);
    }

    private convertRowsProjetosInto(input: RetornoDbProjeto[], out: RelProjetosDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                portfolio_id: db.portfolio_id,
                portfolio_titulo: db.portfolio_titulo,
                meta_id: db.meta_id ? db.meta_id : null,
                iniciativa_id: db.iniciativa_id ? db.iniciativa_id : null,
                atividade_id: db.atividade_id ? db.atividade_id : null,
                nome: db.nome,
                codigo: db.codigo ? db.codigo : null,
                objeto: db.objeto,
                objetivo: db.objetivo,
                publico_alvo: db.publico_alvo,
                previsao_inicio: db.previsao_inicio ? Date2YMD.toString(db.previsao_inicio) : null,
                previsao_termino: db.previsao_termino ? Date2YMD.toString(db.previsao_termino) : null,
                previsao_duracao: db.previsao_duracao ? db.previsao_duracao : null,
                previsao_custo: db.previsao_custo ? db.previsao_custo : null,
                escopo: db.escopo ? db.escopo : null,
                nao_escopo: db.nao_escopo ? db.nao_escopo : null,
                secretario_responsavel: db.secretario_responsavel,
                secretario_executivo: db.secretario_executivo,
                coordenador_ue: db.coordenador_ue,
                data_aprovacao: db.data_aprovacao,
                data_revisao: db.data_revisao,
                versao: db.versao ? db.versao : null,
                status: db.status,
                projeto_etapa: db.projeto_etapa ? db.projeto_etapa : null,
                orgao_participante: {
                    id: db.orgao_id,
                    sigla: db.orgao_sigla,
                    descricao: db.orgao_descricao,
                },

                orgao_responsavel: db.orgao_responsavel_id
                    ? {
                          id: db.orgao_responsavel_id,
                          sigla: db.orgao_responsavel_sigla,
                          descricao: db.orgao_responsavel_descricao,
                      }
                    : null,

                orgao_gestor: {
                    id: db.orgao_gestor_id,
                    sigla: db.orgao_gestor_sigla,
                    descricao: db.orgao_gestor_descricao,
                },
                gestores: db.gestores,

                responsavel: db.responsavel_id
                    ? {
                          id: db.responsavel_id,
                          nome_exibicao: db.responsavel_nome_exibicao,
                      }
                    : null,

                premissa: db.premisa_id
                    ? {
                          id: db.premisa_id,
                          premissa: db.premissa,
                      }
                    : null,

                restricao: db.restricao_id
                    ? {
                          id: db.restricao_id,
                          restricao: db.restricao,
                      }
                    : null,

                fonte_recurso: db.fonte_recurso_id
                    ? {
                          id: db.fonte_recurso_id,
                          nome: db.fonte_recurso_nome,
                          fonte_recurso_cod_sof: db.fonte_recurso_cod_sof,
                          fonte_recurso_ano: db.fonte_recurso_ano,
                          valor_percentual: db.fonte_recurso_valor_pct,
                          valor_nominal: db.fonte_recurso_valor_nominal,
                      }
                    : null,
            });
        }
    }

    private async queryDataCronograma(whereCond: WhereCond, out: RelProjetosCronogramaDto[]) {
        const sql = `SELECT
            tc.projeto_id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            tc.atraso,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            t.id,
            t.numero,
            t.nivel,
            '' AS hierarquia,
            t.tarefa,
            t.inicio_planejado,
            t.termino_planejado,
            t.custo_estimado,
            t.inicio_real,
            t.termino_real,
            t.duracao_real,
            t.percentual_concluido,
            t.custo_real,
            (
                SELECT
                  string_agg(json_build_object('id', td.dependencia_tarefa_id, 'tipo', td.tipo, 'latencia', td.latencia) #>> '{}', '/')
                FROM tarefa_dependente td
                JOIN tarefa t2 ON t2.id = td.dependencia_tarefa_id
                WHERE td.tarefa_id = t.id
            ) as dependencias
            FROM projeto
            LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
            LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
            JOIN tarefa t ON t.tarefa_cronograma_id = tc.id
            JOIN portfolio ON projeto.portfolio_id = portfolio.id
            ${whereCond.whereString}
        `;

        const data: RetornoDbCronograma[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        await this.putRowsCronogramaInto(data, out);
    }

    private async putRowsCronogramaInto(input: RetornoDbCronograma[], out: RelProjetosCronogramaDto[]) {
        for (const db of input) {
            interface dependenciaRow {
                id: number;
                tipo: string;
                latencia: number;
            }

            await this.projetoService.findOne('PP', db.projeto_id, undefined, 'ReadOnly');

            const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
                where: {
                    projeto_id: db.projeto_id,
                    removido_em: null,
                },
                select: { id: true },
            });

            let tarefasHierarquia: Record<string, string> = {};
            if (tarefaCronoId) tarefasHierarquia = await this.tarefasService.tarefasHierarquia(tarefaCronoId.id);

            out.push({
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                tarefa_id: db.id,
                hirearquia: tarefasHierarquia[db.id],
                numero: db.numero,
                nivel: db.nivel,
                tarefa: db.tarefa,
                inicio_planejado: db.inicio_planejado ? Date2YMD.toString(db.inicio_planejado) : null,
                termino_planejado: db.termino_planejado ? Date2YMD.toString(db.termino_planejado) : null,
                custo_estimado: db.custo_estimado ? db.custo_estimado : null,
                inicio_real: db.inicio_real ? Date2YMD.toString(db.inicio_real) : null,
                termino_real: db.termino_real ? Date2YMD.toString(db.termino_real) : null,
                duracao_real: db.duracao_real ? db.duracao_real : null,
                percentual_concluido: db.percentual_concluido ? db.percentual_concluido : null,
                custo_real: db.custo_real ? db.custo_real : null,
                dependencias: db.dependencias
                    ? db.dependencias
                          .split('/')
                          .map((e) => {
                              const row: dependenciaRow = JSON.parse(e);

                              const hierarquia = tarefasHierarquia[row.id];
                              const tipo = this.tarefasUtilsService.tarefaDependenteTipoSigla(row.tipo);
                              const latencia_str = row.latencia == 0 ? '' : row.latencia;

                              return `${hierarquia} ${tipo} ${latencia_str}`;
                          })
                          .join('/')
                    : null,
                atraso: db.atraso ? db.atraso : null,
                responsavel: db.responsavel_id
                    ? {
                          id: db.responsavel_id,
                          nome_exibicao: db.responsavel_nome_exibicao,
                      }
                    : null,
            });
        }
    }

    private async queryDataRiscos(whereCond: WhereCond, out: RelProjetosRiscosDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo,
            projeto_risco.titulo,
            projeto_risco.registrado_em AS data_registro,
            projeto_risco.status_risco,
            projeto_risco.descricao,
            projeto_risco.causa,
            projeto_risco.consequencia,
            projeto_risco.probabilidade,
            projeto_risco.impacto,
            projeto_risco.nivel,
            projeto_risco.grau,
            projeto_risco.resposta,
            (
                SELECT string_agg(t.tarefa, '|')
                FROM risco_tarefa rt
                JOIN tarefa t ON rt.tarefa_id = t.id
                WHERE rt.projeto_risco_id = projeto_risco.id
            ) as tarefas_afetadas
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id
          JOIN portfolio ON projeto.portfolio_id = portfolio_id
        ${whereCond.whereString}
        `;

        const data: RetornoDbRiscos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsRiscos(data));
    }

    private convertRowsRiscos(input: RetornoDbRiscos[]): RelProjetosRiscosDto[] {
        return input.map((db) => {
            let riscoCalc;
            if (db.impacto && db.probabilidade) riscoCalc = RiscoCalc.getResult(db.impacto, db.probabilidade);

            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                codigo: db.codigo,
                titulo: db.titulo,
                data_registro: db.data_registro,
                status_risco: ProjetoRiscoStatus[db.status_risco] || db.status_risco,
                descricao: db.descricao ? db.descricao : null,
                causa: db.causa ? db.causa : null,
                consequencia: db.consequencia ? db.consequencia : null,
                probabilidade: db.probabilidade ? db.probabilidade : null,
                probabilidade_descricao: riscoCalc ? riscoCalc.probabilidade_descricao : null,
                impacto: db.impacto ? db.impacto : null,
                impacto_descricao: riscoCalc ? riscoCalc.impacto_descricao : null,
                nivel: db.nivel ? db.nivel : null,
                grau: db.grau ? db.grau : null,
                grau_descricao: riscoCalc ? riscoCalc.grau_descricao : null,
                resposta: db.resposta ? db.resposta : null,
                tarefas_afetadas: db.tarefas_afetadas ? db.tarefas_afetadas : null,
            };
        });
    }

    private async queryDataPlanosAcao(whereCond: WhereCond, out: RelProjetosPlanoAcaoDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo AS risco_codigo,
            plano_acao.id as plano_acao_id,
            plano_acao.contramedida,
            plano_acao.medidas_de_contingencia,
            plano_acao.prazo_contramedida,
            plano_acao.custo,
            plano_acao.custo_percentual,
            plano_acao.responsavel,
            plano_acao.data_termino
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id
          JOIN plano_acao ON plano_acao.projeto_risco_id = projeto_risco.id
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
        ${whereCond.whereString}
        `;

        const data: RetornoDbPlanosAcao[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsPlanosAcao(data));
    }

    private convertRowsPlanosAcao(input: RetornoDbPlanosAcao[]): RelProjetosPlanoAcaoDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                plano_acao_id: db.plano_acao_id,
                risco_codigo: db.risco_codigo,
                contramedida: db.contramedida,
                medidas_de_contingencia: db.medidas_de_contingencia,
                prazo_contramedida: db.prazo_contramedida ? Date2YMD.toString(db.prazo_contramedida) : null,
                custo: db.custo ? db.custo : null,
                custo_percentual: db.custo_percentual ? db.custo_percentual : null,
                responsavel: db.responsavel ? db.responsavel : null,
                data_termino: db.data_termino ? Date2YMD.toString(db.data_termino) : null,
            };
        });
    }

    private async queryDataPlanosAcaoMonitoramento(whereCond: WhereCond, out: RelProjetosPlanoAcaoMonitoramentosDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo AS risco_codigo,
            plano_acao.id AS plano_acao_id,
            plano_acao_monitoramento.data_afericao,
            plano_acao_monitoramento.descricao
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id
          JOIN plano_acao ON plano_acao.projeto_risco_id = projeto_risco.id
          JOIN plano_acao_monitoramento ON plano_acao_monitoramento.plano_acao_id = plano_acao.id
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
        ${whereCond.whereString}
        `;

        const data: RetornoDbPlanosAcaoMonitoramentos[] = await this.prisma.$queryRawUnsafe(
            sql,
            ...whereCond.queryParams
        );

        out.push(...this.convertRowsPlanosAcaoMonitoramento(data));
    }

    private convertRowsPlanosAcaoMonitoramento(
        input: RetornoDbPlanosAcaoMonitoramentos[]
    ): RelProjetosPlanoAcaoMonitoramentosDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                risco_codigo: db.risco_codigo,
                plano_acao_id: db.plano_acao_id,
                data_afericao: Date2YMD.toString(db.data_afericao),
                descricao: db.descricao,
            };
        });
    }

    private async queryDataLicoesAprendidas(whereCond: WhereCond, out: RelProjetosLicoesAprendidasDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            projeto_licao_aprendida.sequencial,
            projeto_licao_aprendida.data_registro,
            projeto_licao_aprendida.responsavel,
            projeto_licao_aprendida.descricao,
            projeto_licao_aprendida.observacao,
            projeto_licao_aprendida.contexto,
            projeto_licao_aprendida.resultado
        FROM projeto
          JOIN projeto_licao_aprendida ON projeto_licao_aprendida.projeto_id = projeto.id
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
        ${whereCond.whereString}
        `;

        const data: RetornoDbLicoesAprendidas[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsLicoesAprendidas(data));
    }

    private convertRowsLicoesAprendidas(input: RetornoDbLicoesAprendidas[]): RelProjetosLicoesAprendidasDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                sequencial: db.sequencial,
                data_registro: Date2YMD.toString(db.data_registro),
                responsavel: db.responsavel,
                descricao: db.descricao,
                observacao: db.observacao ? db.observacao : null,
                contexto: db.contexto ? db.contexto : null,
                resultado: db.resultado ? db.resultado : null,
            };
        });
    }

    private async queryDataAcompanhamentos(whereCond: WhereCond, out: RelProjetosAcompanhamentosDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto.codigo AS projeto_codigo,
            projeto_acompanhamento.data_registro,
            projeto_acompanhamento.participantes,
            projeto_acompanhamento.cronograma_paralisado,
            projeto_acompanhamento_item.prazo_encaminhamento,
            projeto_acompanhamento.pauta,
            projeto_acompanhamento_item.prazo_realizado,
            projeto_acompanhamento.detalhamento,
            projeto_acompanhamento_item.encaminhamento,
            projeto_acompanhamento_item.responsavel,
            projeto_acompanhamento.observacao,
            projeto_acompanhamento.detalhamento_status,
            projeto_acompanhamento.pontos_atencao,
            (
                SELECT string_agg(r.codigo::text, '|')
                FROM projeto_acompanhamento_risco ar
                JOIN projeto_risco r ON ar.projeto_risco_id = r.id
                WHERE ar.projeto_acompanhamento_id = projeto_acompanhamento.id
            ) AS riscos
        FROM projeto
          JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id
          JOIN projeto_acompanhamento_item ON projeto_acompanhamento_item.projeto_acompanhamento_id = projeto_acompanhamento.id
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
        ${whereCond.whereString}
        `;

        const data: RetornoDbAcompanhamentos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsAcompanhamentos(data));
    }

    private convertRowsAcompanhamentos(input: RetornoDbAcompanhamentos[]): RelProjetosAcompanhamentosDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                data_registro: Date2YMD.toString(db.data_registro),
                participantes: db.participantes,
                cronograma_paralizado: db.cronograma_paralizado,
                pauta: db.pauta,
                prazo_encaminhamento: db.prazo_encaminhamento ? Date2YMD.toString(db.prazo_encaminhamento) : null,
                prazo_realizado: db.prazo_realizado ? Date2YMD.toString(db.prazo_realizado) : null,
                detalhamento: db.detalhamento ? db.detalhamento : null,
                encaminhamento: db.encaminhamento ? db.encaminhamento : null,
                responsavel: db.responsavel ? db.responsavel : null,
                observacao: db.observacao ? db.observacao : null,
                detalhamento_status: db.detalhamento_status ? db.detalhamento_status : null,
                pontos_atencao: db.pontos_atencao ? db.pontos_atencao : null,
                riscos: db.riscos ? db.riscos : null,
            };
        });
    }

    private async queryDataContratos(whereCond: WhereCond, out: RelProjetosContratosDto[]) {
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
        ${whereCond.whereString}
        `;

        const data: RetornoDbContratos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

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

    private async queryDataAditivos(whereCond: WhereCond, out: RelProjetosAditivosDto[]) {
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
        ${whereCond.whereString}
        `;

        const data: RetornoDbAditivos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

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

    private async queryDataOrigens(whereCond: WhereCond, out: RelProjetosOrigemDto[]) {
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
        ${whereCond.whereString}
        `;

        const data: RetornoDbOrigens[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsOrigens(data));
    }

    private convertRowsOrigens(input: RetornoDbOrigens[]): RelProjetosOrigemDto[] {
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

    private async queryDataProjetosGeoloc(whereCond: WhereCond, out: RelProjetosGeolocDto[]) {
        const sql = `
            SELECT
                projeto.id AS projeto_id,
                geo.endereco_exibicao AS endereco
            FROM projeto
            LEFT JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
            LEFT JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
            ${whereCond.whereString}
        `;

        const data: RetornoDbLoc[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsLoc(data));
    }

    private convertRowsLoc(input: RetornoDbLoc[]): RelProjetosGeolocDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                endereco: db.endereco,
            };
        });
    }
}
