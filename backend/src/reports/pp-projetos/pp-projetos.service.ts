import { BadRequestException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { ProjetoGetPermissionSet, ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Readable } from 'stream';

import { ContratoPrazoUnidade, ProjetoStatus, StatusContrato, StatusRisco, TipoProjeto } from '@prisma/client';
import { DateTime } from 'luxon';
import { RiscoCalc } from 'src/common/RiscoCalc';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ProjetoRiscoStatus } from '../../pp/risco/entities/risco.entity';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { CsvFileHandler } from '../shared/csv-file-handler';
import { StreamBatchHandler } from '../shared/stream-handlers';
import { FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import { PPProjetosStreamingDto } from './dto/streaming-projetos.dto';
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
import { Logger } from '@nestjs/common';
import { SmaeConfigService } from '../../common/services/smae-config.service';

type WhereCond = {
    whereString: string;
    queryParams: any[];
    count: number;
};

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

    portfolios_compartilhados_titulos: string | null;
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
    geojson: unknown;
}

@Injectable()
export class PPProjetosService implements ReportableService {
    private tipo: TipoProjeto = 'PP';
    private logger: Logger = new Logger(PPProjetosService.name);
    private static readonly BATCH_SIZE = 100;

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefasService: TarefaService,
        @Inject(forwardRef(() => TarefaUtilsService)) private readonly tarefasUtilsService: TarefaUtilsService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async asJSON(dto: CreateRelProjetosDto, user: PessoaFromJwt | null): Promise<PPProjetosRelatorioDto> {
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

        const whereCond = await this.buildFilteredWhereStr(dto, user);

        const maxReports = await this.smaeConfigService.getConfigNumberWithDefault('PP_PROJETOS_MAX_ROWS', 200);
        if (whereCond.count > maxReports) {
            throw new BadRequestException(
                `Mais de ${maxReports} projetos encontrados. Por favor, refine sua busca ou utilize o serviço de streaming/exportação.`
            );
        }

        await this.queryDataProjetos(whereCond, out_projetos);
        await this.queryDataRiscos(whereCond, out_riscos);
        await this.queryDataPlanosAcao(whereCond, out_planos_acao);
        await this.queryDataPlanosAcaoMonitoramento(whereCond, out_monitoramento_planos_acao);
        await this.queryDataLicoesAprendidas(whereCond, out_licoes_aprendidas);
        await this.queryDataAcompanhamentos(whereCond, out_acompanhamentos);
        await this.queryDataContratos(whereCond, out_contratos);
        await this.queryDataAditivos(whereCond, out_aditivos);
        await this.queryDataOrigens(whereCond, out_origens);
        await this.queryDataProjetosGeoloc(whereCond, out_enderecos);

        await this.queryDataCronograma(whereCond, out_cronogramas);

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

    streamProjetos(dto: CreateRelProjetosDto, user: PessoaFromJwt | null): Readable {
        const stream = new Readable({ objectMode: true, read() {} });

        this.processProjectsStream(dto, user, stream).catch((error) => {
            this.logger.error('Error in streamProjetos:', error);
            if (!stream.destroyed) {
                stream.emit('error', error);
            }
        });

        return stream;
    }

    private async processProjectsStream(dto: CreateRelProjetosDto, user: PessoaFromJwt | null, stream: Readable) {
        try {
            // Get the where condition and project IDs
            const whereCond = await this.buildFilteredWhereStr(dto, user);
            const projectIds = await this.getProjetosIds(whereCond);

            this.logger.log(`Starting stream processing for ${projectIds.length} projects`);

            // Process each project individually
            for (let i = 0; i < projectIds.length; i++) {
                const projectId = projectIds[i];

                try {
                    // Create a where condition for just this project
                    const singleProjectWhereCond: WhereCond = {
                        whereString:
                            'WHERE projeto.id = $1 AND projeto.removido_em IS NULL AND portfolio.modelo_clonagem = false',
                        queryParams: [projectId],
                        count: 1,
                    };

                    // Query all data for this single project
                    const projectData = await this.queryDataForSingleProject(singleProjectWhereCond);

                    // Create the streaming response object
                    const streamingResponse: PPProjetosStreamingDto = {
                        projeto_id: projectId,
                        dados: projectData,
                    };

                    // Push to stream
                    if (!stream.destroyed) {
                        stream.push(streamingResponse);
                    }

                    // Log progress every 10 projects
                    if ((i + 1) % 10 === 0) {
                        this.logger.log(`Processed ${i + 1}/${projectIds.length} projects`);
                    }
                } catch (projectError) {
                    this.logger.error(`Error processing project ${projectId}:`, projectError);
                    // Continue with next project instead of stopping the entire stream
                    continue;
                }
            }

            // End the stream
            if (!stream.destroyed) {
                stream.push(null);
            }

            this.logger.log(`Completed streaming ${projectIds.length} projects`);
        } catch (error) {
            this.logger.error('Error in processProjectsStream:', error);
            throw error;
        }
    }

    private async queryDataForSingleProject(whereCond: WhereCond): Promise<PPProjetosRelatorioDto> {
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

        // Execute all queries in parallel for better performance
        await Promise.all([
            this.queryDataProjetos(whereCond, out_projetos),
            this.queryDataCronograma(whereCond, out_cronogramas),
            this.queryDataRiscos(whereCond, out_riscos),
            this.queryDataPlanosAcao(whereCond, out_planos_acao),
            this.queryDataPlanosAcaoMonitoramento(whereCond, out_monitoramento_planos_acao),
            this.queryDataLicoesAprendidas(whereCond, out_licoes_aprendidas),
            this.queryDataAcompanhamentos(whereCond, out_acompanhamentos),
            this.queryDataContratos(whereCond, out_contratos),
            this.queryDataAditivos(whereCond, out_aditivos),
            this.queryDataOrigens(whereCond, out_origens),
            this.queryDataProjetosGeoloc(whereCond, out_enderecos),
        ]);

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

    // Alternative implementation: if you want to batch multiple projects together for better DB performance
    private async processProjectsStreamBatched(
        dto: CreateRelProjetosDto,
        user: PessoaFromJwt | null,
        stream: Readable
    ) {
        try {
            const whereCond = await this.buildFilteredWhereStr(dto, user);
            const projectIds = await this.getProjetosIds(whereCond);

            this.logger.log(`Starting batched stream processing for ${projectIds.length} projects`);

            const batchSize = 5; // Process 5 projects at a time

            for (let i = 0; i < projectIds.length; i += batchSize) {
                const batchIds = projectIds.slice(i, i + batchSize);

                // Process each project in the batch
                const batchPromises = batchIds.map(async (projectId) => {
                    try {
                        const singleProjectWhereCond: WhereCond = {
                            whereString:
                                'WHERE projeto.id = $1 AND projeto.removido_em IS NULL AND portfolio.modelo_clonagem = false',
                            queryParams: [projectId],
                            count: 5,
                        };

                        const projectData = await this.queryDataForSingleProject(singleProjectWhereCond);

                        return {
                            projeto_id: projectId,
                            dados: projectData,
                        };
                    } catch (error) {
                        this.logger.error(`Error processing project ${projectId}:`, error);
                        return null;
                    }
                });

                // Wait for all projects in this batch to complete
                const batchResults = await Promise.all(batchPromises);

                // Stream the completed projects
                for (const result of batchResults) {
                    if (result && !stream.destroyed) {
                        stream.push(result);
                    }
                }

                this.logger.log(
                    `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(projectIds.length / batchSize)}`
                );
            }

            // End the stream
            if (!stream.destroyed) {
                stream.push(null);
            }

            this.logger.log(`Completed batched streaming ${projectIds.length} projects`);
        } catch (error) {
            this.logger.error('Error in processProjectsStreamBatched:', error);
            throw error;
        }
    }

    private async gerarCsv(
        tipo: string,
        fields: string[],
        fieldNames: string[],
        projectIds: number[],
        out: FileOutput[],
        ctx: ReportContext,
        progress: number
    ) {
        const handler = new CsvFileHandler(fields, fieldNames);
        try {
            const tmpFile = await this.processDataInBatches(tipo, projectIds, handler, PPProjetosService.BATCH_SIZE);
            if (tmpFile) {
                out.push({ name: `${tipo}.csv`, localFile: tmpFile });
            } else {
                Logger.warn(`Nenhum dado encontrado para "${tipo}", CSV não gerado.`);
            }
        } catch (error) {
            Logger.error(`Erro ao gerar CSV de projetos:`, error);
            throw new Error(`Erro ao gerar CSV de projetos: ${error.message}`);
        }
        await ctx.progress(progress);
    }

    async toFileOutput(
        params: CreateRelProjetosDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        const whereCond = await this.buildFilteredWhereStr(params, user);
        const projetosIds = await this.getProjetosIds(whereCond);
        const out: FileOutput[] = [];

        // 1. Processar Projetos
        const projetosFields = [
            'id',
            'nome',
            'portfolio_id',
            'portfolio_titulo',
            'meta_id',
            'iniciativa_id',
            'atividade_id',
            'codigo',
            'objeto',
            'objetivo',
            'publico_alvo',
            'previsao_inicio',
            'previsao_termino',
            'previsao_duracao',
            'previsao_custo',
            'escopo',
            'nao_escopo',
            'secretario_responsavel',
            'secretario_executivo',
            'coordenador_ue',
            'data_aprovacao',
            'data_revisao',
            'versao',
            'status-traduzido',
            'projeto_etapa',
            'orgao_participante.id',
            'orgao_participante.sigla',
            'orgao_participante.descricao',
            'orgao_responsavel.id',
            'orgao_responsavel.sigla',
            'orgao_responsavel.descricao',
            'orgao_gestor.id',
            'orgao_gestor.sigla',
            'orgao_gestor.descricao',
            'gestores',
            'responsavel.id',
            'responsavel.nome_exibicao',
            'premissa.id',
            'premissa.premissa',
            'restricao.id',
            'restricao.restricao',
            'fonte_recurso.id',
            'fonte_recurso.nome',
            'fonte_recurso.fonte_recurso_cod_sof',
            'fonte_recurso.fonte_recurso_ano',
            'fonte_recurso.valor_percentual',
            'fonte_recurso.valor_nominal',
            'status',
            'portfolios_compartilhados_titulos',
        ];

        const projetosFieldNames = [
            'ID do Projeto',
            'Nome do Projeto',
            'ID Portfólio',
            'Título do Portfólio',
            'ID Meta',
            'ID Iniciativa',
            'ID Atividade',
            'Código',
            'Objeto',
            'Objetivo',
            'Público-Alvo',
            'Previsão de Início',
            'Previsão de Término',
            'Previsão de Duração',
            'Previsão de Custo',
            'Escopo',
            'Não Escopo',
            'Secretário Responsável',
            'Secretário Executivo',
            'Coordenador UE',
            'Data de Aprovação',
            'Data de Revisão',
            'Versão',
            'Status',
            'Projeto Etapa',
            'ID Órgão Participante',
            'Sigla Órgão Participante',
            'Descrição Órgão Participante',
            'ID Órgão Responsável',
            'Sigla Órgão Responsável',
            'Descrição Órgão Responsável',
            'ID Órgão Gestor',
            'Sigla Órgão Gestor',
            'Descrição Órgão Gestor',
            'Gestores do Projeto',
            'ID Responsável',
            'Nome do Responsável',
            'ID Premissa',
            'Descrição da Premissa',
            'ID Restrição',
            'Descrição da Restrição',
            'ID Fonte de Recurso',
            'Nome da Fonte de Recurso',
            'Código SOF da Fonte',
            'Ano da Fonte',
            'Valor Percentual da Fonte',
            'Valor Nominal da Fonte',
            'Status (Banco)',
            'Portfólios Compartilhados',
        ];
        await this.gerarCsv('projetos', projetosFields, projetosFieldNames, projetosIds, out, ctx, 20);
        await ctx.resumoSaida('Projetos', projetosIds.length);

        // 2. Processar Cronograma
        const cronogramaFields = [
            'projeto_id',
            'projeto_codigo',
            'tarefa_id',
            'hierarquia',
            'numero',
            'nivel',
            'tarefa',
            'inicio_planejado',
            'termino_planejado',
            'custo_estimado',
            'inicio_real',
            'termino_real',
            'duracao_real',
            'percentual_concluido',
            'custo_real',
            'dependencias',
            'atraso',
            'responsavel.id',
            'responsavel.nome_exibicao',
        ];
        const cronogramaFieldNames = [
            'ID Projeto',
            'Código do Projeto',
            'ID da Tarefa',
            'Hierarquia',
            'Número',
            'Nível',
            'Tarefa',
            'Início Planejado',
            'Término Planejado',
            'Custo Estimado',
            'Início Real',
            'Término Real',
            'Duração Real (dias)',
            '% Concluído',
            'Custo Real',
            'Dependências',
            'Atraso (dias)',
            'ID do Responsável',
            'Nome do Responsável',
        ];
        await this.gerarCsv('cronograma', cronogramaFields, cronogramaFieldNames, projetosIds, out, ctx, 40);

        // 3. Processar Riscos
        const riscosFields = [
            'projeto_id',
            'projeto_codigo',
            'codigo',
            'titulo',
            'data_registro',
            'status_risco',
            'descricao',
            'causa',
            'consequencia',
            'probabilidade',
            'probabilidade_descricao',
            'impacto',
            'impacto_descricao',
            'nivel',
            'grau',
            'grau_descricao',
            'resposta',
            'tarefas_afetadas',
        ];
        const riscosFieldNames = [
            'ID Projeto',
            'Código do Projeto',
            'Código',
            'Título',
            'Data de Registro',
            'Status do Risco',
            'Descrição',
            'Causa',
            'Consequência',
            'Probabilidade',
            'Descrição da Probabilidade',
            'Impacto',
            'Descrição do Impacto',
            'Nível',
            'Grau',
            'Descrição do Grau',
            'Resposta',
            'Tarefas Afetadas',
        ];
        await this.gerarCsv('riscos', riscosFields, riscosFieldNames, projetosIds, out, ctx, 50);

        // 4. Processar Plano de Ação
        const planosAcaoFields = [
            'projeto_id',
            'projeto_codigo',
            'plano_acao_id',
            'risco_codigo',
            'contramedida',
            'medidas_de_contingencia',
            'prazo_contramedida',
            'custo',
            'custo_percentual',
            'responsavel',
            'data_termino',
        ];
        const planosAcaoFieldNames = [
            'ID Projeto',
            'Código do Projeto',
            'ID do Plano de Ação',
            'Código do Risco',
            'Contramedida',
            'Medidas de Contingência',
            'Prazo da Contramedida',
            'Custo (R$)',
            'Custo (%)',
            'Responsável',
            'Data de Término',
        ];
        await this.gerarCsv('planos_de_acao', planosAcaoFields, planosAcaoFieldNames, projetosIds, out, ctx, 55);

        // 5. Processar Plano de Ação Monitoramentos
        const planosMonitorFields = [
            'projeto_id',
            'projeto_codigo',
            'risco_codigo',
            'plano_acao_id',
            'data_afericao',
            'descricao',
        ];
        const planosMonitorFieldNames = [
            'ID Projeto',
            'Código Projeto',
            'Código Risco',
            'ID Plano de Ação',
            'Data de aferição',
            'Descrição',
        ];
        await this.gerarCsv(
            'monitoramento_planos_de_acao',
            planosMonitorFields,
            planosMonitorFieldNames,
            projetosIds,
            out,
            ctx,
            60
        );

        // 6. Processar Licoes de Aprendidas
        const licoesFields = [
            'projeto_id',
            'projeto_codigo',
            'sequencial',
            'data_registro',
            'responsavel',
            'descricao',
            'observacao',
            'contexto',
            'resultado',
        ];
        const licoesFieldNames = [
            'ID Projeto',
            'Código do Projeto',
            'Sequencial',
            'Data de Registro',
            'Responsável',
            'Descrição',
            'Observação',
            'Contexto',
            'Resultado',
        ];
        await this.gerarCsv('licoes_aprendidas', licoesFields, licoesFieldNames, projetosIds, out, ctx, 65);

        // 7. Processar acompanhamentos
        const acompFields = [
            'projeto_id',
            'projeto_codigo',
            'data_registro',
            'participantes',
            'cronograma_paralizado',
            'prazo_encaminhamento',
            'pauta',
            'prazo_realizado',
            'detalhamento',
            'encaminhamento',
            'responsavel',
            'observacao',
            'detalhamento_status',
            'pontos_atencao',
            'riscos',
        ];
        const acompFieldNames = [
            'ID Projeto',
            'Código do Projeto',
            'Data do Registro',
            'Participantes',
            'Cronograma Paralisado',
            'Prazo de Encaminhamento',
            'Pauta',
            'Prazo Realizado',
            'Detalhamento',
            'Encaminhamento',
            'Responsável',
            'Observação',
            'Status Detalhado',
            'Pontos de Atenção',
            'Códigos dos Riscos',
        ];
        await this.gerarCsv('acompanhamentos', acompFields, acompFieldNames, projetosIds, out, ctx, 70);

        // 8. Processar contratos
        const contratosFields = [
            'id',
            'projeto_id',
            'numero',
            'exclusivo',
            'processos_SEI',
            'status',
            'modalidade_licitacao.id',
            'modalidade_licitacao.nome',
            'fontes_recurso',
            'area_gestora.id',
            'area_gestora.sigla',
            'area_gestora.descricao',
            'objeto',
            'descricao_detalhada',
            'contratante',
            'empresa_contratada',
            'prazo',
            'unidade_prazo',
            'data_base',
            'data_inicio',
            'data_termino',
            'data_termino_atualizada',
            'valor',
            'valor_reajustado',
            'percentual_medido',
            'observacoes',
        ];

        const contratosFieldNames = [
            'ID Contrato',
            'ID Projeto',
            'Número',
            'Exclusivo',
            'Processos SEI',
            'Status',
            'Modalidade de Licitação - ID',
            'Modalidade de Licitação - Nome',
            'Fontes de Recurso',
            'Área Gestora - ID',
            'Área Gestora - Sigla',
            'Área Gestora - Descrição',
            'Objeto',
            'Descrição Detalhada',
            'Contratante',
            'Empresa Contratada',
            'Prazo',
            'Unidade Prazo',
            'Data-base',
            'Data Início',
            'Data Término',
            'Data Término Atualizada',
            'Valor',
            'Valor Reajustado',
            '% Execução',
            'Observações',
        ];
        await this.gerarCsv('contratos', contratosFields, contratosFieldNames, projetosIds, out, ctx, 75);

        // 9. Processar Aditivos
        const aditivosFields = [
            'id',
            'contrato_id',
            'tipo.nome',
            'data',
            'valor_com_reajuste',
            'percentual_medido',
            'data_termino_atual',
        ];
        const aditivosFieldNames = [
            'ID Aditivo',
            'ID Contrato',
            'Tipo Aditivo',
            'Data',
            'Valor com Reajuste',
            '% Execução',
            'Data Término Atual',
        ];
        await this.gerarCsv('aditivos', aditivosFields, aditivosFieldNames, projetosIds, out, ctx, 80);

        // 10. Processar Origens
        const origensFields = [
            'projeto_id',
            'pdm_id',
            'pdm_titulo',
            'meta_id',
            'meta_titulo',
            'iniciativa_id',
            'iniciativa_titulo',
            'atividade_id',
            'atividade_titulo',
        ];
        const origensFieldNames = [
            'ID Projeto',
            'ID PDM',
            'Título do PDM',
            'ID Meta',
            'Título da Meta',
            'ID Iniciativa',
            'Título da Iniciativa',
            'ID Atividade',
            'Título da Atividade',
        ];
        await this.gerarCsv('origens', origensFields, origensFieldNames, projetosIds, out, ctx, 90);

        // 11. Processar Geolocalização
        const geolocFields = ['projeto_id', 'endereco_exibicao', 'geom_geojson'];
        const geolocFieldNames = ['ID Projeto', 'Endereço', 'GeoJSON'];
        await this.gerarCsv('geoloc', geolocFields, geolocFieldNames, projetosIds, out, ctx, 100);

        return [...out];
    }

    private async buildFilteredWhereStr(filters: CreateRelProjetosDto, user: PessoaFromJwt | null): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;
        let count = 0;

        const perms = await ProjetoGetPermissionSet(this.tipo, user ? user : undefined);

        const allowed = await this.prisma.projeto.findMany({
            where: {
                AND: perms,
                removido_em: null,
                // importante manter o portfolio_id aqui, pois é utilizado no filtro de compartilhamento
                // e aqui também
                portfolio_id: filters.portfolio_id,
                portfolio: { modelo_clonagem: false }, // não traz portfólios que são modelos para clonagem
                // reduz o número de linhas pra não virar um "IN" gigante
                tipo: this.tipo,
                id: filters.projeto_id ? { in: filters.projeto_id } : undefined,
                codigo: filters.codigo ?? undefined,
                orgao_responsavel_id: filters.orgao_responsavel_id ?? undefined,
                status: filters.status ?? undefined,
            },
            select: { id: true },
        });

        const allowed_shared = await this.prisma.portfolioProjetoCompartilhado.findMany({
            where: {
                projeto: {
                    AND: perms,
                    portfolio: { modelo_clonagem: false }, // não traz portfólios que são modelos para clonagem
                },
                removido_em: null,
                portfolio_id: filters.portfolio_id,
            },
            select: { projeto_id: true },
        });

        // Adicionando projetos compartilhados.
        // Deve ser adicionado apenas projetos que não sejam originalmente do portfolio utilizado no filtro.
        allowed.push(
            ...allowed_shared
                .filter((n) => !allowed.find((m) => m.id === n.projeto_id))
                .map((n) => ({ id: n.projeto_id }))
        );

        if (allowed.length === 0) {
            return { whereString: 'WHERE false', queryParams: [], count: 0 };
        }

        count = allowed.length;
        whereConditions.push(`projeto.id = ANY($${paramIndex}::int[])`);
        queryParams.push(allowed.map((n) => n.id));
        paramIndex++;

        // não usa o filtro do portfolio_id, pois já foi aplicado no filtro de permissões
        delete (filters as any).portfolio_id;

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

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : 'WHERE TRUE';
        return { whereString, queryParams, count: count };
    }

    private async queryDataProjetos(whereCond: WhereCond, out: RelProjetosDto[]) {
        const anoCorrente = DateTime.local({ locale: SYSTEM_TIMEZONE }).year;

        const sql = `
            WITH shared_portfolios AS (
                SELECT
                    ppc.projeto_id,
                    string_agg(p.titulo, ' | ') AS titulos
                FROM portfolio_projeto_compartilhado ppc
                JOIN portfolio p ON p.id = ppc.portfolio_id AND p.removido_em IS NULL
                WHERE ppc.removido_em IS NULL
                GROUP BY ppc.projeto_id
            )
            SELECT
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
            pe.descricao AS projeto_etapa,
            sp.titulos AS portfolios_compartilhados_titulos
        FROM projeto
          LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
          LEFT JOIN shared_portfolios sp ON sp.projeto_id = projeto.id
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
                portfolios_compartilhados_titulos: db.portfolios_compartilhados_titulos,
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
                JOIN tarefa t2 ON t2.id = td.dependencia_tarefa_id AND t2.removido_em IS NULL
                WHERE td.tarefa_id = t.id
            ) as dependencias
            FROM projeto
            LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
            LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
            JOIN tarefa t ON t.tarefa_cronograma_id = tc.id AND t.removido_em IS NULL
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            ${whereCond.whereString}
        `;

        const data: RetornoDbCronograma[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        await this.putRowsCronogramaInto(data, out);
    }
    private async putRowsCronogramaInto(input: RetornoDbCronograma[], out: RelProjetosCronogramaDto[]) {
        const projetoChecked = new Set<number>();

        // Cache de tarefasHierarquia results por projeto_id
        const tarefasHierarquiaCache: Record<number, Record<string, string>> = {};

        for (const db of input) {
            interface dependenciaRow {
                id: number;
                tipo: string;
                latencia: number;
            }

            if (!projetoChecked.has(db.projeto_id)) {
                projetoChecked.add(db.projeto_id);
                await this.projetoService.findOne(this.tipo, db.projeto_id, undefined, 'ReadOnly');
            }

            let tarefasHierarquia: Record<string, string>;

            if (tarefasHierarquiaCache[db.projeto_id]) {
                tarefasHierarquia = tarefasHierarquiaCache[db.projeto_id];
            } else {
                const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
                    where: {
                        projeto_id: db.projeto_id,
                        removido_em: null,
                    },
                    select: { id: true },
                });

                if (tarefaCronoId) {
                    tarefasHierarquia = await this.tarefasService.tarefasHierarquia(tarefaCronoId.id);
                    tarefasHierarquiaCache[db.projeto_id] = tarefasHierarquia;
                } else {
                    tarefasHierarquia = {};
                }
            }

            out.push({
                projeto_id: db.projeto_id,
                projeto_codigo: db.projeto_codigo,
                tarefa_id: db.id,
                hierarquia: tarefasHierarquia[db.id],
                numero: db.nivel,
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
                JOIN tarefa t ON rt.tarefa_id = t.id AND t.removido_em IS NULL
                WHERE rt.projeto_risco_id = projeto_risco.id
            ) as tarefas_afetadas
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id AND projeto_risco.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id AND projeto_risco.removido_em IS NULL
          JOIN plano_acao ON plano_acao.projeto_risco_id = projeto_risco.id AND plano_acao.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id AND projeto_risco.removido_em IS NULL
          JOIN plano_acao ON plano_acao.projeto_risco_id = projeto_risco.id AND plano_acao.removido_em IS NULL
          JOIN plano_acao_monitoramento ON plano_acao_monitoramento.plano_acao_id = plano_acao.id AND plano_acao_monitoramento.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN projeto_licao_aprendida ON projeto_licao_aprendida.projeto_id = projeto.id AND projeto_licao_aprendida.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
            projeto_acompanhamento.cronograma_paralisado AS cronograma_paralizado,
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
                JOIN projeto_risco r ON ar.projeto_risco_id = r.id AND r.removido_em IS NULL
                WHERE ar.projeto_acompanhamento_id = projeto_acompanhamento.id
            ) AS riscos
        FROM projeto
          JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id AND projeto_acompanhamento.removido_em IS NULL
          LEFT JOIN projeto_acompanhamento_item ON projeto_acompanhamento_item.projeto_acompanhamento_id = projeto_acompanhamento.id AND projeto_acompanhamento_item.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
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
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN projeto_origem ON projeto_origem.projeto_id = projeto.id AND projeto_origem.removido_em IS NULL
          LEFT JOIN meta ON meta.id = projeto_origem.meta_id AND meta.removido_em IS NULL
          LEFT JOIN iniciativa ON iniciativa.id = projeto_origem.iniciativa_id AND iniciativa.removido_em IS NULL
          LEFT JOIN atividade ON atividade.id = projeto_origem.atividade_id AND atividade.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id AND pdm.removido_em IS NULL
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
                geo.endereco_exibicao AS endereco,
                geo.geom_geojson AS geojson
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
            JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
            ${whereCond.whereString}
        `;

        const data: RetornoDbLoc[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsLoc(data));
    }

    private convertRowsLoc(input: RetornoDbLoc[]): RelProjetosGeolocDto[] {
        interface JSONGeo {
            properties: {
                cep: string;
            };
        }

        return input.map((db) => {
            const geojson = db.geojson as JSONGeo;

            return {
                projeto_id: db.projeto_id,
                endereco: db.endereco,
                cep: geojson.properties.cep,
            };
        });
    }

    private async processDataInBatches<T>(
        tableName: string,
        projectIds: number[],
        handler: StreamBatchHandler<T>,
        batchSize = PPProjetosService.BATCH_SIZE
    ): Promise<any> {
        if (projectIds.length === 0) {
            return handler.onComplete();
        }

        const totalBatches = Math.ceil(projectIds.length / batchSize);

        for (let i = 0; i < projectIds.length; i += batchSize) {
            const batchIds = projectIds.slice(i, i + batchSize);

            const batchData = await this.querySpecificDataByTable(tableName, batchIds);

            if (tableName == 'projetos') {
                batchData.forEach((row) => {
                    if (row.status)
                        (row as any)['status-traduzido'] = ProjetoStatusParaExibicao[row.status as ProjetoStatus];
                });
            }
            await handler.onBatch(batchData, Math.floor(i / batchSize), totalBatches);
        }
        return handler.onComplete();
    }

    // Método auxiliar que reutiliza as queries existentes, filtrando por IDs
    private async querySpecificDataByTable(tableName: string, projectIds: number[]): Promise<any[]> {
        const whereCondForBatch = {
            whereString: 'WHERE projeto.id = ANY($1::int[])',
            queryParams: [projectIds],
            count: 1,
        };

        const result: any[] = [];

        // O switch reutiliza os métodos de query existentes, garantindo que a lógica de negócio não seja alterada
        switch (tableName) {
            case 'projetos':
                await this.queryDataProjetos(whereCondForBatch, result);
                break;
            case 'cronograma':
                await this.queryDataCronograma(whereCondForBatch, result);
                break;
            case 'riscos':
                await this.queryDataRiscos(whereCondForBatch, result);
                break;
            case 'planos_de_acao':
                await this.queryDataPlanosAcao(whereCondForBatch, result);
                break;
            case 'monitoramento_planos_de_acao':
                await this.queryDataPlanosAcaoMonitoramento(whereCondForBatch, result);
                break;
            case 'licoes_aprendidas':
                await this.queryDataLicoesAprendidas(whereCondForBatch, result);
                break;
            case 'acompanhamentos':
                await this.queryDataAcompanhamentos(whereCondForBatch, result);
                break;
            case 'contratos':
                await this.queryDataContratos(whereCondForBatch, result);
                break;
            case 'aditivos':
                await this.queryDataAditivos(whereCondForBatch, result);
                break;
            case 'origens':
                await this.queryDataOrigens(whereCondForBatch, result);
                break;
            case 'geoloc':
                await this.queryDataProjetosGeoloc(whereCondForBatch, result);
                break;
        }
        return result;
    }

    private async getProjetosIds(whereCond: WhereCond): Promise<number[]> {
        const projectIdsQuery = `
        SELECT DISTINCT projeto.id, projeto.codigo
        FROM projeto
        JOIN portfolio ON projeto.portfolio_id = portfolio.id
        ${whereCond.whereString}
        ORDER BY projeto.codigo
    `;

        const result = await this.prisma.$queryRawUnsafe(projectIdsQuery, ...whereCond.queryParams);
        return (result as any[]).map((row) => row.id);
    }
}
