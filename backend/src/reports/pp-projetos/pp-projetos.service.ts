import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { PPProjetosRelatorioDto, RelProjetosAcompanhamentosDto, RelProjetosCronogramaDto, RelProjetosDto, RelProjetosLicoesAprendidasDto, RelProjetosPlanoAcaoDto, RelProjetosPlanoAcaoMonitoramentosDto, RelProjetosRiscosDto } from './entities/projetos.entity';
import { CreateRelProjetosDto } from './dto/create-projetos.dto';
import { ProjetoFase, ProjetoStatus, StatusRisco } from '@prisma/client';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

class RetornoDbProjeto {
    id: number
    portfolio_id: number
    meta_id?: number
    iniciativa_id?: number
    atividade_id?: number
    nome: string
    codigo?: string
    objeto: string
    objetivo: string
    publico_alvo: string
    previsao_inicio?: Date
    previsao_termino?: Date
    previsao_duracao?: number
    previsao_custo?: number
    escopo?: string
    nao_escopo?: string
    secretario_responsavel?: string
    secretario_executivo?: string
    coordenador_ue?: string
    data_aprovacao?: Date
    data_revisao?: Date
    versao?: string
    status: ProjetoStatus
    fase: ProjetoFase

    responsavel_id: number
    responsavel_nome_exibicao: string

    fonte_recurso_id: number
    fonte_recurso_cod_sof: string
    fonte_recurso_ano: number
    fonte_recurso_valor_pct: number
    fonte_recurso_valor_nominal: number

    premisa_id: number
    premissa: string

    restricao_id: number
    restricao: string

    orgao_id: number
    orgao_sigla: string
    orgao_descricao: string
}

class RetornoDbCronograma {
    projeto_codigo: string
    numero: number
    nivel: number
    tarefa: string
    inicio_planejado?: Date
    termino_planejado?: Date
    custo_estimado?: number
    inicio_real?: Date
    termino_real?: Date
    duracao_real?: number
    percentual_concluido?: number
    custo_real?: number
    dependencias?: string

    responsavel_id: number
    responsavel_nome_exibicao: string

    atraso?: number
}

class RetornoDbRiscos {
    projeto_codigo: string
    codigo: string
    titulo: string
    data_registro: string
    status_risco: StatusRisco
    descricao?: string
    causa?: string
    consequencia?: string
    probabilidade?: number
    impacto?: number
    nivel?: number
    grau?: number
    resposta?: string
    tarefas_afetadas?: string
}

class RetornoDbPlanosAcao {
    projeto_codigo: string
    risco_codigo: string
    contramedida: string
    medidas_de_contingencia: string
    prazo_contramedida?: Date
    custo?: number
    custo_percentual?: number
    responsavel?: string
    data_termino?: Date
}

class RetornoDbPlanosAcaoMonitoramentos {
    projeto_codigo: string
    risco_codigo: string
    plano_acao_id: number
    data_afericao: Date
    descricao: string
}

class RetornoDbLicoesAprendidas {
    projeto_codigo: string
    data_registro: Date
    responsavel: string
    descricao: string
    observacao?: string
}

class RetornoDbAcompanhamentos {
    projeto_codigo: string
    data_registro: Date
    participantes: string
    cronograma_paralizado: boolean
    prazo_encaminhamento?: Date
    prazo_realizado?: Date
    detalhamento?: string
    encaminhamento?: string
    responsavel?: string
    observacao?: string
    detalhamento_status?: string
    pontos_atencao?: string
}

@Injectable()
export class PPProjetosService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,

    ) { }

    async create(dto: CreateRelProjetosDto): Promise<PPProjetosRelatorioDto> {
        const out_projetos: RelProjetosDto[] = [];
        const out_cronogramas: RelProjetosCronogramaDto[] = [];
        const out_riscos: RelProjetosRiscosDto[] = [];
        const out_planos_acao: RelProjetosPlanoAcaoDto[] = [];
        const out_monitoramento_planos_acao: RelProjetosPlanoAcaoMonitoramentosDto[] = [];
        const out_licoes_aprendidas: RelProjetosLicoesAprendidasDto[] = [];
        const out_acompanhamentos: RelProjetosAcompanhamentosDto[] = [];

        await this.queryDataProjetos(dto, out_projetos);
        await this.queryDataCronograma(dto, out_cronogramas);
        await this.queryDataRiscos(dto, out_riscos);
        await this.queryDataPlanosAcao(dto, out_planos_acao);
        await this.queryDataPlanosAcaoMonitoramento(dto, out_monitoramento_planos_acao);
        await this.queryDataLicoesAprendidas(dto, out_licoes_aprendidas);
        await this.queryDataAcompanhamentos(dto, out_acompanhamentos);

        return {
            linhas: out_projetos,
            cronograma: out_cronogramas,
            riscos: out_riscos,
            planos_de_acao: out_planos_acao,
            monitoramento_planos_de_acao: out_monitoramento_planos_acao,
            licoes_aprendidas: out_licoes_aprendidas,
            acompanhamentos: out_acompanhamentos,
        };
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as PPProjetosRelatorioDto;

        const out: FileOutput[] = [];

        if (dados.linhas.length) {
            const json2csvParser = new Parser({
                ...DefaultCsvOptions,
                transforms: defaultTransform,
            });
            const linhas = json2csvParser.parse([dados.linhas]);
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
            const linhas = json2csvParser.parse([dados.cronograma]);
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
            const linhas = json2csvParser.parse([dados.riscos]);
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
            const linhas = json2csvParser.parse([dados.planos_de_acao]);
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
            const linhas = json2csvParser.parse([dados.monitoramento_planos_de_acao]);
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
            const linhas = json2csvParser.parse([dados.licoes_aprendidas]);
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
            const linhas = json2csvParser.parse([dados.acompanhamentos]);
            out.push({
                name: 'acompanhamentos.csv',
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
                    'utf8',
                ),
            },
            ...out,
        ];
    }

    private async queryDataProjetos(filters: CreateRelProjetosDto, out: RelProjetosDto[]) {
        const sql = `SELECT
            projeto.id,
            projeto.portfolio_id,
            projeto.meta_id,
            projeto.iniciativa_id,
            projeto.atividade_id,
            projeto.nome,
            projeto.codigo,
            projeto.objeto,
            projeto.objetivo,
            projeto.publico_alvo,
            projeto.previsao_inicio,
            projeto.previsao_termino,
            projeto.previsao_duracao,
            projeto.previsao_custo,
            projeto.escopo,
            projeto.nao_escopo,
            projeto.secretario_responsavel,
            projeto.secretario_executivo,
            projeto.coordenador_ue,
            projeto.data_aprovacao,
            projeto.data_revisao,
            projeto.versao,
            projeto.status,
            projeto.fase,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            r.id AS fonte_recurso_id,
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
            o.descricao AS orgao_descricao
        FROM projeto
          JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          JOIN projeto_premissa pp ON pp.projeto_id = projeto.id
          JOIN projeto_restricao pr ON pr.projeto_id = projeto.id
          JOIN projeto_orgao_participante po ON po.projeto_id = projeto.id
          JOIN orgao o ON po.orgao_id = o.id
          JOIN pessoa resp ON resp.id = projeto.responsavel_id
        `;

        const data: RetornoDbProjeto[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsProjetos(data));
    }

    private convertRowsProjetos(
        input: RetornoDbProjeto[],
    ): RelProjetosDto[] {
        return input.map(db => {
            return {
                id: db.id,
                portfolio_id: db.portfolio_id,
                meta_id: db.meta_id ? db.meta_id : null,
                iniciativa_id: db.iniciativa_id ? db.iniciativa_id : null,
                atividade_id: db.atividade_id ? db.atividade_id : null,
                nome: db.nome,
                codigo: db.codigo ? db.codigo : null,
                objeto: db.objeto,
                objetivo: db.objetivo,
                publico_alvo: db.publico_alvo,
                previsao_inicio: db.previsao_inicio ? db.previsao_inicio : null,
                previsao_termino: db.previsao_termino ? db.previsao_termino : null,
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
                fase: db.fase,

                orgao_participante: {
                    id: db.orgao_id,
                    sigla: db.orgao_sigla,
                    descricao: db.orgao_descricao
                },

                responsavel: db.responsavel_id ? {
                    id: db.responsavel_id,
                    nome_exibicao: db.responsavel_nome_exibicao
                } : null,

                premissa: db.premisa_id ? {
                    id: db.premisa_id,
                    premissa: db.premissa
                } : null,

                restricao: db.restricao_id ? {
                    id: db.restricao_id,
                    restricao: db.restricao
                } : null,

                fonte_recurso: db.fonte_recurso_id ? {
                    id: db.fonte_recurso_id,
                    fonte_recurso_cod_sof: db.fonte_recurso_cod_sof,
                    fonte_recurso_ano: db.fonte_recurso_ano,
                    valor_percentual: db.fonte_recurso_valor_pct,
                    valor_nominal: db.fonte_recurso_valor_nominal
                } : null
            };
        });
    }

    private async queryDataCronograma(filters: CreateRelProjetosDto, out: RelProjetosCronogramaDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto.atraso,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            t.numero,
            t.nivel,
            t.tarefa,
            t.inicio_planejado,
            t.termino_planejado,
            t.custo_estimado,
            t.inicio_real,
            t.termino_real,
            t.duracao_real,
            t.percentual_concluido,
            t.custo_real,
            '' as dependencias
        FROM projeto
          JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          JOIN pessoa resp ON resp.id = projeto.responsavel_id
          JOIN tarefa t ON t.projeto_id = projeto.id
        `;

        const data: RetornoDbCronograma[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsCronograma(data));
    }

    private convertRowsCronograma(
        input: RetornoDbCronograma[],
    ): RelProjetosCronogramaDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                numero: db.numero,
                nivel: db.nivel,
                tarefa: db.tarefa,
                inicio_planejado: db.inicio_planejado ? db.inicio_planejado : null,
                termino_planejado: db.termino_planejado ? db.termino_planejado : null,
                custo_estimado: db.custo_estimado ? db.custo_estimado : null,
                inicio_real: db.inicio_real ? db.inicio_real : null,
                termino_real: db.termino_real ? db.termino_real : null,
                duracao_real: db.duracao_real ? db.duracao_real : null,
                percentual_concluido: db.percentual_concluido ? db.percentual_concluido : null,
                custo_real: db.custo_real ? db.custo_real : null,
                dependencias: db.dependencias ? db.dependencias : null,
                atraso: db.atraso ? db.atraso : null,
                responsavel: db.responsavel_id ? {
                    id: db.responsavel_id,
                    nome_exibicao: db.responsavel_nome_exibicao
                } : null,
            };
        });
    }

    private async queryDataRiscos(filters: CreateRelProjetosDto, out: RelProjetosRiscosDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo,
            projeto_risco.titulo,
            projeto_risco.registrado_em,
            projeto_risco.status_risco,
            projeto_risco.descricao,
            projeto_risco.causa,
            projeto_risco.consequencia,
            projeto_risco.probabilidade,
            projeto_risco.impacto,
            projeto_risco.nivel,
            projeto_risco.grau,
            projeto_risco.resposta,
            '' as tarefas_afetadas
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id
        `;

        const data: RetornoDbRiscos[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsRiscos(data));
    }

    private convertRowsRiscos(
        input: RetornoDbRiscos[],
    ): RelProjetosRiscosDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                codigo: db.codigo,
                titulo: db.titulo,
                data_registro: db.data_registro,
                status_risco: db.status_risco,
                descricao: db.descricao ? db.descricao : null,
                causa: db.causa ? db.causa : null,
                consequencia: db.consequencia ? db.consequencia : null,
                probabilidade: db.probabilidade ? db.probabilidade : null,
                impacto: db.impacto ? db.impacto : null,
                nivel: db.nivel ? db.nivel : null,
                grau: db.grau ? db.grau : null,
                resposta: db.resposta ? db.resposta : null,
                tarefas_afetadas: db.tarefas_afetadas ? db.tarefas_afetadas : null,
            };
        });
    }

    private async queryDataPlanosAcao(filters: CreateRelProjetosDto, out: RelProjetosPlanoAcaoDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo AS risco_codigo,
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
        `;

        const data: RetornoDbPlanosAcao[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsPlanosAcao(data));
    }

    private convertRowsPlanosAcao(
        input: RetornoDbPlanosAcao[],
    ): RelProjetosPlanoAcaoDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                risco_codigo: db.risco_codigo,
                contramedida: db.contramedida,
                medidas_de_contingencia: db.medidas_de_contingencia,
                prazo_contramedida: db.prazo_contramedida ? db.prazo_contramedida : null,
                custo: db.custo ? db.custo : null,
                custo_percentual: db.custo_percentual ? db.custo_percentual : null,
                responsavel: db.responsavel ? db.responsavel : null,
                data_termino: db.data_termino ? db.data_termino : null,
            };
        });
    }

    private async queryDataPlanosAcaoMonitoramento(filters: CreateRelProjetosDto, out: RelProjetosPlanoAcaoMonitoramentosDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto_risco.codigo AS risco_codigo,
            plano_acao.id AS plano_acao_id,
            plano_acao_monitoramento.data_afericao,
            plano_acao_monitoramento.descricao
        FROM projeto
          JOIN projeto_risco ON projeto_risco.projeto_id = projeto.id
          JOIN plano_acao ON plano_acao.projeto_risco_id = projeto_risco.id
          JOIN plano_acao_monitoramento ON plano_acao_monitoramento.plano_acao_id = plano_acao.id
        `;

        const data: RetornoDbPlanosAcaoMonitoramentos[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsPlanosAcaoMonitoramento(data));
    }

    private convertRowsPlanosAcaoMonitoramento(
        input: RetornoDbPlanosAcaoMonitoramentos[],
    ): RelProjetosPlanoAcaoMonitoramentosDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                risco_codigo: db.risco_codigo,
                plano_acao_id: db.plano_acao_id,
                data_afericao: db.data_afericao,
                descricao: db.descricao
            };
        });
    }

    private async queryDataLicoesAprendidas(filters: CreateRelProjetosDto, out: RelProjetosLicoesAprendidasDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto_licao_aprendida.data_registro,
            projeto_licao_aprendida.responsavel,
            projeto_licao_aprendida.descricao,
            projeto_licao_aprendida.observacao
        FROM projeto
          JOIN projeto_licao_aprendida ON projeto_licao_aprendida.projeto_id = projeto.id
        `;

        const data: RetornoDbLicoesAprendidas[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsLicoesAprendidas(data));
    }

    private convertRowsLicoesAprendidas(
        input: RetornoDbLicoesAprendidas[],
    ): RelProjetosLicoesAprendidasDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                data_registro: db.data_registro,
                responsavel: db.responsavel,
                descricao: db.descricao,
                observacao: db.observacao ? db.observacao : null
            };
        });
    }

    private async queryDataAcompanhamentos(filters: CreateRelProjetosDto, out: RelProjetosAcompanhamentosDto[]) {
        const sql = `SELECT
            projeto.codigo AS projeto_codigo,
            projeto_acompanhamento.data_registro,
            projeto_acompanhamento.participantes,
            projeto_acompanhamento.cronograma_paralizado,
            projeto_acompanhamento.prazo_encaminhamento,
            projeto_acompanhamento.prazo_realizado,
            projeto_acompanhamento.detalhamento,
            projeto_acompanhamento.encaminhamento,
            projeto_acompanhamento.responsavel,
            projeto_acompanhamento.observacao,
            projeto_acompanhamento.detalhamento_status,
            projeto_acompanhamento.pontos_atencao
        FROM projeto
          JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id
        `;

        const data: RetornoDbAcompanhamentos[] = await this.prisma.$queryRawUnsafe(sql);

        out.push(...this.convertRowsAcompanhamentos(data));
    }

    private convertRowsAcompanhamentos(
        input: RetornoDbAcompanhamentos[],
    ): RelProjetosAcompanhamentosDto[] {
        return input.map(db => {
            return {
                projeto_codigo: db.projeto_codigo,
                data_registro: db.data_registro,
                participantes: db.participantes,
                cronograma_paralizado: db.cronograma_paralizado,
                prazo_encaminhamento: db.prazo_encaminhamento ? db.prazo_encaminhamento : null,
                prazo_realizado: db.prazo_realizado ? db.prazo_realizado : null,
                detalhamento: db.detalhamento ? db.detalhamento : null,
                encaminhamento: db.encaminhamento ? db.encaminhamento : null,
                responsavel: db.responsavel ? db.responsavel : null,
                observacao: db.observacao ? db.observacao : null,
                detalhamento_status: db.detalhamento_status ? db.detalhamento_status : null,
                pontos_atencao: db.pontos_atencao ? db.pontos_atencao : null,
            };
        });
    }

}
