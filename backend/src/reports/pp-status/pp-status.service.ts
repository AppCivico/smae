import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoGetPermissionSet } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
import { CreateRelProjetoStatusDto } from './dto/create-projeto-status.dto';
import { PPProjetoStatusRelatorioDto, RelProjetoStatusRelatorioDto } from './entities/projeto-status.dto';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { flatten } from '@json2csv/transforms';


type ProjetoStatusDbRow = {
    id: number;
    codigo: string | null;
    portfolio_id: number;
    nome: string;
    previsao_custo: number | null;
    orgao_responsavel: { sigla: string } | null;
    TarefaCronograma: {
        previsao_custo: number | null;
        realizado_custo: number | null;
        em_atraso: boolean;
        Tarefa: { tarefa: string; inicio_real: Date | null; termino_real: Date | null }[];
    }[];
    ProjetoAcompanhamento: {
        detalhamento: string | null;
        pontos_atencao: string | null;
        cronograma_paralisado: boolean;
    }[];
};

@Injectable()
export class PPStatusService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async asJSON(dto: CreateRelProjetoStatusDto, user: PessoaFromJwt | null): Promise<PPProjetoStatusRelatorioDto> {
        this.verificaParams(dto);

        const projetoRows = await this.buscaProjetos(dto, user);

        if (projetoRows.length == 0) throw new HttpException('Não há linhas para estas condições.', 400);

        const projetoStatusOut: RelProjetoStatusRelatorioDto[] = projetoRows.map((p) => {
            return this.mapToRelProjetoStatusRelatorio(p);
        });

        return {
            linhas: projetoStatusOut,
        };
    }

    private mapToRelProjetoStatusRelatorio(r: ProjetoStatusDbRow): RelProjetoStatusRelatorioDto {
        let cronograma: string;
        const acompanhamento = r.ProjetoAcompanhamento[0];
        const tarefaCrono = r.TarefaCronograma[0] ? r.TarefaCronograma[0] : undefined;

        if (acompanhamento && acompanhamento.cronograma_paralisado) {
            cronograma = 'Paralisado';
        } else if (tarefaCrono?.em_atraso) {
            cronograma = 'Atrasado';
        } else {
            cronograma = 'Em dia';
        }

        return {
            id: r.id,
            portfolio_id: r.portfolio_id,
            codigo: r.codigo,
            nome: r.nome,
            previsao_custo: tarefaCrono?.previsao_custo ?? r.previsao_custo ?? null,
            realizado_custo: tarefaCrono?.realizado_custo ?? null,
            cronograma: cronograma,

            orgao_responsavel_sigla: r?.orgao_responsavel?.sigla ?? null,
            detalhamento: acompanhamento?.detalhamento ?? null,
            pontos_atencao: acompanhamento?.pontos_atencao ?? null,

            tarefas: r.TarefaCronograma.length
                ? r.TarefaCronograma.flatMap((r) => r.Tarefa)
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
    }

    private async buscaProjetos(dto: CreateRelProjetoStatusDto, user: PessoaFromJwt | null) {
        let whereSet: Awaited<ReturnType<typeof ProjetoGetPermissionSet>> | undefined = undefined;
        if (user) {
            const sistema = user.modulo_sistema[0];
            if (!sistema) throw new Error('Usuário sem sistema');
            if (!dto.tipo_pdm) throw new Error('Tipo de PDM não informado');

            whereSet = await ProjetoGetPermissionSet(dto.tipo_pdm, user);
        }

        return await this.prisma.projeto.findMany({
            where: {
                tipo: dto.tipo_pdm,
                id: dto.projeto_id ? dto.projeto_id : undefined,
                AND: whereSet,
                removido_em: null,
                portfolio: {
                    tipo_projeto: dto.tipo_pdm,
                    id: dto.portfolio_id,
                    modelo_clonagem: false,
                },
            },
            select: {
                id: true,
                portfolio_id: true,
                codigo: true,
                nome: true,
                previsao_custo: true,

                orgao_responsavel: {
                    select: {
                        sigla: true,
                    },
                },

                TarefaCronograma: {
                    where: { removido_em: null },
                    select: {
                        em_atraso: true,
                        realizado_custo: true,
                        previsao_custo: true,

                        Tarefa: {
                            where: {
                                nivel: 1,
                            },
                            select: {
                                tarefa: true,
                                inicio_real: true,
                                termino_real: true,
                            },
                        },
                    },
                },

                ProjetoAcompanhamento: {
                    take: 1,
                    orderBy: { data_registro: 'desc' },
                    where: {
                        removido_em: null,
                        OR: [{ apresentar_no_relatorio: null }, { apresentar_no_relatorio: true }],
                        data_registro: {
                            gte: dto.periodo_inicio ? dto.periodo_inicio : undefined,
                            lte: dto.periodo_fim ? dto.periodo_fim : undefined,
                        },
                    },
                    select: {
                        detalhamento: true,
                        pontos_atencao: true,
                        cronograma_paralisado: true,
                    },
                },
            },
        });
    }

    private verificaParams(dto: CreateRelProjetoStatusDto) {
        if (!dto.portfolio_id) throw new HttpException('Faltando portfolio_id', 400);
        if (!dto.tipo_pdm) dto.tipo_pdm = 'PP';
    }

    async toFileOutput(
        params: CreateRelProjetoStatusDto,
        ctx: ReportContext,
        user: PessoaFromJwt | null
    ): Promise<FileOutput[]> {
        // mais um relatório relativamente simples, se tiver problema de memória, pode ser que seja necessário
        // fazer paginação na busca dos projetos, mas a princípio não deve ser necessário
        const dados = await this.asJSON(params, user);
        await ctx.resumoSaida(params.tipo_pdm === 'PP' ? 'Projeto Status' : 'Obra Status', dados.linhas.length);
        await ctx.progress(50);

        const out: FileOutput[] = [];

        const transforms = [flatten()];

        const fileName = params.tipo_pdm === 'PP' ? 'projeto-statuss.csv' : 'obra-status.csv';
        const tmp = ctx.getTmpFile(fileName);

        const csvOpts: CsvWriterOptions<any> = {
            csvOptions: DefaultCsvOptions,
            transforms,
        };

        await WriteCsvToFile(dados.linhas, tmp.stream, csvOpts);

        out.push({
            name: fileName,
            localFile: tmp.path,
        });
        await ctx.progress(99);

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
