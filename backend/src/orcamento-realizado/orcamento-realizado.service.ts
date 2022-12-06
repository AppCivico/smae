import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HTTPError } from 'got/dist/source';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoRealizadoDto } from './dto/create-orcamento-realizado.dto';

@Injectable()
export class OrcamentoRealizadoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
    ) { }

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

            if (nota_empenho) {
                mes_utilizado = await this.atualizaNotaEmpenho(prismaTxn, dto, dotacao, processo, nota_empenho);
            } else if (processo) {
                mes_utilizado = await this.atualizaProcesso(prismaTxn, dto, dotacao, processo);
            } else if (dotacao) {
                mes_utilizado = await this.atualizaDotacao(prismaTxn, dto, dotacao);
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
                    valor_empenho: dto.valor_empenho,
                    valor_liquidado: dto.valor_liquidado,
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

    private async atualizaDotacao(prismaTxn: Prisma.TransactionClient, dto: CreateOrcamentoRealizadoDto, dotacao: string) {
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

        const novaSomaEmpenho = dotacaoTx.smae_soma_valor_empenho + dto.valor_empenho;
        const novaSomaLiquido = dotacaoTx.smae_soma_valor_liquidado + dto.valor_liquidado;

        if (Math.round(novaSomaEmpenho * 100) > Math.round(dotacaoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaEmpenho.toFixed(2)} seria maior do que o valor de empenho para a Dotação ${dotacaoTx.empenho_liquido.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
        }

        if (Math.round(novaSomaLiquido * 100) > Math.round(dotacaoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaLiquido.toFixed(2)} seria maior do que o valor de empenho para a Dotação ${dotacaoTx.valor_liquidado.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
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

    private async atualizaProcesso(prismaTxn: Prisma.TransactionClient, dto: CreateOrcamentoRealizadoDto, dotacao: string, processo: string) {
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

        const novaSomaEmpenho = processoTx.smae_soma_valor_empenho + dto.valor_empenho;
        const novaSomaLiquido = processoTx.smae_soma_valor_liquidado + dto.valor_liquidado;

        if (Math.round(novaSomaEmpenho * 100) > Math.round(processoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaEmpenho.toFixed(2)} seria maior do que o valor de empenho para o Processo ${processoTx.empenho_liquido.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
        }

        if (Math.round(novaSomaLiquido * 100) > Math.round(processoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaLiquido.toFixed(2)} seria maior do que o valor de empenho para o Processo ${processoTx.valor_liquidado.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
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

    private async atualizaNotaEmpenho(prismaTxn: Prisma.TransactionClient, dto: CreateOrcamentoRealizadoDto, dotacao: string, processo: string | null, nota_empenho: string) {
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

        const novaSomaEmpenho = notaEmpenhoTx.smae_soma_valor_empenho + dto.valor_empenho;
        const novaSomaLiquido = notaEmpenhoTx.smae_soma_valor_liquidado + dto.valor_liquidado;

        if (Math.round(novaSomaEmpenho * 100) > Math.round(notaEmpenhoTx.empenho_liquido * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaEmpenho.toFixed(2)} seria maior do que o valor de empenho para a Nota-Empenho ${notaEmpenhoTx.empenho_liquido.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
        }

        if (Math.round(novaSomaLiquido * 100) > Math.round(notaEmpenhoTx.valor_liquidado * 100)) {
            throw new HttpException(`Novo valor de empenho no SMAE ${novaSomaLiquido.toFixed(2)} seria maior do que o valor de empenho para a Nota-Empenho ${notaEmpenhoTx.valor_liquidado.toFixed(2)}.` +
                'Revise os valores ou utilize o botão "Validar" para atualizar os valores', 400);
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

                    const smae_soma_valor_empenho = notaTx.smae_soma_valor_empenho - orcRealizado.valor_empenho;
                    const smae_soma_valor_liquidado = notaTx.smae_soma_valor_liquidado - orcRealizado.valor_liquidado;
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

                    const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.valor_empenho;
                    const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.valor_liquidado;
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

                    const smae_soma_valor_empenho = processoTx.smae_soma_valor_empenho - orcRealizado.valor_empenho;
                    const smae_soma_valor_liquidado = processoTx.smae_soma_valor_liquidado - orcRealizado.valor_liquidado;
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
