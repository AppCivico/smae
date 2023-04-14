import { Injectable } from '@nestjs/common';
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
    constructor(
        private readonly prisma: PrismaService
    ) { }

    async create(dto: CreateRelProjetoStatusDto): Promise<PPProjetoStatusRelatorioDto> {
        const projetoRows = await this.prisma.projeto.findMany({
            where: { removido_em: null },
            select: {
                id: true,
                codigo: true,
                nome: true,
                previsao_custo: true,
                realizado_custo: true,

                tarefas: {
                    where: { nivel: 1 },
                    select: {
                        tarefa: true,
                        inicio_real: true,
                        termino_real: true
                    }
                },

                ProjetoAcompanhamento: {
                    take: 1,
                    orderBy: { data_registro: 'desc' },
                    select: {
                        detalhamento_status: true,
                        pontos_atencao: true,
                        cronograma_paralisado: true,
                        prazo_realizado: true,
                    }
                }
            }
        });

        const projetoStatusOut: RelProjetoStatusRelatorioDto[] = projetoRows.map(p => {
            return {
                id: p.id,
                codigo: p.codigo,
                nome: p.nome,
                previsao_custo: p.previsao_custo,
                realizado_custo: p.realizado_custo,

                detalhamento_status: p.ProjetoAcompanhamento.length ? p.ProjetoAcompanhamento[0].detalhamento_status : null,
                pontos_atencao: p.ProjetoAcompanhamento.length ? p.ProjetoAcompanhamento[0].pontos_atencao : null,
                
                tarefas: p.tarefas.length ? p.tarefas.map(t => {
                    let status: string;

                    if (t.termino_real) {
                        status = 'Concluída';
                    } else if (t.inicio_real) {
                        status = 'Em andamento'
                    } else {
                        status = 'Não iniciada'
                    }

                    return `${t.tarefa}=${status}`
                }).join('/') : null,
            }
        });

        return {
            linhas: projetoStatusOut
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
                    'utf8',
                ),
            },
            ...out,
        ];
    }
}
