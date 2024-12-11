import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import {
    CategoriaProcessoSei,
    ContratoPrazoUnidade,
    ProjetoOrigemTipo,
    ProjetoStatus,
    StatusContrato,
} from '@prisma/client';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { DefaultCsvOptions, FileOutput, ReportContext, ReportableService } from '../utils/utils.service';
import { CreateRelObrasDto } from './dto/create-obras.dto';
import {
    PPObrasRelatorioDto,
    RelObrasAcompanhamentosDto,
    RelObrasAditivosDto,
    RelObrasContratosDto,
    RelObrasCronogramaDto,
    RelObrasDto,
    RelObrasFontesRecursoDto,
    RelObrasOrigemDto,
    RelObrasRegioesDto,
    RelObrasSeiDto,
} from './entities/obras.entity';
import { formataSEI } from 'src/common/formata-sei';

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
    meta_nome?: string;
    pdm_id?: number;
    pdm_nome?: string;
    grupo_tematico_id?: number;
    grupo_tematico_nome?: string;
    tipo_intervencao_id?: number;
    tipo_intervencao_nome?: string;
    tipo_intervencao_conceito?: string;
    equipamento_id?: number;
    equipamento_nome?: string;
    origem_tipo: ProjetoOrigemTipo;
    descricao?: string;
    nome: string;
    codigo?: string;
    detalhamento?: string;
    secretario_colaborador?: string;
    previsao_inicio?: Date;
    previsao_termino?: Date;
    inicio_planejado?: Date;
    termino_planejado?: Date;
    data_inauguracao_planejada?: Date;
    previsao_duracao?: number;
    previsao_custo?: number;
    custo_planejado?: number;
    secretario_responsavel?: string;
    secretario_executivo?: string;
    status: ProjetoStatus;
    subprefeituras: string;
    orgao_responsavel_id: number;
    orgao_responsavel_sigla: string;
    orgao_responsavel_descricao: string;
    orgao_gestor_id: number;
    orgao_gestor_sigla: string;
    orgao_gestor_descricao: string;
    orgao_executor_id: number;
    orgao_executor_sigla: string;
    orgao_executor_descricao: string;
    orgao_origem_id: number;
    orgao_origem_sigla: string;
    orgao_origem_descricao: string;
    orgao_colaborador_sigla: string;
    orgao_colaborador_id: number;
    orgao_colaborador_descricao: string;
    assessores: string;
    pontos_focais_colaboradores: string;
    responsavel_id: number;
    responsavel_nome_exibicao: string;
    mdo_observacoes?: string;

    programa_habitacional?: string;
    n_unidades_habitacionais?: number;
    n_familias_beneficiadas?: number;
    n_unidades_atendidas?: number;

    orgao_id: number;
    orgao_sigla: string;
    orgao_descricao: string;

    projeto_etapa: string | null;

    empreendimento_id?: number;
    empreendimento_identificador?: string;
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

class RetornoDbRegioes {
    projeto_id: number;
    nivel: number;
    descricao: string;
    sigla: string;
}

class RetornoDbFontesRecurso {
    projeto_id: number;
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    valor_percentual?: number;
    valor_nominal?: number;
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
    obra_id: number;
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

class RetornoDbObrasSEI {
    obra_id: number;
    categoria: CategoriaProcessoSei;
    processo_sei: string;
    descricao: string | null;
    link: string | null;
    comentarios: string | null;
    observacoes: string | null;
}

@Injectable()
export class PPObrasService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefasService: TarefaService,
        @Inject(forwardRef(() => TarefaUtilsService)) private readonly tarefasUtilsService: TarefaUtilsService
    ) {}

    async asJSON(dto: CreateRelObrasDto): Promise<PPObrasRelatorioDto> {
        const out_obras: RelObrasDto[] = [];
        const out_cronogramas: RelObrasCronogramaDto[] = [];
        const out_acompanhamentos: RelObrasAcompanhamentosDto[] = [];
        const out_regioes: RelObrasRegioesDto[] = [];
        const out_fontes_recurso: RelObrasFontesRecursoDto[] = [];
        const out_contratos: RelObrasContratosDto[] = [];
        const out_aditivos: RelObrasAditivosDto[] = [];
        const out_origens: RelObrasOrigemDto[] = [];
        const out_processos_sei: RelObrasSeiDto[] = [];

        const whereCond = await this.buildFilteredWhereStr(dto);

        await this.queryDataProjetos(whereCond, out_obras);
        await this.queryDataCronograma(whereCond, out_cronogramas);
        await this.queryDataAcompanhamentos(whereCond, out_acompanhamentos);
        await this.queryDataRegioes(whereCond, out_regioes);
        await this.queryDataFontesRecurso(whereCond, out_fontes_recurso);
        await this.queryDataContratos(whereCond, out_contratos);
        await this.queryDataAditivos(whereCond, out_aditivos);
        await this.queryDataOrigens(whereCond, out_origens);
        await this.queryDataObrasSei(whereCond, out_processos_sei);

        return {
            linhas: out_obras,
            cronograma: out_cronogramas,
            acompanhamentos: out_acompanhamentos,
            regioes: out_regioes,
            fontes_recurso: out_fontes_recurso,
            contratos: out_contratos,
            aditivos: out_aditivos,
            origens: out_origens,
            processos_sei: out_processos_sei,
        };
    }

    async toFileOutput(params: CreateRelObrasDto, ctx: ReportContext): Promise<FileOutput[]> {
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
                name: 'obras.csv',
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

        if (dados.regioes.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.regioes);
            out.push({
                name: 'regioes.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.fontes_recurso.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.fontes_recurso);
            out.push({
                name: 'fontes_recurso.csv',
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

        if (dados.processos_sei.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse(dados.processos_sei);
            out.push({
                name: 'processos_sei.csv',
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

    private async buildFilteredWhereStr(filters: CreateRelObrasDto): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        // na teoria isso aqui é hardcoded pra obras, mas fica aqui por higiene
        if (filters.tipo_projeto) {
            whereConditions.push(`projeto.tipo::varchar = $${paramIndex}::varchar`);
            queryParams.push(filters.tipo_projeto);
            paramIndex++;
        }

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

        if (filters.grupo_tematico_id) {
            whereConditions.push(`projeto.grupo_tematico_id = $${paramIndex}`);
            queryParams.push(filters.grupo_tematico_id);
            paramIndex++;
        }

        if (filters.projeto_regiao_id) {
            whereConditions.push(
                `EXISTS (SELECT 1 FROM projeto_regioes WHERE projeto_id = projeto.id AND regiao_id = $${paramIndex})`
            );
            queryParams.push(filters.projeto_regiao_id);
            paramIndex++;
        }

        if (filters.periodo) {
            whereConditions.push(`projeto.previsao_inicio >= $${paramIndex}`);
            queryParams.push(filters.periodo);
            paramIndex++;
        }

        whereConditions.push(`projeto.removido_em IS NULL`);
        whereConditions.push(`portfolio.modelo_clonagem = false`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        return { whereString, queryParams };
    }

    private async queryDataProjetos(whereCond: WhereCond, out: RelObrasDto[]) {
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
            meta.titulo as meta_nome,
            pdm.id as pdm_id,
            pdm.nome as pdm_nome,
            projeto.nome,
            projeto.codigo,
            projeto.objeto,
            projeto.objetivo,
            tc.previsao_inicio AS inicio_planejado,
            tc.previsao_termino AS termino_planejado,
            projeto.previsao_inicio AS previsao_inicio,
            projeto.previsao_termino AS previsao_termino,
            coalesce(tc.previsao_duracao, projeto.previsao_duracao) AS previsao_duracao,
            projeto.previsao_custo AS previsao_custo,
            tc.previsao_custo AS custo_planejado,
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
                    string_agg(nome_exibicao, '|')
                FROM pessoa
                WHERE id = ANY(projeto.responsaveis_no_orgao_gestor)
            ) as assessores,
            (
                SELECT
                    string_agg(nome_exibicao, '|')
                FROM pessoa
                WHERE id = ANY(projeto.colaboradores_no_orgao)
            ) as pontos_focais_colaboradores,
            r.valor_percentual AS fonte_recurso_valor_pct,
            r.valor_nominal AS fonte_recurso_valor_nominal,
            o.id AS orgao_id,
            o.sigla AS orgao_sigla,
            o.descricao AS orgao_descricao,
            orgao_executor.id AS orgao_executor_id,
            orgao_executor.sigla AS orgao_executor_sigla,
            orgao_executor.descricao AS orgao_executor_descricao,
            orgao_origem.id AS orgao_origem_id,
            orgao_origem.sigla AS orgao_origem_sigla,
            orgao_origem.descricao AS orgao_origem_descricao,
            orgao_colaborador.id AS orgao_colaborador_id,
            orgao_colaborador.sigla AS orgao_colaborador_sigla,
            orgao_colaborador.descricao AS orgao_colaborador_descricao,
            pe.descricao AS projeto_etapa,
            grupo_tematico.id AS grupo_tematico_id,
            grupo_tematico.nome AS grupo_tematico_nome,
            tipo_intervencao.id AS tipo_intervencao_id,
            tipo_intervencao.nome AS tipo_intervencao_nome,
            tipo_intervencao.conceito AS tipo_intervencao_conceito,
            equipamento.id AS equipamento_id,
            equipamento.nome AS equipamento_nome,
            mdo_detalhamento AS detalhamento,
            origem_tipo,
            origem_outro as descricao,
            secretario_colaborador,
            mdo_previsao_inauguracao as data_inauguracao_planejada,
            (
                SELECT
                    string_agg(regiao.descricao, '|')
                FROM projeto_regiao
                JOIN regiao ON regiao.id = projeto_regiao.regiao_id
                WHERE projeto_regiao.projeto_id = projeto.id
                AND projeto_regiao.removido_em IS NULL
                AND regiao.removido_em IS NULL
            ) AS subprefeituras,
            projeto.mdo_programa_habitacional as programa_habitacional,
            projeto.mdo_n_unidades_habitacionais AS n_unidades_habitacionais,
            projeto.mdo_n_familias_beneficiadas AS n_familias_beneficiadas,
            projeto.mdo_n_unidades_atendidas AS n_unidades_atendidas,
            empreendimento.id AS empreendimento_id,
            empreendimento.identificador AS empreendimento_identificador,
            projeto.mdo_observacoes
        FROM projeto
          LEFT JOIN meta ON meta.id = projeto.meta_id AND meta.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id
          LEFT JOIN grupo_tematico ON grupo_tematico.id = projeto.grupo_tematico_id AND grupo_tematico.removido_em IS NULL
          LEFT JOIN tipo_intervencao ON tipo_intervencao.id = projeto.tipo_intervencao_id AND tipo_intervencao.removido_em IS NULL
          LEFT JOIN equipamento ON equipamento.id = projeto.equipamento_id AND equipamento.removido_em IS NULL
          LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
          LEFT JOIN LATERAL (
                SELECT
                    unnest(array[
                        projeto.portfolio_id,
                        portfolio_projeto_compartilhado.portfolio_id
                    ]) AS portfolio_id
                FROM
                    portfolio_projeto_compartilhado
                WHERE
                    projeto.id = portfolio_projeto_compartilhado.projeto_id
                UNION ALL
                SELECT
                    projeto.portfolio_id AS portfolio_id
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM portfolio_projeto_compartilhado
                    WHERE projeto.id = portfolio_projeto_compartilhado.projeto_id
                )
            ) AS port_array ON true
          LEFT JOIN portfolio ON portfolio.id = port_array.portfolio_id
          LEFT JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          LEFT JOIN projeto_orgao_participante po ON po.projeto_id = projeto.id
          LEFT JOIN orgao o ON po.orgao_id = o.id
          LEFT JOIN orgao orgao_responsavel ON orgao_responsavel.id = projeto.orgao_responsavel_id
          LEFT JOIN orgao orgao_gestor ON orgao_gestor.id = projeto.orgao_gestor_id
          LEFT JOIN orgao orgao_executor ON orgao_executor.id = projeto.orgao_executor_id
          LEFT JOIN orgao orgao_origem ON orgao_origem.id = projeto.orgao_origem_id
          LEFT JOIN orgao orgao_colaborador On orgao_colaborador.id = projeto.orgao_colaborador_id
          LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
          LEFT JOIN projeto_etapa pe ON pe.id = projeto.projeto_etapa_id
          LEFT JOIN empreendimento ON empreendimento.id = projeto.empreendimento_id
        ${whereCond.whereString} `;

        const data: RetornoDbProjeto[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        this.convertRowsProjetosInto(data, out);
    }

    private convertRowsProjetosInto(input: RetornoDbProjeto[], out: RelObrasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                portfolio_id: db.portfolio_id,
                portfolio_titulo: db.portfolio_titulo,
                pdm_id: db.pdm_id ? db.pdm_id : null,
                pdm_nome: db.pdm_nome ? db.pdm_nome : null,
                meta_id: db.meta_id ? db.meta_id : null,
                meta_nome: db.meta_nome ? db.meta_nome : null,
                grupo_tematico_id: db.grupo_tematico_id ? db.grupo_tematico_id : null,
                grupo_tematico_nome: db.grupo_tematico_nome ? db.grupo_tematico_nome : null,
                tipo_obra_id: db.tipo_intervencao_id ? db.tipo_intervencao_id : null,
                tipo_obra_nome: db.tipo_intervencao_nome ? db.tipo_intervencao_nome : null,
                tipo_obra_conceito: db.tipo_intervencao_conceito ? db.tipo_intervencao_conceito : null,
                equipamento_id: db.equipamento_id ? db.equipamento_id : null,
                equipamento_nome: db.equipamento_nome ? db.equipamento_nome : null,
                empreendimento_id: db.empreendimento_id ? db.empreendimento_id : null,
                empreendimento_identificador: db.empreendimento_identificador ? db.empreendimento_identificador : null,
                nome: db.nome,
                codigo: db.codigo ? db.codigo : null,
                detalhamento: db.detalhamento ?? null,
                origem_tipo: db.origem_tipo,
                descricao: db.descricao ?? null,
                secretario_colaborador: db.secretario_colaborador,
                previsao_inicio: db.previsao_inicio ? Date2YMD.toString(db.previsao_inicio) : null,
                previsao_termino: db.previsao_termino ? Date2YMD.toString(db.previsao_termino) : null,
                inicio_planejado: db.inicio_planejado ? Date2YMD.toString(db.inicio_planejado) : null,
                termino_planejado: db.termino_planejado ? Date2YMD.toString(db.termino_planejado) : null,
                previsao_duracao: db.previsao_duracao ? db.previsao_duracao : null,
                previsao_custo: db.previsao_custo ? db.previsao_custo : null,
                custo_planejado: db.custo_planejado ? db.custo_planejado : null,
                data_inauguracao_planejada: db.data_inauguracao_planejada
                    ? Date2YMD.toString(db.data_inauguracao_planejada)
                    : null,
                secretario_responsavel: db.secretario_responsavel,
                secretario_executivo: db.secretario_executivo,
                status: db.status,
                subprefeituras: db.subprefeituras,
                etapa: db.projeto_etapa ? db.projeto_etapa : null,
                n_familias_beneficiadas: db.n_familias_beneficiadas ? db.n_familias_beneficiadas : null,
                n_unidades_habitacionais: db.n_unidades_habitacionais ? db.n_unidades_habitacionais : null,
                n_unidades_atendidas: db.n_unidades_atendidas ? db.n_unidades_atendidas : null,
                programa_habitacional: db.programa_habitacional ? db.programa_habitacional : null,
                pontos_focais_colaboradores: db.pontos_focais_colaboradores,
                observacoes: db.mdo_observacoes ? db.mdo_observacoes : null,
                orgao_executor: db.orgao_executor_id
                    ? {
                          id: db.orgao_executor_id,
                          sigla: db.orgao_executor_sigla,
                          descricao: db.orgao_executor_descricao,
                      }
                    : null,
                orgao_origem: db.orgao_origem_id
                    ? { id: db.orgao_origem_id, sigla: db.orgao_origem_sigla, descricao: db.orgao_origem_descricao }
                    : null,

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

                orgao_colaborador: db.orgao_colaborador_id
                    ? {
                          id: db.orgao_colaborador_id,
                          sigla: db.orgao_colaborador_sigla,
                          descricao: db.orgao_colaborador_descricao,
                      }
                    : null,
                assessores: db.assessores,

                responsavel: db.responsavel_id
                    ? {
                          id: db.responsavel_id,
                          nome_exibicao: db.responsavel_nome_exibicao,
                      }
                    : null,
            });
        }
    }

    private async queryDataCronograma(whereCond: WhereCond, out: RelObrasCronogramaDto[]) {
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
            JOIN portfolio ON projeto.portfolio_id = portfolio.id
            LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
            LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
            JOIN tarefa t ON t.tarefa_cronograma_id = tc.id
            ${whereCond.whereString}
        `;

        const data: RetornoDbCronograma[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        await this.putRowsCronogramaInto(data, out);
    }

    private async putRowsCronogramaInto(input: RetornoDbCronograma[], out: RelObrasCronogramaDto[]) {
        for (const db of input) {
            interface dependenciaRow {
                id: number;
                tipo: string;
                latencia: number;
            }

            await this.projetoService.findOne('MDO', db.projeto_id, undefined, 'ReadOnly');

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
                obra_id: db.projeto_id,
                obra_codigo: db.projeto_codigo,
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

    private async queryDataRegioes(whereCond: WhereCond, out: RelObrasRegioesDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            regiao.descricao AS descricao,
            regiao.pdm_codigo_sufixo AS sigla,
            regiao.nivel AS nivel
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_regiao ON projeto_regiao.projeto_id = projeto.id AND projeto_regiao.removido_em IS NULL
          JOIN regiao ON regiao.id = projeto_regiao.regiao_id AND regiao.removido_em IS NULL
        ${whereCond.whereString}
        `;

        const data: RetornoDbRegioes[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsRegioes(data));
    }

    private convertRowsRegioes(input: RetornoDbRegioes[]): RelObrasRegioesDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                subprefeitura:
                    db.nivel == 3
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
                distrito:
                    db.nivel == 4
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
            };
        });
    }

    private async queryDataFontesRecurso(whereCond: WhereCond, out: RelObrasFontesRecursoDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto_fonte_recurso.valor_percentual,
            projeto_fonte_recurso.valor_nominal,
            projeto_fonte_recurso.fonte_recurso_ano,
            projeto_fonte_recurso.fonte_recurso_cod_sof
        FROM projeto
           JOIN portfolio ON projeto.portfolio_id = portfolio.id
           JOIN projeto_fonte_recurso ON projeto_fonte_recurso.projeto_id = projeto.id
        ${whereCond.whereString}
        `;

        const data: RetornoDbFontesRecurso[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsFontesRecurso(data));
    }

    private convertRowsFontesRecurso(input: RetornoDbFontesRecurso[]): RelObrasFontesRecursoDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                fonte_recurso_ano: db.fonte_recurso_ano,
                fonte_recurso_cod_sof: db.fonte_recurso_cod_sof,
                valor_percentual: db.valor_percentual ? db.valor_percentual : null,
                valor_nominal: db.valor_nominal ? db.valor_nominal : null,
            };
        });
    }

    private async queryDataContratos(whereCond: WhereCond, out: RelObrasContratosDto[]) {
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

    private convertRowsContratos(input: RetornoDbContratos[]): RelObrasContratosDto[] {
        return input.map((db) => {
            // Os nros SEI são concatenados por |
            // É necessário fazer o split e aplicar a máscara (formataSEI)
            // E novamente concatenar por | para manter o padrão
            const processos_sei = db.processos_sei
                ? db.processos_sei
                      .split('|')
                      .map((nro) => formataSEI(nro))
                      .join('|')
                : null;

            return {
                id: db.id,
                obra_id: db.obra_id,
                numero: db.numero,
                exclusivo: db.exclusivo,
                processos_SEI: processos_sei,
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

    private async queryDataAditivos(whereCond: WhereCond, out: RelObrasAditivosDto[]) {
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

    private convertRowsAditivos(input: RetornoDbAditivos[]): RelObrasAditivosDto[] {
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

    private async queryDataAcompanhamentos(whereCond: WhereCond, out: RelObrasAcompanhamentosDto[]) {
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

    private convertRowsAcompanhamentos(input: RetornoDbAcompanhamentos[]): RelObrasAcompanhamentosDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                obra_codigo: db.projeto_codigo,
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

    private async queryDataOrigens(whereCond: WhereCond, out: RelObrasOrigemDto[]) {
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

    private convertRowsOrigens(input: RetornoDbOrigens[]): RelObrasOrigemDto[] {
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

    private async queryDataObrasSei(whereCond: WhereCond, out: RelObrasSeiDto[]) {
        const sql = `SELECT
            projeto.id AS obra_id,
            projeto_registro_sei.categoria,
            projeto_registro_sei.processo_sei,
            projeto_registro_sei.descricao,
            projeto_registro_sei.link,
            projeto_registro_sei.comentarios,
            projeto_registro_sei.observacoes
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_registro_sei ON projeto_registro_sei.projeto_id = projeto.id AND projeto_registro_sei.removido_em IS NULL
        ${whereCond.whereString}
        `;

        const data: RetornoDbObrasSEI[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsObrasSei(data));
    }

    private convertRowsObrasSei(input: RetornoDbObrasSEI[]): RelObrasSeiDto[] {
        return input.map((db) => {
            return {
                obra_id: db.obra_id,
                categoria: db.categoria,
                processo_sei: formataSEI(db.processo_sei),
                descricao: db.descricao ?? null,
                link: db.link ?? null,
                comentarios: db.comentarios ?? null,
                observacoes: db.observacoes ?? null,
            };
        });
    }
}
