import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FormataNotaEmpenho } from '../../common/FormataNotaEmpenho';
import { BatchRecordWithId, RecordWithId } from '../../common/dto/record-with-id.dto';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExtraiComplementoDotacao, TrataDotacaoGrande } from '../../sof-api/sof-api.service';
import { ProjetoMVPDto } from '../projeto/entities/projeto.entity';
import {
    CreatePPOrcamentoRealizadoDto,
    FilterPPOrcamentoRealizadoDto,
    UpdatePPOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { PPOrcamentoRealizado } from './entities/orcamento-realizado.entity';
import {
    DivPerc2Decimal,
    DoubleCheckException,
    FRASE_ERRO_EMPENHO,
    FRASE_ERRO_LIQUIDADO,
    LIBERAR_LIQUIDADO_VALORES_MAIORES_QUE_SOF,
    verificaValorLiqEmpenhoMaiorEmp,
} from '../../orcamento-realizado/orcamento-realizado.service';
import { Decimal } from '@prisma/client/runtime/library';
import { SmaeConfigService } from 'src/common/services/smae-config.service';

type PartialOrcamentoRealizadoDto = {
    ano_referencia: number;
};

const fk_nota = (row: { dotacao: string; dotacao_processo: string; dotacao_processo_nota: string }): string => {
    return row.dotacao + '_' + row.dotacao_processo + '_' + row.dotacao_processo_nota;
};

@Injectable()
export class OrcamentoRealizadoService {
    liberarEmpenhoValoresMaioresQueSof: boolean;
    liberarLiquidadoValoresMaioresQueSof: boolean;
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService,
        private readonly smaeConfigService: SmaeConfigService
    ) {
        // deixar ligado a verificação
        this.liberarEmpenhoValoresMaioresQueSof = false;
        this.liberarLiquidadoValoresMaioresQueSof = LIBERAR_LIQUIDADO_VALORES_MAIORES_QUE_SOF;
    }

    async create(
        tipo: TipoProjeto,
        projeto: ProjetoMVPDto,
        dto: CreatePPOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const portfolio = await this.prisma.portfolio.findFirstOrThrow({
            where: { id: projeto.portfolio_id, tipo_projeto: tipo },
            select: { modelo_clonagem: true },
        });
        if (portfolio.modelo_clonagem)
            throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

        const dotacao_complemento = ExtraiComplementoDotacao(dto);
        console.log(
            'create orcamento pp ExtraiComplementoDotacaoExtraiComplementoDotacaoExtraiComplementoDotacaoExtraiComplementoDotacao',
            dto,
            dotacao_complemento
        );
        dto.dotacao = TrataDotacaoGrande(dto.dotacao);

        const { dotacao, processo, nota_empenho } = await this.validaDotProcNota(dto);

        let soma_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_empenho;
        let soma_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_liquidado;
        const perc_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_empenho;
        const perc_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_liquidado;
        const mes_correte = dto.itens.sort((a, b) => b.mes - a.mes)[0].mes;

        if (soma_valor_empenho != null && soma_valor_liquidado != null)
            verificaValorLiqEmpenhoMaiorEmp(soma_valor_empenho, soma_valor_liquidado);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());
                let mes_utilizado: number;

                let dot_empenho_liquido: Decimal;
                let dot_valor_liquidado: Decimal;

                if (nota_empenho) {
                    const notaEmpenhoTx = await this.buscaNotaEmpenho(prismaTxn, nota_empenho, dotacao, processo);
                    mes_utilizado = notaEmpenhoTx.mes_utilizado;
                    dot_empenho_liquido = notaEmpenhoTx.empenho_liquido;
                    dot_valor_liquidado = notaEmpenhoTx.valor_liquidado;
                } else if (processo) {
                    const processoTx = await this.buscaProcesso(prismaTxn, dto, dotacao, processo);
                    mes_utilizado = processoTx.mes_utilizado;
                    dot_empenho_liquido = processoTx.empenho_liquido;
                    dot_valor_liquidado = processoTx.valor_liquidado;
                } else if (dotacao) {
                    const dotacaoTx = await this.buscaDotacao(prismaTxn, dto, dotacao);
                    mes_utilizado = dotacaoTx.mes_utilizado;
                    dot_empenho_liquido = dotacaoTx.empenho_liquido;
                    dot_valor_liquidado = dotacaoTx.valor_liquidado;
                } else {
                    throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
                }

                if (perc_valor_empenho && soma_valor_empenho == null) {
                    // importação do excel, calcula sozinho
                    soma_valor_empenho = DivPerc2Decimal(dot_empenho_liquido, perc_valor_empenho);
                } else if (perc_valor_empenho && soma_valor_empenho) {
                    // importação web ou api, se receber o campo, confere o valor
                    const check_soma_valor_empenho = DivPerc2Decimal(dot_empenho_liquido, perc_valor_empenho);
                    DoubleCheckException(
                        'de empenho',
                        check_soma_valor_empenho,
                        soma_valor_empenho,
                        perc_valor_empenho
                    );
                }

                if (perc_valor_liquidado && soma_valor_liquidado == null) {
                    // importação do excel, calcula sozinho
                    soma_valor_liquidado = DivPerc2Decimal(dot_valor_liquidado, perc_valor_liquidado);
                } else if (perc_valor_liquidado && soma_valor_liquidado) {
                    // importação web ou api, se receber o campo, confere o valor
                    const check_soma_valor_liquidado = DivPerc2Decimal(dot_valor_liquidado, perc_valor_liquidado);
                    DoubleCheckException(
                        'do liquidado',
                        check_soma_valor_liquidado,
                        soma_valor_liquidado,
                        perc_valor_liquidado
                    );
                }
                if (soma_valor_empenho == null || soma_valor_liquidado == null)
                    throw new BadRequestException('soma_valor_empenho ou soma_valor_liquidado estão nulo');

                // double check, apos a conta
                verificaValorLiqEmpenhoMaiorEmp(soma_valor_empenho, soma_valor_liquidado);

                const countExisting = await prismaTxn.orcamentoRealizado.count({
                    where: {
                        projeto_id: projeto.id,
                        dotacao,
                        dotacao_complemento,
                        processo,
                        nota_empenho,
                        removido_em: null,
                        ano_referencia: dto.ano_referencia,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação/processo e/ou nota de empenho associado no projeto.`,
                        400
                    );
                }

                const orcamentoRealizado = await prismaTxn.orcamentoRealizado.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        projeto_id: projeto.id,
                        mes_utilizado: mes_utilizado,
                        ano_referencia: dto.ano_referencia,
                        dotacao,
                        dotacao_complemento,
                        processo: processo,
                        nota_empenho: nota_empenho,
                        soma_valor_empenho,
                        soma_valor_liquidado,
                        itens: {
                            createMany: {
                                data: dto.itens.map(
                                    (item): Prisma.OrcamentoRealizadoItemCreateManyOrcamentoRealizadoInput => {
                                        if (item.percentual_empenho && item.valor_empenho == null) {
                                            // importação do excel, calcula sozinho
                                            item.valor_empenho = DivPerc2Decimal(
                                                dot_empenho_liquido,
                                                item.percentual_empenho
                                            );
                                        }
                                        if (item.percentual_liquidado && item.valor_liquidado == null) {
                                            // importação do excel, calcula sozinho
                                            item.valor_liquidado = DivPerc2Decimal(
                                                dot_valor_liquidado,
                                                item.percentual_liquidado
                                            );
                                        }

                                        if (item.valor_empenho == null || item.valor_empenho == undefined)
                                            throw new BadRequestException(
                                                `Faltando valor_empenho para mês ${item.mes}`
                                            );
                                        if (item.valor_liquidado == null || item.valor_liquidado == undefined)
                                            throw new BadRequestException(
                                                `Faltando valor_liquidado para mês ${item.mes}`
                                            );

                                        return {
                                            valor_empenho: item.valor_empenho,
                                            valor_liquidado: item.valor_liquidado,
                                            percentual_empenho: item.percentual_empenho,
                                            percentual_liquidado: item.percentual_liquidado,
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

                // chama após o update, vai disparar o erro se ultrapassar o limite
                if (nota_empenho) {
                    await this.verificaNotaEmpenho(projeto.portfolio_id, prismaTxn, dotacao, processo, nota_empenho);
                } else if (processo) {
                    await this.verificaProcesso(projeto.portfolio_id, prismaTxn, dto, dotacao, processo);
                } else if (dotacao) {
                    await this.verificaDotacao(projeto.portfolio_id, prismaTxn, dto, dotacao);
                }

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

    async update(
        tipo: TipoProjeto,
        projeto: ProjetoMVPDto,
        id: number,
        dto: UpdatePPOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: {
                id: +id,
                removido_em: null,
                projeto_id: projeto.id,
                projeto: { tipo, id: projeto.id },
            },
        });
        if (!orcamentoRealizado) throw new HttpException('Orçamento realizado não encontrado', 404);

        let nova_soma_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_empenho;
        let nova_soma_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_liquidado;
        const nova_perc_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_empenho;
        const nova_perc_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_liquidado;

        const mes_corrente = dto.itens.sort((a, b) => b.mes - a.mes)[0].mes;
        if (nova_soma_valor_empenho != null && nova_soma_valor_liquidado != null)
            verificaValorLiqEmpenhoMaiorEmp(nova_soma_valor_empenho, nova_soma_valor_liquidado);

        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                // trata um caso legacy onde a dotação no banco estava salva completa num campo só
                const dotacao_edit = TrataDotacaoGrande(orcamentoRealizado.dotacao);
                if (orcamentoRealizado.dotacao != dotacao_edit) {
                    orcamentoRealizado.dotacao = dotacao_edit;
                    await this.prisma.orcamentoRealizado.update({
                        where: { id: orcamentoRealizado.id },
                        data: { dotacao: dotacao_edit },
                    });
                }

                let dot_empenho_liquido: Decimal;
                let dot_valor_liquidado: Decimal;

                const orcRealizado = await prismaTxn.orcamentoRealizado.findUniqueOrThrow({ where: { id: +id } });

                if (orcRealizado.nota_empenho) {
                    const notaEmpenhoTx = await this.buscaNotaEmpenho(
                        prismaTxn,
                        orcRealizado.nota_empenho,
                        orcRealizado.dotacao,
                        orcRealizado.processo
                    );

                    dot_empenho_liquido = notaEmpenhoTx.empenho_liquido;
                    dot_valor_liquidado = notaEmpenhoTx.valor_liquidado;
                } else if (orcRealizado.processo) {
                    const processoTx = await this.buscaProcesso(
                        prismaTxn,
                        { ...dto, ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao,
                        orcRealizado.processo
                    );

                    dot_empenho_liquido = processoTx.empenho_liquido;
                    dot_valor_liquidado = processoTx.valor_liquidado;
                } else if (orcRealizado.dotacao) {
                    const dotacaoTx = await this.buscaDotacao(
                        prismaTxn,
                        { ...dto, ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao
                    );

                    dot_empenho_liquido = dotacaoTx.empenho_liquido;
                    dot_valor_liquidado = dotacaoTx.valor_liquidado;
                } else {
                    throw new HttpException('Erro interno: nota, processo ou dotação está null', 500);
                }

                if (nova_perc_valor_empenho && nova_soma_valor_empenho == null) {
                    // importação do excel, calcula sozinho
                    nova_soma_valor_empenho = DivPerc2Decimal(dot_empenho_liquido, nova_perc_valor_empenho);
                } else if (nova_perc_valor_empenho && nova_soma_valor_empenho) {
                    // importação web ou api, se receber o campo, confere o valor
                    const check_soma_valor_empenho = DivPerc2Decimal(dot_empenho_liquido, nova_perc_valor_empenho);
                    DoubleCheckException(
                        'de empenho',
                        check_soma_valor_empenho,
                        nova_soma_valor_empenho,
                        nova_perc_valor_empenho
                    );
                }

                if (nova_perc_valor_liquidado && nova_soma_valor_liquidado == null) {
                    // importação do excel, calcula sozinho
                    nova_soma_valor_liquidado = DivPerc2Decimal(dot_valor_liquidado, nova_perc_valor_liquidado);
                } else if (nova_perc_valor_liquidado && nova_soma_valor_liquidado) {
                    // importação web ou api, se receber o campo, confere o valor
                    const check_soma_valor_liquidado = DivPerc2Decimal(dot_valor_liquidado, nova_perc_valor_liquidado);
                    DoubleCheckException(
                        'do liquidado',
                        check_soma_valor_liquidado,
                        nova_soma_valor_liquidado,
                        nova_perc_valor_liquidado
                    );
                }

                if (nova_soma_valor_empenho == null || nova_soma_valor_liquidado == null)
                    throw new BadRequestException('soma_valor_empenho ou soma_valor_liquidado estão nulo');

                verificaValorLiqEmpenhoMaiorEmp(nova_soma_valor_empenho, nova_soma_valor_liquidado);

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
                        soma_valor_empenho: nova_soma_valor_empenho,
                        soma_valor_liquidado: nova_soma_valor_liquidado,
                        itens: {
                            createMany: {
                                data: dto.itens.map(
                                    (item): Prisma.OrcamentoRealizadoItemCreateManyOrcamentoRealizadoInput => {
                                        if (item.percentual_empenho && item.valor_empenho == null) {
                                            // importação do excel, calcula sozinho
                                            item.valor_empenho = DivPerc2Decimal(
                                                dot_empenho_liquido,
                                                item.percentual_empenho
                                            );
                                        }
                                        if (item.percentual_liquidado && item.valor_liquidado == null) {
                                            // importação do excel, calcula sozinho
                                            item.valor_liquidado = DivPerc2Decimal(
                                                dot_valor_liquidado,
                                                item.percentual_liquidado
                                            );
                                        }

                                        if (item.valor_empenho == null || item.valor_empenho == undefined)
                                            throw new BadRequestException(
                                                `Faltando valor_empenho para mês ${item.mes}`
                                            );
                                        if (item.valor_liquidado == null || item.valor_liquidado == undefined)
                                            throw new BadRequestException(
                                                `Faltando valor_liquidado para mês ${item.mes}`
                                            );
                                        return {
                                            valor_empenho: item.valor_empenho,
                                            valor_liquidado: item.valor_liquidado,
                                            percentual_empenho: item.percentual_empenho,
                                            percentual_liquidado: item.percentual_liquidado,
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
                        projeto_id: projeto.id,
                        dotacao: updated.dotacao,
                        dotacao_complemento: updated.dotacao_complemento,
                        processo: updated.processo,
                        nota_empenho: updated.nota_empenho,
                        id: { not: updated.id },
                        removido_em: null,
                        ano_referencia: updated.ano_referencia,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um outro registro com a mesma dotação/processo e/ou nota de empenho associado no projeto.`,
                        400
                    );
                }

                console.log('this.liberarValoresMaioresQueSof', this.liberarEmpenhoValoresMaioresQueSof);
                // chama após o update, vai disparar o erro se ultrapassar o limite
                if (orcRealizado.nota_empenho) {
                    await this.verificaNotaEmpenho(
                        projeto.portfolio_id,
                        prismaTxn,
                        orcRealizado.dotacao,
                        orcRealizado.processo,
                        orcRealizado.nota_empenho
                    );
                } else if (orcRealizado.processo) {
                    await this.verificaProcesso(
                        projeto.portfolio_id,
                        prismaTxn,
                        { ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao,
                        orcRealizado.processo
                    );
                } else if (orcRealizado.dotacao) {
                    await this.verificaDotacao(
                        projeto.portfolio_id,
                        prismaTxn,
                        { ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao
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

    private async verificaDotacao(
        portfolio_id: number,
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string
    ) {
        console.log({
            func: 'atualizaDotacao',
            dotacao,
        });

        const dotacaoTx = await this.buscaDotacao(prismaTxn, dto, dotacao);
        const mes_utilizado = dotacaoTx.mes_utilizado;

        await prismaTxn.dotacaoRealizado.update({
            where: { id: dotacaoTx.id },
            data: { id: dotacaoTx.id },
        });

        const novo_valor = await prismaTxn.portfolioDotacaoRealizado.findFirst({
            where: {
                ano_referencia: dto.ano_referencia,
                dotacao: dotacao,
                portfolio_id: portfolio_id,
            },
        });

        if (
            novo_valor &&
            this.liberarEmpenhoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(dotacaoTx.empenho_liquido)
        ) {
            throw new HttpException(FRASE_ERRO_EMPENHO, 400);
        }

        if (
            novo_valor &&
            this.liberarLiquidadoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(dotacaoTx.valor_liquidado)
        ) {
            throw new HttpException(FRASE_ERRO_LIQUIDADO, 400);
        }

        return mes_utilizado;
    }

    private async buscaDotacao(
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string
    ) {
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
        return dotacaoTx;
    }

    private async verificaProcesso(
        portfolio_id: number,
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        processo: string
    ) {
        console.log('buscaProcesso', dto, dotacao, processo);
        const processoTx = await this.buscaProcesso(prismaTxn, dto, dotacao, processo);
        console.log(processoTx);
        const mes_utilizado = processoTx.mes_utilizado;

        // muda um recurso em comum, pra criar o lock no serialize
        await prismaTxn.dotacaoProcesso.update({
            where: { id: processoTx.id },
            data: { id: processoTx.id },
        });

        const novo_valor = await prismaTxn.portfolioDotacaoProcesso.findFirst({
            where: {
                ano_referencia: dto.ano_referencia,
                dotacao: dotacao,
                dotacao_processo: processo,
                portfolio_id: portfolio_id,
            },
        });
        console.log(novo_valor);

        if (
            novo_valor &&
            this.liberarEmpenhoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(processoTx.empenho_liquido)
        ) {
            console.log('entrou no exception 1');
            throw new HttpException(FRASE_ERRO_EMPENHO, 400);
        }

        if (
            novo_valor &&
            this.liberarLiquidadoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(processoTx.valor_liquidado)
        ) {
            console.log('entrou no exception 2');
            throw new HttpException(FRASE_ERRO_LIQUIDADO, 400);
        }

        return mes_utilizado;
    }

    private async buscaProcesso(
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
        return processoTx;
    }

    private getAnoNota(nota_empenho: string): number {
        return +nota_empenho.split('/')[1];
    }

    private async verificaNotaEmpenho(
        portfolio_id: number,
        prismaTxn: Prisma.TransactionClient,
        dotacao: string,
        processo: string | null,
        nota_empenho: string
    ) {
        const notaEmpenhoTx = await this.buscaNotaEmpenho(prismaTxn, nota_empenho, dotacao, processo);
        const mes_utilizado = notaEmpenhoTx.mes_utilizado;

        await prismaTxn.dotacaoProcessoNota.update({
            where: { id: notaEmpenhoTx.id },
            data: { id: notaEmpenhoTx.id },
        });

        const novo_valor = await prismaTxn.portfolioDotacaoProcessoNota.findFirst({
            where: {
                ano_referencia: this.getAnoNota(nota_empenho),
                dotacao: dotacao,
                dotacao_processo: processo!,
                dotacao_processo_nota: nota_empenho,
                portfolio_id: portfolio_id,
            },
        });

        if (
            novo_valor &&
            this.liberarEmpenhoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(notaEmpenhoTx.empenho_liquido)
        ) {
            throw new HttpException(FRASE_ERRO_EMPENHO, 400);
        }

        console.log('novo_valor', novo_valor, notaEmpenhoTx);
        if (
            novo_valor &&
            this.liberarLiquidadoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(notaEmpenhoTx.valor_liquidado)
        ) {
            console.log(
                'entrou no this.liberarValoresMaioresQueSof novo_valor.soma_valor_liquidado notaEmpenhoTx.valor_liquidado'
            );
            throw new HttpException(FRASE_ERRO_LIQUIDADO, 400);
        }

        return mes_utilizado;
    }

    private async buscaNotaEmpenho(
        prismaTxn: Prisma.TransactionClient,
        nota_empenho: string,
        dotacao: string,
        processo: string | null
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
        return notaEmpenhoTx;
    }

    async validaDotProcNota(
        dto: CreatePPOrcamentoRealizadoDto
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
                        ano_referencia: +dto.nota_ano!,
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

    async findAll(
        tipo: TipoProjeto,
        projeto: ProjetoMVPDto,
        filters: FilterPPOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<PPOrcamentoRealizado[]> {
        const queryRows = await this.prisma.orcamentoRealizado.findMany({
            where: {
                projeto: { tipo: tipo, id: projeto.id },
                removido_em: null,
                dotacao: filters.dotacao,
                dotacao_complemento: filters.dotacao_complemento,
                projeto_id: projeto.id,
                processo: filters.processo,
                nota_empenho: filters.nota_empenho,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
            },
            select: {
                criador: { select: { nome_exibicao: true } },
                projeto_id: true,
                soma_valor_empenho: true,
                soma_valor_liquidado: true,
                ano_referencia: true,
                dotacao: true,
                dotacao_complemento: true,
                nota_empenho: true,
                processo: true,
                criado_em: true,
                id: true,
                itens: {
                    where: {
                        sobrescrito_por: null,
                    },
                    select: {
                        valor_empenho: true,
                        valor_liquidado: true,
                        percentual_empenho: true,
                        percentual_liquidado: true,
                        mes: true,
                    },
                },
            },
            orderBy: [
                { meta: { codigo: 'asc' } },
                { iniciativa: { codigo: 'asc' } },
                { atividade: { codigo: 'asc' } },
                { id: 'asc' },
            ],
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
        const notasSomaInfo = await this.prisma.portfolioDotacaoProcessoNota.findMany({
            where: {
                dotacao_processo_nota: { in: Object.keys(notaEncontradas) },
                ano_referencia: filters.ano_referencia,
                portfolio_id: projeto.portfolio_id,
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
                dotacao_processo_nota: true,
                dotacao: true,
                dotacao_processo: true,
                empenho_liquido: true,
                valor_liquidado: true,
            },
        });
        const notasInfoRef: Record<string, (typeof notasInfo)[0]> = {};
        for (const nota of notasInfo) {
            notasInfoRef[fk_nota(nota)] = nota;
        }

        // cruza os processos
        const processoSomaInfo = await this.prisma.portfolioDotacaoProcesso.findMany({
            where: {
                dotacao_processo: { in: Object.keys(processosEncontrados) },
                ano_referencia: filters.ano_referencia,
                portfolio_id: projeto.portfolio_id,
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
        const dotacoesSomaInfo = await this.prisma.portfolioDotacaoRealizado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
                portfolio_id: projeto.portfolio_id,
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

        const rows: PPOrcamentoRealizado[] = [];

        const orc_config = await this.prisma.portfolio.findFirst({
            where: { id: projeto.portfolio_id },
            select: { orcamento_execucao_disponivel_meses: true },
        });
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

            rows.push({
                id: orcaRealizado.id,
                ano_referencia: orcaRealizado.ano_referencia,
                projeto_id: orcaRealizado.projeto_id!,

                criado_em: orcaRealizado.criado_em,
                criador: orcaRealizado.criador,
                dotacao: orcaRealizado.dotacao,
                dotacao_complemento: orcaRealizado.dotacao_complemento,
                nota_empenho: orcaRealizado.nota_empenho,
                processo: orcaRealizado.processo,
                soma_valor_empenho: orcaRealizado.soma_valor_empenho.toFixed(2),
                soma_valor_liquidado: orcaRealizado.soma_valor_liquidado.toFixed(2),
                smae_soma_valor_empenho,
                smae_soma_valor_liquidado,
                empenho_liquido,
                valor_liquidado,
                projeto_atividade: '',
                execucao_disponivel_meses: orc_config?.orcamento_execucao_disponivel_meses ?? [],
                itens: orcaRealizado.itens.map((item) => {
                    return {
                        ...item,
                        valor_empenho: item.valor_empenho.toFixed(2),
                        valor_liquidado: item.valor_liquidado.toFixed(2),
                        percentual_empenho: item.percentual_empenho ? item.percentual_empenho.toFixed(2) : null,
                        percentual_liquidado: item.percentual_liquidado ? item.percentual_liquidado.toFixed(2) : null,
                    };
                }),
                // sem regra por enquanto, sempre pode editar tudo
                pode_editar: true,
            });
        }

        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async removeEmLote(tipo: TipoProjeto, params: BatchRecordWithId, user: PessoaFromJwt) {
        const now = new Date(Date.now());

        const maxBatchSize = await this.smaeConfigService.getConfigNumberWithDefault(
            'MAX_LINHAS_REMOVIDAS_ORCAMENTO_EM_LOTE',
            10
        );
        if (params.ids.length > maxBatchSize)
            throw new BadRequestException(`Máximo permitido é de ${maxBatchSize} remoções de uma vez`);

        const checkPermissions = params.ids.map((linha) => this.verificaPermissaoDelete(tipo, linha.id));

        await Promise.all(checkPermissions);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                for (const linha of params.ids) {
                    await this.performDelete(tipo, prismaTxn, linha.id, now, user);
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return;
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        await this.verificaPermissaoDelete(tipo, id);

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                await this.performDelete(tipo, prismaTxn, id, now, user);
                return;
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }

    private async performDelete(
        tipo: TipoProjeto,
        prismaTxn: Prisma.TransactionClient,
        id: number,
        now: Date,
        user: PessoaFromJwt
    ) {
        const linhasAfetadas = await prismaTxn.orcamentoRealizado.updateMany({
            where: { id: +id, removido_em: null, projeto: { tipo } }, // nao apagar duas vezes
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
                if (!notaTx) throw new HttpException('Nota-Empenho não foi foi encontrado no banco de dados', 400);

                // não tem trigger nessa table, não há o que reprocessar
                //await prismaTxn.dotacaoProcessoNota.update({where: { id: notaTx.id }, data: { id: notaTx.id } });
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
                if (!processoTx) throw new HttpException('Processo não foi foi encontrado no banco de dados', 400);

                // não tem trigger nessa table, não há o que reprocessar
                // await prismaTxn.dotacaoProcesso.update({where: { id: processoTx.id },data: { id: processoTx.id }, });
            } else if (orcRealizado.dotacao) {
                const processoTx = await prismaTxn.dotacaoRealizado.findUnique({
                    where: {
                        ano_referencia_dotacao: {
                            ano_referencia: orcRealizado.ano_referencia,
                            dotacao: orcRealizado.dotacao,
                        },
                    },
                });
                if (!processoTx) throw new HttpException('Dotação não foi foi encontrado no banco de dados', 400);

                // não tem trigger nessa table, não há o que reprocessar
                // await prismaTxn.dotacaoRealizado.update({ where: { id: processoTx.id }, data: { id: processoTx.id }, });
            }
        }
    }

    private async verificaPermissaoDelete(tipo: TipoProjeto, id: number) {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null, projeto: { tipo: tipo } },
        });
        if (!orcamentoRealizado || orcamentoRealizado.projeto_id === null)
            throw new HttpException('Orçamento realizado não encontrado', 404);
    }
}
