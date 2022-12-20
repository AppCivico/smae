import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejado } from '../orcamento-planejado/entities/orcamento-planejado.entity';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoRealizadoDto, FilterOrcamentoRealizadoDto, UpdateOrcamentoRealizadoDto } from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizado } from './entities/orcamento-realizado.entity';

const FRASE_FIM = ' Revise os valores ou utilize o botão "Validar Via SOF" para atualizar os valores';

type PartialOrcamentoRealizadoDto = {
    ano_referencia: number;
};

@Injectable()
export class OrcamentoRealizadoService {
    liberarValoresMaioresQueSof: boolean
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
        private readonly dotacaoService: DotacaoService,
    ) {
        // deixar desligado a verificação
        this.liberarValoresMaioresQueSof = true;
    }

    async create(dto: CreateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id!, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);
        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, execucao_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado ou não está com a execução liberada', 400);

        const { dotacao, processo, nota_empenho } = await this.validaDotProcNota(dto);

        console.log({ dotacao, processo, nota_empenho });

        const created = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());
            let mes_utilizado: number;

            const soma_valor_empenho = dto.itens.reduce((acc, item) => acc + item.valor_empenho, 0);
            const soma_valor_liquidado = dto.itens.reduce((acc, item) => acc + item.valor_liquidado, 0);

            if (nota_empenho) {
                mes_utilizado = await this.atualizaNotaEmpenho(prismaTxn, dto, dotacao, processo, nota_empenho, soma_valor_empenho, soma_valor_liquidado);
            } else if (processo) {
                mes_utilizado = await this.atualizaProcesso(prismaTxn, dto, dotacao, processo, soma_valor_empenho, soma_valor_liquidado);
            } else if (dotacao) {
                mes_utilizado = await this.atualizaDotacao(prismaTxn, dto, dotacao, soma_valor_empenho, soma_valor_liquidado);
            } else {
                throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
            }

            const orcamentoRealizado = await prismaTxn.orcamentoRealizado.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    meta_id: meta_id!,
                    iniciativa_id,
                    atividade_id,
                    mes_utilizado: mes_utilizado,
                    ano_referencia: dto.ano_referencia,
                    dotacao,
                    processo: processo,
                    nota_empenho: nota_empenho,
                    soma_valor_empenho,
                    soma_valor_liquidado,
                    itens: {
                        createMany: {
                            data: dto.itens.map((item) => {
                                return {
                                    valor_empenho: item.valor_empenho,
                                    valor_liquidado: item.valor_liquidado,
                                    mes: item.mes,
                                    data_referencia: new Date([dto.ano_referencia, item.mes, '01'].join('-')),
                                }
                            })
                        }
                    }
                },
                select: { id: true }
            });

            return orcamentoRealizado;
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 100000
        });

        return created;

    }

    async update(id: number, dto: UpdateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoRealizado) throw new HttpException('Orçamento realizado não encontrado', 404);
        console.log(dto);

        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id!, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);
        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: orcamentoRealizado.ano_referencia, execucao_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado ou não está com a execução liberada', 400);

        const updated = await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());

            const nova_soma_valor_empenho = dto.itens.reduce((acc, item) => acc + item.valor_empenho, 0);
            const nova_soma_valor_liquidado = dto.itens.reduce((acc, item) => acc + item.valor_liquidado, 0);

            const orcRealizado = await prismaTxn.orcamentoRealizado.findUniqueOrThrow({ where: { id: +id } });
            if (orcRealizado.nota_empenho) {
                await this.atualizaNotaEmpenho(prismaTxn, { ano_referencia: orcRealizado.ano_referencia },
                    orcRealizado.dotacao, orcRealizado.processo, orcRealizado.nota_empenho, nova_soma_valor_empenho, nova_soma_valor_liquidado,
                    orcRealizado.soma_valor_empenho, orcRealizado.soma_valor_liquidado, // valores atuais para serem descontados
                );
            } else if (orcRealizado.processo) {
                await this.atualizaProcesso(prismaTxn, { ano_referencia: orcRealizado.ano_referencia },
                    orcRealizado.dotacao, orcRealizado.processo, nova_soma_valor_empenho, nova_soma_valor_liquidado,
                    orcRealizado.soma_valor_empenho, orcRealizado.soma_valor_liquidado, // valores atuais para serem descontados
                );
            } else if (orcRealizado.dotacao) {
                await this.atualizaDotacao(prismaTxn, { ano_referencia: orcRealizado.ano_referencia },
                    orcRealizado.dotacao, nova_soma_valor_empenho, nova_soma_valor_liquidado,
                    orcRealizado.soma_valor_empenho, orcRealizado.soma_valor_liquidado, // valores atuais para serem descontados
                );
            } else {
                throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
            }

            if (orcRealizado.nota_empenho) {
                const notaTx = await prismaTxn.dotacaoProcessoNota.findUnique({
                    where: {
                        ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                            ano_referencia: orcRealizado.ano_referencia,
                            dotacao: orcRealizado.dotacao,
                            dotacao_processo: orcRealizado.processo!,
                            dotacao_processo_nota: orcRealizado.nota_empenho
                        }
                    },
                });
                if (!notaTx) throw new HttpException('Nota-Empenho não foi foi encontrado no banco de dados', 400);

                const smae_soma_valor_empenho = notaTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho + nova_soma_valor_empenho;
                const smae_soma_valor_liquidado = notaTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado + nova_soma_valor_liquidado;
                await prismaTxn.dotacaoProcessoNota.update({
                    where: { id: notaTx.id },
                    data: {
                        smae_soma_valor_empenho,
                        smae_soma_valor_liquidado,
                    }
                });
            } else if (orcRealizado.processo) {
                const processoTx = await prismaTxn.dotacaoProcesso.findUnique({
                    where: {
                        ano_referencia_dotacao_dotacao_processo: {
                            ano_referencia: orcRealizado.ano_referencia,
                            dotacao: orcRealizado.dotacao,
                            dotacao_processo: orcRealizado.processo,
                        }
                    },
                });
                if (!processoTx) throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);

                const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho + nova_soma_valor_empenho;
                const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado + nova_soma_valor_liquidado;
                await prismaTxn.dotacaoProcesso.update({
                    where: { id: processoTx.id },
                    data: {
                        smae_soma_valor_empenho,
                        smae_soma_valor_liquidado,
                    }
                });
            } else if (orcRealizado.dotacao) {
                const processoTx = await prismaTxn.dotacaoRealizado.findUnique({
                    where: {
                        ano_referencia_dotacao: {
                            ano_referencia: orcRealizado.ano_referencia,
                            dotacao: orcRealizado.dotacao,
                        }
                    },
                });
                if (!processoTx) throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);

                const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho + nova_soma_valor_empenho;
                const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado + nova_soma_valor_liquidado;
                await prismaTxn.dotacaoRealizado.update({
                    where: { id: processoTx.id },
                    data: {
                        smae_soma_valor_empenho,
                        smae_soma_valor_liquidado,
                    }
                });
            }

            await prismaTxn.orcamentoRealizadoItem.updateMany({
                where: {
                    orcamento_realizado_id: orcRealizado.id,
                },
                data: {
                    sobrescrito_em: now,
                    sobrescrito_por: user.id,
                }
            });
            const updated = await prismaTxn.orcamentoRealizado.update({
                where: {
                    id: orcRealizado.id,
                },
                data: {
                    meta_id: meta_id!,
                    iniciativa_id,
                    atividade_id,
                    soma_valor_empenho: nova_soma_valor_empenho,
                    soma_valor_liquidado: nova_soma_valor_liquidado,
                    itens: {
                        createMany: {
                            data: dto.itens.map((item) => {
                                return {
                                    valor_empenho: item.valor_empenho,
                                    valor_liquidado: item.valor_liquidado,
                                    mes: item.mes,
                                    data_referencia: new Date([orcRealizado.ano_referencia, item.mes, '01'].join('-')),
                                }
                            })
                        }
                    }
                },
            });


            return updated;
        }, {
            isolationLevel: 'Serializable',
            maxWait: 5000,
            timeout: 100000
        });

        return updated;
    }

    private async atualizaDotacao(
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        soma_valor_empenho: number,
        soma_valor_liquidado: number,
        soma_valor_empenho_desconto: number = 0,
        soma_valor_liquidado_desconto: number = 0,
    ) {
        const dotacaoTx = await prismaTxn.dotacaoRealizado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano_referencia,
                    dotacao: dotacao,
                }
            }
        });
        if (!dotacaoTx)
            throw new HttpException('Operação não pode ser realizada no momento. Dotação deixou de existir durante a atualização.', 400);
        const mes_utilizado = dotacaoTx.mes_utilizado;

        const novaSomaEmpenho = dotacaoTx.smae_soma_valor_empenho + soma_valor_empenho - soma_valor_empenho_desconto;
        const novaSomaLiquido = dotacaoTx.smae_soma_valor_liquidado + soma_valor_liquidado - soma_valor_liquidado_desconto;

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaEmpenho * 100) > Math.round(dotacaoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE (${novaSomaEmpenho.toFixed(2)}) seria maior do que o valor de empenho para a Dotação ${dotacaoTx.empenho_liquido.toFixed(2)}.` +
                FRASE_FIM, 400);
        }

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaLiquido * 100) > Math.round(dotacaoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de liquidado no SMAE (${novaSomaLiquido.toFixed(2)}) seria maior do que o valor de liquidado para a Dotação (${dotacaoTx.valor_liquidado.toFixed(2)}).` +
                FRASE_FIM, 400);
        }

        await prismaTxn.dotacaoRealizado.update({
            where: { id: dotacaoTx.id },
            data: {
                smae_soma_valor_empenho: novaSomaEmpenho,
                smae_soma_valor_liquidado: novaSomaLiquido,
            }
        });
        return mes_utilizado;
    }

    private async atualizaProcesso(
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        processo: string,
        soma_valor_empenho: number,
        soma_valor_liquidado: number,
        soma_valor_empenho_desconto: number = 0,
        soma_valor_liquidado_desconto: number = 0,
    ) {
        const processoTx = await prismaTxn.dotacaoProcesso.findUnique({
            where: {
                ano_referencia_dotacao_dotacao_processo: {
                    ano_referencia: dto.ano_referencia,
                    dotacao: dotacao,
                    dotacao_processo: processo,
                }
            }
        });
        if (!processoTx)
            throw new HttpException('Operação não pode ser realizada no momento. Processo deixou de existir durante a atualização.', 400);
        const mes_utilizado = processoTx.mes_utilizado;

        const novaSomaEmpenho = processoTx.smae_soma_valor_empenho + soma_valor_empenho - soma_valor_empenho_desconto;
        const novaSomaLiquido = processoTx.smae_soma_valor_liquidado + soma_valor_liquidado - soma_valor_liquidado_desconto;

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaEmpenho * 100) > Math.round(processoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE (${novaSomaEmpenho.toFixed(2)}) seria maior do que o valor de empenho para o Processo (${processoTx.empenho_liquido.toFixed(2)}).` +
                FRASE_FIM, 400);
        }

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaLiquido * 100) > Math.round(processoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de liquidado no SMAE (${novaSomaLiquido.toFixed(2)}) seria maior do que o valor liquidado para o Processo (${processoTx.valor_liquidado.toFixed(2)}).` +
                FRASE_FIM, 400);
        }

        await prismaTxn.dotacaoProcesso.update({
            where: { id: processoTx.id },
            data: {
                smae_soma_valor_empenho: novaSomaEmpenho,
                smae_soma_valor_liquidado: novaSomaLiquido,
            }
        });
        return mes_utilizado;
    }

    private async atualizaNotaEmpenho(
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        processo: string | null,
        nota_empenho: string,
        soma_valor_empenho: number,
        soma_valor_liquidado: number,
        soma_valor_empenho_desconto: number = 0,
        soma_valor_liquidado_desconto: number = 0,
    ) {
        const notaEmpenhoTx = await prismaTxn.dotacaoProcessoNota.findUnique({
            where: {
                ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                    ano_referencia: dto.ano_referencia,
                    dotacao: dotacao,
                    dotacao_processo: processo!,
                    dotacao_processo_nota: nota_empenho
                }
            }
        });
        if (!notaEmpenhoTx)
            throw new HttpException('Operação não pode ser realizada no momento. Nota-Empenho deixou de existir durante a atualização.', 400);
        const mes_utilizado = notaEmpenhoTx.mes_utilizado;

        const novaSomaEmpenho = notaEmpenhoTx.smae_soma_valor_empenho + soma_valor_empenho - soma_valor_empenho_desconto;
        const novaSomaLiquido = notaEmpenhoTx.smae_soma_valor_liquidado + soma_valor_liquidado - soma_valor_liquidado_desconto;

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaEmpenho * 100) > Math.round(notaEmpenhoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE (${novaSomaEmpenho.toFixed(2)}) seria maior do que o valor de empenho para a Nota-Empenho (${notaEmpenhoTx.empenho_liquido.toFixed(2)}).` +
                FRASE_FIM, 400);
        }

        if (this.liberarValoresMaioresQueSof == false &&
            Math.round(novaSomaLiquido * 100) > Math.round(notaEmpenhoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de liquidado no SMAE (${novaSomaLiquido.toFixed(2)}) seria maior do que o valor liquidado para a Nota-Empenho (${notaEmpenhoTx.valor_liquidado.toFixed(2)}).` +
                FRASE_FIM, 400);
        }

        await prismaTxn.dotacaoProcessoNota.update({
            where: { id: notaEmpenhoTx.id },
            data: {
                smae_soma_valor_empenho: novaSomaEmpenho,
                smae_soma_valor_liquidado: novaSomaLiquido,
            }
        });
        return mes_utilizado;
    }

    async validaDotProcNota(dto: CreateOrcamentoRealizadoDto): Promise<{ dotacao: string, processo: string | null, nota_empenho: string | null }> {
        const dotacao: string = dto.dotacao;
        let processo: string | null = null;
        let nota_empenho: string | null = null;

        nota_empenho = dto.nota_empenho ? dto.nota_empenho.replace(/[^0-9]/g, '') : null;
        processo = dto.processo ? dto.processo.replace(/[^0-9]/g, '') : null;

        // se é por nota_empenho, os testes sobre o uso de limite serão apenas sobre a nota-empenho
        // da mesma forma, se for pro processo, os testes de limite serão apenas sobre o processo
        // a dotação *não* acumula a liquidação/empenho dos registro registrados no processo/nota-empenho
        // pelo menos não na versão do dia 06/12/2022!

        if (nota_empenho) {
            if (!processo) throw new HttpException('Necessário enviar Processo ao enviar Nota Empenho', 400);

            const notaDb = await this.prisma.dotacaoProcessoNota.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                        dotacao_processo: processo,
                        dotacao_processo_nota: nota_empenho
                    }
                }
            });
            if (!notaDb) throw new HttpException('Nota de Empenho não foi encontrada no banco de dados', 400);
        } else if (processo) {
            const processoDb = await this.prisma.dotacaoProcesso.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo: {
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                        dotacao_processo: processo,
                    }
                }
            });
            if (!processoDb) throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);
        } else {
            const dotacaoDb = await this.prisma.dotacaoRealizado.findUnique({
                where: {
                    ano_referencia_dotacao: {
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                    }
                }
            });
            if (!dotacaoDb) throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);
        }


        return {
            dotacao,
            processo,
            nota_empenho,
        }
    }


    async findAll(filters: FilterOrcamentoRealizadoDto): Promise<OrcamentoRealizado[]> {

        const queryRows = await this.prisma.orcamentoRealizado.findMany({
            where: {
                removido_em: null,
                dotacao: filters?.dotacao,
                meta_id: filters?.meta_id,
                processo: filters?.processo,
                nota_empenho: filters?.nota_empenho,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
            },
            select: {
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                soma_valor_empenho: true,
                soma_valor_liquidado: true,
                ano_referencia: true,
                dotacao: true,
                nota_empenho: true,
                processo: true,
                criado_em: true,
                id: true,
                itens: {
                    where: {
                        sobrescrito_por: null
                    },
                },
            },
            orderBy: [
                { meta_id: 'asc' },
                { iniciativa_id: 'asc' },
                { atividade_id: 'asc' },
                { id: 'asc' }
            ]
        });

        const notaEncontradas: Record<string, boolean> = {};
        const processosEncontrados: Record<string, boolean> = {};
        const dotacoesEncontradas: Record<string, boolean> = {};
        // levantando os dados para o 'poor's mans join'
        for (const op of queryRows) {
            if (op.nota_empenho) {
                if (notaEncontradas[op.dotacao] == undefined) notaEncontradas[op.nota_empenho] = true;
            } else if (op.processo) {
                if (processosEncontrados[op.dotacao] == undefined) processosEncontrados[op.processo] = true;
            } else {
                if (dotacoesEncontradas[op.dotacao] == undefined) dotacoesEncontradas[op.dotacao] = true;
            }
        }
        // cruza as nota-empenho
        const notasInfo = await this.prisma.dotacaoProcessoNota.findMany({
            where: {
                dotacao_processo_nota: { in: Object.keys(notaEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                smae_soma_valor_empenho: true,
                smae_soma_valor_liquidado: true,
                dotacao_processo_nota: true,
                empenho_liquido: true,
                valor_liquidado: true,
            }
        });
        const notasInfoRef: Record<string, typeof notasInfo[0]> = {};
        for (const nota of notasInfo) {
            notasInfoRef[nota.dotacao_processo_nota] = nota;
        }

        // cruza os processos
        const processoInfo = await this.prisma.dotacaoProcesso.findMany({
            where: {
                dotacao_processo: { in: Object.keys(processosEncontrados) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                smae_soma_valor_empenho: true,
                smae_soma_valor_liquidado: true,
                dotacao_processo: true,
                dotacao: true,
                empenho_liquido: true,
                valor_liquidado: true,
            }
        });
        const processoInfoRef: Record<string, typeof processoInfo[0]> = {};
        for (const processo of processoInfo) {
            processoInfoRef[processo.dotacao + '_' + processo.dotacao_processo] = processo;
        }

        // cruza as dotações
        const dotacoesInfo = await this.prisma.dotacaoRealizado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                smae_soma_valor_empenho: true,
                smae_soma_valor_liquidado: true,
                empenho_liquido: true,
                valor_liquidado: true,
                dotacao: true,
            }
        });
        const dotacoesInfoRef: Record<string, typeof dotacoesInfo[0]> = {};
        for (const dotacao of dotacoesInfo) {
            dotacoesInfoRef[dotacao.dotacao] = dotacao;
        }


        const rows: OrcamentoRealizado[] = [];

        for (const orcaRealizado of queryRows) {

            let smae_soma_valor_empenho: string | null = null;
            let smae_soma_valor_liquidado: string | null = null;
            let empenho_liquido: string | null = null;
            let valor_liquidado: string | null = null;

            if (orcaRealizado.nota_empenho) {
                const notaInfo = notasInfoRef[orcaRealizado.nota_empenho];
                smae_soma_valor_empenho = notaInfo.smae_soma_valor_empenho.toFixed(2);
                smae_soma_valor_liquidado = notaInfo.smae_soma_valor_liquidado.toFixed(2);

                empenho_liquido = notaInfo.empenho_liquido.toFixed(2);
                valor_liquidado = notaInfo.valor_liquidado.toFixed(2);
            } else if (orcaRealizado.processo) {
                const processoInfo = processoInfoRef[orcaRealizado.dotacao + '_' + orcaRealizado.processo];
                smae_soma_valor_empenho = processoInfo.smae_soma_valor_empenho.toFixed(2);
                smae_soma_valor_liquidado = processoInfo.smae_soma_valor_liquidado.toFixed(2);

                empenho_liquido = processoInfo.empenho_liquido.toFixed(2);
                valor_liquidado = processoInfo.valor_liquidado.toFixed(2);
            } else {
                const dotacaoInfo = dotacoesInfoRef[orcaRealizado.dotacao];
                smae_soma_valor_empenho = dotacaoInfo.smae_soma_valor_empenho.toFixed(2);
                smae_soma_valor_liquidado = dotacaoInfo.smae_soma_valor_liquidado.toFixed(2);
                empenho_liquido = dotacaoInfo.empenho_liquido.toFixed(2);
                valor_liquidado = dotacaoInfo.valor_liquidado.toFixed(2);
            }

            // só retorna o ano quando for diferente do ano de referencia
            if (orcaRealizado.nota_empenho && orcaRealizado.nota_empenho.includes('/' + orcaRealizado.ano_referencia)) {
                orcaRealizado.nota_empenho = orcaRealizado.nota_empenho.substring(0, 5);
            }

            rows.push({
                id: orcaRealizado.id,
                ano_referencia: orcaRealizado.ano_referencia,
                meta: orcaRealizado.meta,
                iniciativa: orcaRealizado.iniciativa,
                atividade: orcaRealizado.atividade,
                criado_em: orcaRealizado.criado_em,
                criador: orcaRealizado.criador,
                dotacao: orcaRealizado.dotacao,
                nota_empenho: orcaRealizado.nota_empenho,
                processo: orcaRealizado.processo,
                soma_valor_empenho: orcaRealizado.soma_valor_empenho.toFixed(2),
                soma_valor_liquidado: orcaRealizado.soma_valor_liquidado.toFixed(2),
                smae_soma_valor_empenho,
                smae_soma_valor_liquidado,
                empenho_liquido,
                valor_liquidado,
                projeto_atividade: '',
                itens: orcaRealizado.itens.map((item) => {
                    return {
                        ...item,
                        valor_empenho: item.valor_empenho.toFixed(2),
                        valor_liquidado: item.valor_liquidado.toFixed(2),
                    }
                })
            });
        }

        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.count({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoRealizado) throw new HttpException('Orçamento realizado não encontrado', 404);

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const linhasAfetadas = await prismaTxn.orcamentoRealizado.updateMany({
                where: { id: +id, removido_em: null }, // nao apagar duas vezes
                data: { removido_em: now, removido_por: user.id }
            });

            if (linhasAfetadas.count == 1) {
                const orcRealizado = await prismaTxn.orcamentoRealizado.findUniqueOrThrow({ where: { id: +id } });

                if (orcRealizado.nota_empenho) {
                    const notaTx = await prismaTxn.dotacaoProcessoNota.findUnique({
                        where: {
                            ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                                ano_referencia: orcRealizado.ano_referencia,
                                dotacao: orcRealizado.dotacao,
                                dotacao_processo: orcRealizado.processo!,
                                dotacao_processo_nota: orcRealizado.nota_empenho
                            }
                        },
                    });
                    if (!notaTx) throw new HttpException('Nota-Empenho não foi foi encontrado no banco de dados', 400);

                    const smae_soma_valor_empenho = notaTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho;
                    const smae_soma_valor_liquidado = notaTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado;
                    await prismaTxn.dotacaoProcessoNota.update({
                        where: { id: notaTx.id },
                        data: {
                            smae_soma_valor_empenho,
                            smae_soma_valor_liquidado,
                        }
                    });
                } else if (orcRealizado.processo) {
                    const processoTx = await prismaTxn.dotacaoProcesso.findUnique({
                        where: {
                            ano_referencia_dotacao_dotacao_processo: {
                                ano_referencia: orcRealizado.ano_referencia,
                                dotacao: orcRealizado.dotacao,
                                dotacao_processo: orcRealizado.processo,
                            }
                        },
                    });
                    if (!processoTx) throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);

                    const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho;
                    const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado;
                    await prismaTxn.dotacaoProcesso.update({
                        where: { id: processoTx.id },
                        data: {
                            smae_soma_valor_empenho,
                            smae_soma_valor_liquidado,
                        }
                    });
                } else if (orcRealizado.dotacao) {
                    const processoTx = await prismaTxn.dotacaoRealizado.findUnique({
                        where: {
                            ano_referencia_dotacao: {
                                ano_referencia: orcRealizado.ano_referencia,
                                dotacao: orcRealizado.dotacao,
                            }
                        },
                    });
                    if (!processoTx) throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);

                    const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.soma_valor_empenho;
                    const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.soma_valor_liquidado;
                    await prismaTxn.dotacaoRealizado.update({
                        where: { id: processoTx.id },
                        data: {
                            smae_soma_valor_empenho,
                            smae_soma_valor_liquidado,
                        }
                    });
                }
            }
        }, {
            isolationLevel: 'Serializable',
        });

    }


}
