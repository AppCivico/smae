import { HttpException, Injectable } from '@nestjs/common';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { RiscoService } from 'src/pp/risco/risco.service';
import { PlanoAcaoService } from 'src/pp/plano-de-acao/plano-de-acao.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { PPProjetoStatusRelatorioDto, RelProjetoStatusRelatorioDto } from './entities/projeto-status.dto';
import { stat } from 'fs';
import { CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';

const {
    Parser,
    transforms: { flatten },
} = require('json2csv');
const defaultTransform = [flatten({ paths: [] })];

@Injectable()
export class PPStatusService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateRelProjetoStatusDto): Promise<PPProjetoStatusRelatorioDto> {
        if (!dto.portfolio_id) throw new HttpException('Faltando portfolio_id', 400);
        const projetoRows = await this.prisma.projeto.findMany({
            where: {
                id: dto.projeto_id ? dto.projeto_id : undefined,
                portfolio_id: dto.portfolio_id,
                removido_em: null,
            },
            select: {
                id: true,
                portfolio_id: true,
                codigo: true,
                nome: true,
                previsao_custo: true,
                realizado_custo: true,
                em_atraso: true,

                orgao_responsavel: {
                    select: {
                        sigla: true,
                    },
                },

                tarefas: {
                    where: { nivel: 1 },
                    select: {
                        tarefa: true,
                        inicio_real: true,
                        termino_real: true,
                    },
                },

                ProjetoAcompanhamento: {
                    take: 1,
                    orderBy: { data_registro: 'desc' },
                    where: {
                        data_registro: {
                            gte: dto.periodo_inicio ? dto.periodo_inicio : undefined,
                            lte: dto.periodo_fim ? dto.periodo_fim : undefined,
                        },
                    },
                    select: {
                        detalhamento_status: true,
                        pontos_atencao: true,
                        cronograma_paralisado: true,
                    },
                },
            },
        });

        if (projetoRows.length == 0) throw new HttpException('Não há linhas para estas condições.', 400);

        const projetoStatusOut: RelProjetoStatusRelatorioDto[] = projetoRows.map((p) => {
            let cronograma: string;
            const acompanhamento = p.ProjetoAcompanhamento[0];

            if (acompanhamento && acompanhamento.cronograma_paralisado) {
                cronograma = 'Paralisado';
            } else if (p.em_atraso) {
                cronograma = 'Atrasado';
            } else {
                cronograma = 'Em dia';
            }

            return {
                id: p.id,
                portfolio_id: p.portfolio_id,
                codigo: p.codigo,
                nome: p.nome,
                previsao_custo: p.previsao_custo,
                realizado_custo: p.realizado_custo,
                cronograma: cronograma,

                orgao_responsavel_sigla: p.orgao_responsavel ? p.orgao_responsavel.sigla : null,

                detalhamento_status: p.ProjetoAcompanhamento.length
                    ? p.ProjetoAcompanhamento[0].detalhamento_status
                    : null,
                pontos_atencao: p.ProjetoAcompanhamento.length ? p.ProjetoAcompanhamento[0].pontos_atencao : null,

                tarefas: p.tarefas.length
                    ? p.tarefas
                          .map((t) => {
                              let status: string;

                              if (t.termino_real) {
                                  status = 'Concluída';
                              } else if (t.inicio_real) {
                                  status = 'Em andamento';
                              } else {
                                  status = 'Não iniciada';
                              }

                              return `${t.tarefa}=${status}`;
                          })
                          .join('/')
                    : null,
            };
        });

        return {
            linhas: projetoStatusOut,
        };
    }

    async getFiles(myInput: any, pdm_id: number, params: any): Promise<FileOutput[]> {
        const dados = myInput as PPProjetoStatusRelatorioDto;

        const out: FileOutput[] = [];

        const json2csvParser = new Parser({
            ...DefaultCsvOptions,
            transforms: defaultTransform,
        });
        const linhas = json2csvParser.parse(dados.linhas);
        out.push({
            name: 'projeto-status.csv',
            buffer: Buffer.from(linhas, 'utf8'),
        });

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
