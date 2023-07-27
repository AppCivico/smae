import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateOrcamentoRealizadoDto,
    FilterOrcamentoRealizadoDto,
    UpdateOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizado } from './entities/orcamento-realizado.entity';
import { FormataNotaEmpenho } from '../common/FormataNotaEmpenho';
import { TrataDotacaoGrande } from '../sof-api/sof-api.service';

const FRASE_FIM = ' Revise os valores ou utilize o botão "Validar Via SOF" para atualizar os valores';

type PartialOrcamentoRealizadoDto = {
    ano_referencia: number;
};

const fk_nota = (row: { dotacao: string; dotacao_processo: string; dotacao_processo_nota: string }): string => {
    return row.dotacao + '_' + row.dotacao_processo + '_' + row.dotacao_processo_nota;
};

@Injectable()
export class OrcamentoRealizadoService {
    liberarValoresMaioresQueSof: boolean;
    constructor(private readonly prisma: PrismaService, private readonly orcamentoPlanejado: OrcamentoPlanejadoService, private readonly dotacaoService: DotacaoService) {
        // deixar desligado a verificação
        this.liberarValoresMaioresQueSof = true;
    }

    async create(dto: CreateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(meta_id) == false) {
                throw new HttpException('Sem permissão para criar orçamento na meta', 400);
            }
        }

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, execucao_disponivel: true },
        });
        if (!anoCount)
            throw new HttpException('Ano de referencia não encontrado ou não está com a execução liberada', 400);

        const { dotacao, processo, nota_empenho } = await this.validaDotProcNota(dto);

        console.log({ dotacao, processo, nota_empenho });

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());
                let mes_utilizado: number;

                const soma_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_empenho;
                const soma_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_liquidado;
                const mes_correte = dto.itens.sort((a, b) => b.mes - a.mes)[0].mes;

                if (nota_empenho) {
                    mes_utilizado = await this.atualizaNotaEmpenho(
                        meta.pdm_id,
                        prismaTxn,
                        dotacao,
                        processo,
                        nota_empenho
                    );
                } else if (processo) {
                    mes_utilizado = await this.atualizaProcesso(meta.pdm_id, prismaTxn, dto, dotacao, processo);
                } else if (dotacao) {
                    mes_utilizado = await this.atualizaDotacao(meta.pdm_id, prismaTxn, dto, dotacao);
                } else {
                    throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
                }

                const countExisting = await prismaTxn.orcamentoRealizado.count({
                    where: {
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
                        dotacao,
                        processo: processo,
                        nota_empenho: nota_empenho,
                        removido_em: null,
                        ano_referencia: dto.ano_referencia,
                    },
                });
                if (countExisting) {
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';

                    throw new HttpException(
                        `Já existe um registro com a mesma dotação/processo e/ou nota de empenho associado com a mesma ${categoria}`,
                        400
                    );
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
                                data: dto.itens.map(
                                    (item): Prisma.OrcamentoRealizadoItemCreateManyOrcamentoRealizadoInput => {
                                        return {
                                            valor_empenho: item.valor_empenho,
                                            valor_liquidado: item.valor_liquidado,
                                            mes: item.mes,
                                            data_referencia: new Date([dto.ano_referencia, item.mes, '01'].join('-')),
                                            mes_corrente: item.mes == mes_correte,
                                        };
                                    }
                                ),
                            },
                        },
                    },
                    select: { id: true },
                });

                return orcamentoRealizado;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoRealizado || orcamentoRealizado.meta_id === null)
            throw new HttpException('Orçamento realizado não encontrado', 404);
        console.log(dto);

        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(orcamentoRealizado.meta_id) == false) {
                throw new HttpException('Sem permissão para editar orçamento', 400);
            }
        }

        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: {
                pdm_id: meta.pdm_id,
                ano_referencia: orcamentoRealizado.ano_referencia,
                execucao_disponivel: true,
            },
        });
        if (!anoCount)
            throw new HttpException('Ano de referencia não encontrado ou não está com a execução liberada', 400);

        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const nova_soma_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_empenho;
                const nova_soma_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_liquidado;
                const mes_corrente = dto.itens.sort((a, b) => b.mes - a.mes)[0].mes;

                const orcRealizado = await prismaTxn.orcamentoRealizado.findUniqueOrThrow({ where: { id: +id } });

                const dotacao_edit = TrataDotacaoGrande(orcRealizado.dotacao);
                if (orcRealizado.dotacao != dotacao_edit) {
                    orcRealizado.dotacao = dotacao_edit;
                    await this.prisma.orcamentoRealizado.update({
                        where: { id: orcRealizado.id },
                        data: { dotacao: dotacao_edit },
                    });
                }

                if (orcRealizado.nota_empenho) {
                    await this.atualizaNotaEmpenho(
                        meta.pdm_id,
                        prismaTxn,
                        orcRealizado.dotacao,
                        orcRealizado.processo,
                        orcRealizado.nota_empenho
                    );
                } else if (orcRealizado.processo) {
                    await this.atualizaProcesso(
                        meta.pdm_id,
                        prismaTxn,
                        { ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao,
                        orcRealizado.processo
                    );
                } else if (orcRealizado.dotacao) {
                    await this.atualizaDotacao(
                        meta.pdm_id,
                        prismaTxn,
                        { ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao
                    );
                } else {
                    throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
                }

                await prismaTxn.orcamentoRealizadoItem.updateMany({
                    where: {
                        orcamento_realizado_id: orcRealizado.id,
                    },
                    data: {
                        sobrescrito_em: now,
                        sobrescrito_por: user.id,
                    },
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
                                data: dto.itens.map(
                                    (item): Prisma.OrcamentoRealizadoItemCreateManyOrcamentoRealizadoInput => {
                                        return {
                                            valor_empenho: item.valor_empenho,
                                            valor_liquidado: item.valor_liquidado,
                                            mes: item.mes,
                                            data_referencia: new Date(
                                                [orcRealizado.ano_referencia, item.mes, '01'].join('-')
                                            ),
                                            mes_corrente: item.mes == mes_corrente,
                                        };
                                    }
                                ),
                            },
                        },
                    },
                });

                const countExisting = await prismaTxn.orcamentoRealizado.count({
                    where: {
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
                        dotacao: updated.dotacao,
                        processo: updated.processo,
                        nota_empenho: updated.nota_empenho,
                        id: { not: updated.id },
                        removido_em: null,
                        ano_referencia: updated.ano_referencia,
                    },
                });
                if (countExisting) {
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';

                    throw new HttpException(
                        `Já existe um registro com a mesma dotação/processo e/ou nota de empenho associado com a mesma ${categoria}`,
                        400
                    );
                }

                return updated;
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return updated;
    }

    private async atualizaDotacao(
        pdm_id: number,
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string
    ) {
        console.log({
            func: 'atualizaDotacao',
            dotacao,
        });

        const dotacaoTx = await prismaTxn.dotacaoRealizado.findUnique({
            where: {
                ano_referencia_dotacao: {
                    ano_referencia: dto.ano_referencia,
                    dotacao: dotacao,
                },
            },
        });

        if (!dotacaoTx)
            throw new HttpException(
                'Operação não pode ser realizada no momento. Dotação deixou de existir durante a atualização.',
                400
            );
        const mes_utilizado = dotacaoTx.mes_utilizado;

        await prismaTxn.dotacaoRealizado.update({
            where: { id: dotacaoTx.id },
            data: { id: dotacaoTx.id },
        });

        const novo_valor = await prismaTxn.pdmDotacaoRealizado.findFirst({
            where: {
                ano_referencia: dto.ano_referencia,
                dotacao: dotacao,
                pdm_id: pdm_id,
            },
        });

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(dotacaoTx.empenho_liquido)
        ) {
            throw new HttpException(
                `Novo valor de empenho no SMAE (${novo_valor.soma_valor_empenho.toFixed(
                    2
                )}) seria maior do que o valor de empenho para a Dotação-Processo (${dotacaoTx.empenho_liquido.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(dotacaoTx.valor_liquidado)
        ) {
            throw new HttpException(
                `Novo valor de liquidado no SMAE (${novo_valor.soma_valor_liquidado.toFixed(
                    2
                )}) seria maior do que o valor liquidado para a Dotação-Processo (${dotacaoTx.valor_liquidado.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        return mes_utilizado;
    }

    private async atualizaProcesso(
        pdm_id: number,
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        processo: string
    ) {
        const processoTx = await prismaTxn.dotacaoProcesso.findUnique({
            where: {
                ano_referencia_dotacao_dotacao_processo: {
                    ano_referencia: dto.ano_referencia,
                    dotacao: dotacao,
                    dotacao_processo: processo,
                },
            },
            select: { empenho_liquido: true, valor_liquidado: true, id: true, mes_utilizado: true },
        });
        if (!processoTx)
            throw new HttpException(
                'Operação não pode ser realizada no momento. Nota-Empenho deixou de existir durante a atualização.',
                400
            );
        const mes_utilizado = processoTx.mes_utilizado;

        await prismaTxn.dotacaoProcesso.update({
            where: { id: processoTx.id },
            data: { id: processoTx.id },
        });

        const novo_valor = await prismaTxn.pdmDotacaoProcesso.findFirst({
            where: {
                ano_referencia: dto.ano_referencia,
                dotacao: dotacao,
                dotacao_processo: processo,
                pdm_id: pdm_id,
            },
        });

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(processoTx.empenho_liquido)
        ) {
            throw new HttpException(
                `Novo valor de empenho no SMAE (${novo_valor.soma_valor_empenho.toFixed(
                    2
                )}) seria maior do que o valor de empenho para a Dotação-Processo (${processoTx.empenho_liquido.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(processoTx.valor_liquidado)
        ) {
            throw new HttpException(
                `Novo valor de liquidado no SMAE (${novo_valor.soma_valor_liquidado.toFixed(
                    2
                )}) seria maior do que o valor liquidado para a Dotação-Processo (${processoTx.valor_liquidado.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        return mes_utilizado;
    }

    private getAnoNota(nota_empenho: string): number {
        return +nota_empenho.split('/')[1];
    }

    private async atualizaNotaEmpenho(
        pdm_id: number,
        prismaTxn: Prisma.TransactionClient,
        dotacao: string,
        processo: string | null,
        nota_empenho: string
    ) {
        const notaEmpenhoTx = await prismaTxn.dotacaoProcessoNota.findUnique({
            where: {
                ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                    // no serviço dotacao-processo-nota.service.ts é chamado com o ano da nota e não
                    // realmente o ano da referencia
                    // se for pra valores de consumo diferente pra mesma nota, então será necessário
                    // alterar o frontend e também a validação na função valorRealizadoNotaEmpenho
                    // vai deixar de existir
                    ano_referencia: this.getAnoNota(nota_empenho),
                    dotacao: dotacao,
                    dotacao_processo: processo!,
                    dotacao_processo_nota: nota_empenho,
                },
            },
            select: { empenho_liquido: true, valor_liquidado: true, id: true, mes_utilizado: true },
        });
        if (!notaEmpenhoTx)
            throw new HttpException(
                'Operação não pode ser realizada no momento. Nota-Empenho deixou de existir durante a atualização.',
                400
            );
        const mes_utilizado = notaEmpenhoTx.mes_utilizado;

        await prismaTxn.dotacaoProcessoNota.update({
            where: { id: notaEmpenhoTx.id },
            data: { id: notaEmpenhoTx.id },
        });

        const novo_valor = await prismaTxn.pdmDotacaoProcessoNota.findFirst({
            where: {
                ano_referencia: this.getAnoNota(nota_empenho),
                dotacao: dotacao,
                dotacao_processo: processo!,
                dotacao_processo_nota: nota_empenho,
                pdm_id: pdm_id,
            },
        });

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(notaEmpenhoTx.empenho_liquido)
        ) {
            throw new HttpException(
                `Novo valor de empenho no SMAE (${novo_valor.soma_valor_empenho.toFixed(
                    2
                )}) seria maior do que o valor de empenho para a Nota-Empenho (${notaEmpenhoTx.empenho_liquido.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        if (
            novo_valor &&
            this.liberarValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(notaEmpenhoTx.valor_liquidado)
        ) {
            throw new HttpException(
                `Novo valor de liquidado no SMAE (${novo_valor.soma_valor_liquidado.toFixed(
                    2
                )}) seria maior do que o valor liquidado para a Nota-Empenho (${notaEmpenhoTx.valor_liquidado.toFixed(
                    2
                )}).` + FRASE_FIM,
                400
            );
        }

        return mes_utilizado;
    }

    async validaDotProcNota(
        dto: CreateOrcamentoRealizadoDto
    ): Promise<{ dotacao: string; processo: string | null; nota_empenho: string | null }> {
        const dotacao: string = dto.dotacao;
        let processo: string | null = null;
        let nota_empenho: string | null = null;

        nota_empenho = dto.nota_empenho ? FormataNotaEmpenho(dto.nota_empenho) : null;
        processo = dto.processo ? dto.processo.replace(/[^0-9]/g, '') : null;

        // se é por nota_empenho, os testes sobre o uso de limite serão apenas sobre a nota-empenho
        // da mesma forma, se for pro processo, os testes de limite serão apenas sobre o processo
        // a dotação *não* acumula a liquidação/empenho dos registro registrados no processo/nota-empenho
        // pelo menos não na versão do dia 06/12/2022!

        if (nota_empenho) {
            if (!processo) throw new HttpException('Necessário enviar Processo ao enviar Nota Empenho', 400);

            if (!dto.nota_ano && nota_empenho.includes('/')) dto.nota_ano = nota_empenho.split('/')[1];

            if (!dto.nota_ano) throw new HttpException('Faltando enviar o Ano Referencia da Nota de Empenho', 400);

            const notaDb = await this.prisma.dotacaoProcessoNota.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                        ano_referencia: +dto.nota_ano,
                        dotacao: dto.dotacao,
                        dotacao_processo: processo,
                        dotacao_processo_nota: nota_empenho,
                    },
                },
            });
            if (!notaDb) throw new HttpException('Nota de Empenho não foi encontrada no banco de dados', 400);
        } else if (processo) {
            const processoDb = await this.prisma.dotacaoProcesso.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo: {
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                        dotacao_processo: processo,
                    },
                },
            });
            if (!processoDb) throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);
        } else {
            const dotacaoDb = await this.prisma.dotacaoRealizado.findUnique({
                where: {
                    ano_referencia_dotacao: {
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                    },
                },
            });
            if (!dotacaoDb) throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);
        }

        return {
            dotacao,
            processo,
            nota_empenho,
        };
    }

    async findAll(filters: FilterOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<OrcamentoRealizado[]> {
        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
        }

        const meta = await this.prisma.meta.findFirst({
            where: { id: filters.meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });
        if (meta === null) throw new HttpException('404', 404);

        const queryRows = await this.prisma.orcamentoRealizado.findMany({
            where: {
                removido_em: null,
                dotacao: filters.dotacao,
                AND: [{ meta_id: filters.meta_id }, { meta_id: filterIdIn ? { in: filterIdIn } : undefined }],
                processo: filters.processo,
                nota_empenho: filters.nota_empenho,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
                iniciativa_id: filters.iniciativa_id,
                atividade_id: filters.atividade_id,
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
                        sobrescrito_por: null,
                    },
                },
            },
            orderBy: [{ meta_id: 'asc' }, { iniciativa_id: 'asc' }, { atividade_id: 'asc' }, { id: 'asc' }],
        });

        const notaEncontradas: Record<string, boolean> = {};
        const anoNotas: Record<string, boolean> = {};
        const notaEncontradasSemAno: Record<string, boolean> = {};

        const processosEncontrados: Record<string, boolean> = {};
        const dotacoesEncontradas: Record<string, boolean> = {};
        // levantando os dados para o 'poor's mans join'
        for (const op of queryRows) {
            if (op.nota_empenho) {
                const notaAno = op.nota_empenho.split('/');
                if (notaEncontradas[op.dotacao] == undefined) notaEncontradas[op.nota_empenho] = true;
                if (notaEncontradasSemAno[notaAno[0]] == undefined) notaEncontradasSemAno[notaAno[0]] = true;
                if (anoNotas[notaAno[1]] == undefined) anoNotas[notaAno[1]] = true;
            } else if (op.processo) {
                if (processosEncontrados[op.dotacao] == undefined) processosEncontrados[op.processo] = true;
            } else {
                if (dotacoesEncontradas[op.dotacao] == undefined) dotacoesEncontradas[op.dotacao] = true;
            }
        }

        // cruza as nota-empenho
        const notasSomaInfo = await this.prisma.pdmDotacaoProcessoNota.findMany({
            where: {
                dotacao_processo_nota: { in: Object.keys(notaEncontradas) },
                ano_referencia: filters.ano_referencia,
                pdm_id: meta.pdm_id,
            },
            select: {
                soma_valor_empenho: true,
                soma_valor_liquidado: true,
                dotacao: true,
                dotacao_processo: true,
                dotacao_processo_nota: true,
            },
        });
        const notasInfoSomaRef: Record<string, (typeof notasSomaInfo)[0]> = {};
        for (const nota of notasSomaInfo) {
            notasInfoSomaRef[fk_nota(nota)] = nota;
        }
        const notasInfo = await this.prisma.dotacaoProcessoNota.findMany({
            where: {
                OR: Object.keys(notaEncontradasSemAno).map((nota_prefixo: string) => {
                    return { dotacao_processo_nota: { startsWith: nota_prefixo } };
                }),
                ano_referencia: { in: Object.keys(anoNotas).map((ano) => +ano) },
            },
            select: {
                dotacao: true,
                dotacao_processo: true,
                dotacao_processo_nota: true,
                empenho_liquido: true,
                valor_liquidado: true,
            },
        });
        const notasInfoRef: Record<string, (typeof notasInfo)[0]> = {};
        for (const nota of notasInfo) {
            notasInfoRef[fk_nota(nota)] = nota;
        }

        // cruza os processos
        const processoSomaInfo = await this.prisma.pdmDotacaoProcesso.findMany({
            where: {
                dotacao_processo: { in: Object.keys(processosEncontrados) },
                ano_referencia: filters.ano_referencia,
                pdm_id: meta.pdm_id,
            },
            select: {
                soma_valor_empenho: true,
                soma_valor_liquidado: true,
                dotacao_processo: true,
                dotacao: true,
            },
        });
        const processoInfoSomaRef: Record<string, (typeof processoSomaInfo)[0]> = {};
        for (const processo of processoSomaInfo) {
            processoInfoSomaRef[processo.dotacao + '_' + processo.dotacao_processo] = processo;
        }
        const processoInfo = await this.prisma.dotacaoProcesso.findMany({
            where: {
                dotacao_processo: { in: Object.keys(processosEncontrados) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                dotacao_processo: true,
                dotacao: true,
                empenho_liquido: true,
                valor_liquidado: true,
            },
        });
        const processoInfoRef: Record<string, (typeof processoInfo)[0]> = {};
        for (const processo of processoInfo) {
            processoInfoRef[processo.dotacao + '_' + processo.dotacao_processo] = processo;
        }

        // cruza as dotações
        const dotacoesSomaInfo = await this.prisma.pdmDotacaoRealizado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
                pdm_id: meta.pdm_id,
            },
            select: {
                soma_valor_empenho: true,
                soma_valor_liquidado: true,

                dotacao: true,
            },
        });
        const dotacoesSomaInfoRef: Record<string, (typeof dotacoesSomaInfo)[0]> = {};
        for (const dotacao of dotacoesSomaInfo) {
            dotacoesSomaInfoRef[dotacao.dotacao] = dotacao;
        }
        const dotacoesInfo = await this.prisma.dotacaoRealizado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                empenho_liquido: true,
                valor_liquidado: true,
                dotacao: true,
            },
        });
        const dotacoesInfoRef: Record<string, (typeof dotacoesInfo)[0]> = {};
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
                const notaInfo =
                    notasInfoRef[
                        fk_nota({
                            dotacao: orcaRealizado.dotacao,
                            dotacao_processo: orcaRealizado.processo!,
                            dotacao_processo_nota: orcaRealizado.nota_empenho,
                        })
                    ];
                const notaSomaInfo =
                    notasInfoSomaRef[
                        fk_nota({
                            dotacao: orcaRealizado.dotacao,
                            dotacao_processo: orcaRealizado.processo!,
                            dotacao_processo_nota: orcaRealizado.nota_empenho,
                        })
                    ];

                smae_soma_valor_empenho = notaSomaInfo?.soma_valor_empenho.toFixed(2) ?? '0.00';
                smae_soma_valor_liquidado = notaSomaInfo?.soma_valor_liquidado.toFixed(2) ?? '0.00';
                if (notaInfo) {
                    empenho_liquido = notaInfo.empenho_liquido.toFixed(2);
                    valor_liquidado = notaInfo.valor_liquidado.toFixed(2);
                }
            } else if (
                orcaRealizado.processo &&
                processoInfoRef[orcaRealizado.dotacao + '_' + orcaRealizado.processo]
            ) {
                const processoInfo = processoInfoRef[orcaRealizado.dotacao + '_' + orcaRealizado.processo];
                const processoSomaInfo = processoInfoSomaRef[orcaRealizado.dotacao + '_' + orcaRealizado.processo];

                smae_soma_valor_empenho = processoSomaInfo?.soma_valor_empenho.toFixed(2) ?? '0.00';
                smae_soma_valor_liquidado = processoSomaInfo?.soma_valor_liquidado.toFixed(2) ?? '0.00';

                empenho_liquido = processoInfo.empenho_liquido.toFixed(2);
                valor_liquidado = processoInfo.valor_liquidado.toFixed(2);
            } else if (dotacoesInfoRef[orcaRealizado.dotacao]) {
                const dotacaoInfo = dotacoesInfoRef[orcaRealizado.dotacao];
                const dotacaoSomaInfo = dotacoesSomaInfoRef[orcaRealizado.dotacao];

                smae_soma_valor_empenho = dotacaoSomaInfo?.soma_valor_empenho.toFixed(2) ?? '0.00';
                smae_soma_valor_liquidado = dotacaoSomaInfo?.soma_valor_liquidado.toFixed(2) ?? '0.00';

                empenho_liquido = dotacaoInfo.empenho_liquido.toFixed(2);
                valor_liquidado = dotacaoInfo.valor_liquidado.toFixed(2);
            }

            // só retorna o ano quando for diferente do ano de referencia
            if (orcaRealizado.nota_empenho && orcaRealizado.nota_empenho.includes('/' + orcaRealizado.ano_referencia)) {
                orcaRealizado.nota_empenho = orcaRealizado.nota_empenho.substring(0, 5);
            }

            const orc_config = await this.prisma.pdmOrcamentoConfig.findFirst({
                where: { pdm_id: meta.pdm_id, ano_referencia: filters.ano_referencia },
                select: { execucao_disponivel_meses: true },
            });

            rows.push({
                id: orcaRealizado.id,
                ano_referencia: orcaRealizado.ano_referencia,
                meta: orcaRealizado.meta!,
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
                execucao_disponivel_meses: orc_config?.execucao_disponivel_meses ?? [],
                itens: orcaRealizado.itens.map((item) => {
                    return {
                        ...item,
                        valor_empenho: item.valor_empenho.toFixed(2),
                        valor_liquidado: item.valor_liquidado.toFixed(2),
                    };
                }),
            });
        }

        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoRealizado || orcamentoRealizado.meta_id === null)
            throw new HttpException('Orçamento realizado não encontrado', 404);

        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(orcamentoRealizado.meta_id) == false) {
                throw new HttpException('Sem permissão para remover orçamento', 400);
            }
        }

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const linhasAfetadas = await prismaTxn.orcamentoRealizado.updateMany({
                    where: { id: +id, removido_em: null }, // nao apagar duas vezes
                    data: { removido_em: now, removido_por: user.id },
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
                                    dotacao_processo_nota: orcRealizado.nota_empenho,
                                },
                            },
                        });
                        if (!notaTx)
                            throw new HttpException('Nota-Empenho não foi foi encontrado no banco de dados', 400);

                        await prismaTxn.dotacaoProcessoNota.update({
                            where: { id: notaTx.id },
                            data: { id: notaTx.id },
                        });
                    } else if (orcRealizado.processo) {
                        const processoTx = await prismaTxn.dotacaoProcesso.findUnique({
                            where: {
                                ano_referencia_dotacao_dotacao_processo: {
                                    ano_referencia: orcRealizado.ano_referencia,
                                    dotacao: orcRealizado.dotacao,
                                    dotacao_processo: orcRealizado.processo,
                                },
                            },
                        });
                        if (!processoTx)
                            throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);

                        await prismaTxn.dotacaoProcesso.update({
                            where: { id: processoTx.id },
                            data: { id: processoTx.id },
                        });
                    } else if (orcRealizado.dotacao) {
                        const processoTx = await prismaTxn.dotacaoRealizado.findUnique({
                            where: {
                                ano_referencia_dotacao: {
                                    ano_referencia: orcRealizado.ano_referencia,
                                    dotacao: orcRealizado.dotacao,
                                },
                            },
                        });
                        if (!processoTx)
                            throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);

                        await prismaTxn.dotacaoRealizado.update({
                            where: { id: processoTx.id },
                            data: { id: processoTx.id },
                        });
                    }
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }
}
