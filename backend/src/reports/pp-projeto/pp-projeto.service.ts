import { Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoService, ProjetoStatusParaExibicao } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelProjetoDto } from './dto/create-previsao-custo.dto';
import { PPProjetoRelatorioDto, RelProjetoCronogramaDto, RelProjetoPlanoAcaoDto, RelProjetoRelatorioDto, RelProjetoRiscoDto } from './entities/previsao-custo.entity';
import { ProjetoDetailDto } from 'src/pp/projeto/entities/projeto.entity';
import { RiscoService } from 'src/pp/risco/risco.service';
import { PlanoAcaoService } from 'src/pp/plano-de-acao/plano-de-acao.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { Stream2Buffer } from 'src/common/helpers/Stream2Buffer';
import { ProjetoStatus } from '@prisma/client';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class PPProjetoService implements ReportableService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly riscoService: RiscoService,
        private readonly planoAcaoService: PlanoAcaoService,
        private readonly tarefaService: TarefaService,
    ) {}

    async create(dto: CreateRelProjetoDto): Promise<PPProjetoRelatorioDto> {
        const projetoRow: ProjetoDetailDto = await this.projetoService.findOne(dto.projeto_id, undefined, 'ReadOnly');

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
            data_aprovacao: Date2YMD.toStringOrNull(projetoRow.data_aprovacao),
            data_revisao: Date2YMD.toStringOrNull(projetoRow.data_revisao),
            versao: projetoRow.versao,
            publico_alvo: projetoRow.publico_alvo,
            previsao_inicio: Date2YMD.toStringOrNull(projetoRow.previsao_inicio),
            previsao_custo: projetoRow.previsao_custo,
            previsao_duracao: projetoRow.previsao_duracao,
            previsao_termino: Date2YMD.toStringOrNull(projetoRow.previsao_termino),
            realizado_inicio: Date2YMD.toStringOrNull(projetoRow.realizado_inicio),
            realizado_termino: Date2YMD.toStringOrNull(projetoRow.realizado_termino),
            realizado_custo: projetoRow.realizado_custo,
            escopo: projetoRow.escopo,
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
            projecao_termino: Date2YMD.toStringOrNull(projetoRow.projecao_termino),
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
            responsaveis_no_orgao_gestor: projetoRow.responsaveis_no_orgao_gestor.length ? projetoRow.responsaveis_no_orgao_gestor.map(e => e.nome_exibicao).join('|') : null,

            fonte_recursos: projetoRow.fonte_recursos
                ? (
                      await Promise.all(
                          projetoRow.fonte_recursos.map(async e => {
                              let valor: string;

                              class queryRet {
                                  descricao: string;
                              }

                              const nome_fonte: queryRet[] = await this.prisma
                                  .$queryRaw`SELECT descricao FROM sof_entidades_linhas WHERE codigo = ${e.fonte_recurso_cod_sof} AND ano = ${e.fonte_recurso_ano} AND col = 'fonte_recursos'`;

                              if (e.valor_nominal) {
                                  valor = e.valor_nominal.toString();
                              } else {
                                  valor = e.valor_percentual!.toString();
                              }

                              return `${nome_fonte[0].descricao}: ${valor}`;
                          }),
                      )
                  ).join('|')
                : null,

            premissas: projetoRow.premissas ? projetoRow.premissas.map(e => e.premissa).join('|') : null,
            restricoes: projetoRow.restricoes ? projetoRow.restricoes.map(e => e.restricao).join('|') : null,
            orgaos_participantes: projetoRow.orgaos_participantes ? projetoRow.orgaos_participantes.map(e => e.sigla).join('|') : null,
        };

        const tarefasHierarquia = await this.tarefaService.tarefasHierarquia(projetoRow);

        const tarefasRows = await this.tarefaService.findAll(dto.projeto_id, undefined, {});
        const tarefasOut: RelProjetoCronogramaDto[] = tarefasRows.linhas.map(e => {
            return {
                hirearquia: tarefasHierarquia[e.id],
                tarefa: e.tarefa,
                inicio_planejado: Date2YMD.toStringOrNull(e.inicio_planejado),
                termino_planejado: Date2YMD.toStringOrNull(e.termino_planejado),
                custo_estimado: e.custo_estimado,
                duracao_planejado: e.duracao_planejado,
            };
        });

        const riscoRows = await this.riscoService.findAll(dto.projeto_id, undefined);
        const riscosOut: RelProjetoRiscoDto[] = riscoRows.map(e => {
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
            };
        });

        const planoAcaoRows = await this.planoAcaoService.findAll(dto.projeto_id, { risco_id: undefined }, undefined);
        const planoAcaoOut: RelProjetoPlanoAcaoDto[] = planoAcaoRows.map(e => {
            return {
                codigo_risco: e.projeto_risco.codigo,
                contramedida: e.contramedida,
                prazo_contramedida: Date2YMD.toStringOrNull(e.prazo_contramedida),
                responsavel: e.responsavel,
                medidas_de_contingencia: e.medidas_de_contingencia,
            };
        });

        return {
            detail: detail,
            cronograma: tarefasOut,
            riscos: riscosOut,
            planos_acao: planoAcaoOut,
        };
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as PPProjetoRelatorioDto;

        const out: FileOutput[] = [];

        const json2csvParser = new Parser({
            ...DefaultCsvOptions,
            transforms: defaultTransform,
        });
        const linhas = json2csvParser.parse([dados.detail]);
        linhas[0]['status-traduzido'] = ProjetoStatusParaExibicao[linhas[0]['status'] as ProjetoStatus];

        out.push({
            name: 'detalhes-do-projeto.csv',
            buffer: Buffer.from(linhas, 'utf8'),
        });

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

        const uploads = await this.prisma.projetoDocumento.findMany({
            where: {
                removido_em: null,
                projeto_id: dados.detail.id,
            },
            include: {
                arquivo: {
                    select: { id: true, nome_original: true, caminho: true, descricao: true },
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
                    { value: 'arquivo.descricao', label: 'descricao do Arquivo' },
                    { value: 'arquivo.id', label: 'ID do arquivo' },
                ],
            });

            const linhas = json2csvParser.parse(uploads);
            out.push({
                name: 'arquivos.csv',
                buffer: Buffer.from(linhas, 'utf8'),
            });
        }

        if (dados.detail && dados.detail.id) {
            const eap = await this.tarefaService.getEap(
                {
                    id: dados.detail.id,
                    nome: dados.detail.nome!,
                },
                'svg',
            );

            out.push({
                name: 'eap.svg',
                buffer: await Stream2Buffer(eap),
            });
        }
        return [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: params,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                        uploads: uploads,
                    }),
                    'utf8',
                ),
            },
            ...out,
        ];
    }
}
