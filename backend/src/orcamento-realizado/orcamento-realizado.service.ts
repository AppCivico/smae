import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FormataNotaEmpenho } from '../common/FormataNotaEmpenho';
import { BatchRecordWithId, RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExtraiComplementoDotacao, TrataDotacaoGrande } from '../sof-api/sof-api.service';
import {
    CreateOrcamentoRealizadoDto,
    FilterOrcamentoRealizadoCompartilhadoDto,
    FilterOrcamentoRealizadoDto,
    ListApenasOrcamentoRealizadoDto,
    ListOrcamentoRealizadoDto,
    OrcamentoRealizadoStatusConcluidoDto,
    OrcamentoRealizadoStatusPermissoesDto,
    PatchOrcamentoRealizadoConcluidoDto,
    UpdateOrcamentoRealizadoDto,
} from './dto/create-orcamento-realizado.dto';
import { OrcamentoRealizado } from './entities/orcamento-realizado.entity';

export const MAX_BATCH_SIZE = parseInt(process.env.MAX_LINHAS_REMOVIDAS_ORCAMENTO_EM_LOTE || '', 10) || 10;

export const FRASE_ERRO_EMPENHO =
    'O total do empenho no SMAE excede o total do empenho no SOF, não é possível seguir com esse registro.';
export const FRASE_ERRO_LIQUIDADO =
    'O total do liquidado no SMAE excede o total do liquidado no SOF, não é possível seguir com esse registro.';

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
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
        private readonly dotacaoService: DotacaoService
    ) {
        // deixar ligado a verificação
        this.liberarEmpenhoValoresMaioresQueSof = false;
        this.liberarLiquidadoValoresMaioresQueSof = true;
    }

    async create(dto: CreateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const dotacao_complemento = ExtraiComplementoDotacao(dto);
        dto.dotacao = TrataDotacaoGrande(dto.dotacao);

        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        await user.verificaPermissaoOrcamentoNaMeta(meta_id, this.prisma);

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

        let soma_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_empenho;
        let soma_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].valor_liquidado;

        const perc_valor_empenho = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_empenho;
        const perc_valor_liquidado = dto.itens.sort((a, b) => b.mes - a.mes)[0].percentual_liquidado;
        const mes_corrente = dto.itens.sort((a, b) => b.mes - a.mes)[0].mes;

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
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
                        dotacao,
                        dotacao_complemento,
                        processo,
                        nota_empenho,
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
                                            mes_corrente: item.mes == mes_corrente,
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
                    await this.verificaNotaEmpenho(meta.pdm_id, prismaTxn, dotacao, processo, nota_empenho);
                } else if (processo) {
                    await this.verificaProcesso(meta.pdm_id, prismaTxn, dto, dotacao, processo);
                } else if (dotacao) {
                    await this.verificaDotacao(meta.pdm_id, prismaTxn, dto, dotacao);
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

    async update(id: number, dto: UpdateOrcamentoRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!orcamentoRealizado || orcamentoRealizado.meta_id === null)
            throw new HttpException('Orçamento realizado não encontrado', 404);

        await user.verificaPermissaoOrcamentoNaMeta(orcamentoRealizado.meta_id, this.prisma);
        const { permissoes, status } = await this.buscaPermissoesStatus(user, {
            ano_referencia: orcamentoRealizado.ano_referencia,
            meta_id: orcamentoRealizado.meta_id,
        });
        if (permissoes.pode_editar === false)
            throw new BadRequestException(`Sem permissão para editar o item. ${this.textoErroAnoConcluido(status)}`);

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

                let dot_empenho_liquido: Decimal;
                let dot_valor_liquidado: Decimal;

                const orcRealizado = await prismaTxn.orcamentoRealizado.findUniqueOrThrow({ where: { id: +id } });

                // trata um caso legacy onde a dotação no banco estava salva completa num campo só
                const dotacao_edit = TrataDotacaoGrande(orcRealizado.dotacao);
                if (orcRealizado.dotacao != dotacao_edit) {
                    orcRealizado.dotacao = dotacao_edit;
                    await this.prisma.orcamentoRealizado.update({
                        where: { id: orcRealizado.id },
                        data: { dotacao: dotacao_edit },
                    });
                }

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
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,

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
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,
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
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';

                    throw new HttpException(
                        `Já existe um registro com a mesma dotação/processo e/ou nota de empenho associado com a mesma ${categoria}`,
                        400
                    );
                }

                if (orcRealizado.nota_empenho) {
                    await this.verificaNotaEmpenho(
                        meta.pdm_id,
                        prismaTxn,
                        orcRealizado.dotacao,
                        orcRealizado.processo,
                        orcRealizado.nota_empenho
                    );
                } else if (orcRealizado.processo) {
                    await this.verificaProcesso(
                        meta.pdm_id,
                        prismaTxn,
                        { ano_referencia: orcRealizado.ano_referencia },
                        orcRealizado.dotacao,
                        orcRealizado.processo
                    );
                } else if (orcRealizado.dotacao) {
                    await this.verificaDotacao(
                        meta.pdm_id,
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
        pdm_id: number,
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

        // muda um recurso em comum, pra criar o lock no serialize
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
        pdm_id: number,
        prismaTxn: Prisma.TransactionClient,
        dto: PartialOrcamentoRealizadoDto,
        dotacao: string,
        processo: string
    ) {
        const processoTx = await this.buscaProcesso(prismaTxn, dto, dotacao, processo);
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
            this.liberarEmpenhoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(processoTx.empenho_liquido)
        ) {
            throw new HttpException(FRASE_ERRO_EMPENHO, 400);
        }

        if (
            novo_valor &&
            this.liberarLiquidadoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(processoTx.valor_liquidado)
        ) {
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
        pdm_id: number,
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
            this.liberarEmpenhoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_empenho.greaterThan(notaEmpenhoTx.empenho_liquido)
        ) {
            throw new HttpException(FRASE_ERRO_EMPENHO, 400);
        }

        if (
            novo_valor &&
            this.liberarLiquidadoValoresMaioresQueSof === false &&
            novo_valor.soma_valor_liquidado.greaterThan(notaEmpenhoTx.valor_liquidado)
        ) {
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

    async findAllWithPermissions(
        filters: FilterOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<ListOrcamentoRealizadoDto> {
        const { permissoes, status } = await this.buscaPermissoesStatus(user, filters);

        const meta = await this.prisma.meta.findFirst({
            where: { id: filters.meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });
        if (meta === null) throw new HttpException('Meta não encontrada', 404);

        const ret: ListOrcamentoRealizadoDto = {
            permissoes: permissoes,
            linhas: await this.findAll(filters, user, permissoes, false, meta.pdm_id),
            concluido: status,
        };

        return ret;
    }

    async findCompartilhadosNoPdm(
        filters: FilterOrcamentoRealizadoCompartilhadoDto,
        user: PessoaFromJwt
    ): Promise<ListApenasOrcamentoRealizadoDto> {
        if (!filters.dotacao)
            throw new BadRequestException('É necessário enviar a dotação para buscar as metas compartilhadas');

        if (filters.nota_empenho) {
            if (!filters.nota_empenho.includes('/'))
                filters.nota_empenho = `${filters.nota_empenho}/${filters.ano_referencia}`;

            filters.nota_empenho = FormataNotaEmpenho(filters.nota_empenho);
        }

        const ret: ListApenasOrcamentoRealizadoDto = {
            linhas: await this.findAll(filters, user, undefined, true, filters.pdm_id),
        };

        return ret;
    }

    private async buscaPermissoesStatus(user: PessoaFromJwt, filters: { meta_id: number; ano_referencia: number }) {
        const isAdmin = user.hasSomeRoles(['CadastroMeta.administrador_orcamento']);

        // economizando query, admin não entra na condição de testar se está dentro dessa lista
        const metasRespCp = isAdmin
            ? []
            : await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);

        console.log(metasRespCp);

        const status = await this.statusConcluido(filters.meta_id, filters.ano_referencia, user, metasRespCp);
        const permissoes: OrcamentoRealizadoStatusPermissoesDto = {
            pode_editar: status.concluido ? isAdmin : true,
            pode_excluir_lote: isAdmin ? true : metasRespCp.includes(+filters.meta_id),
        };
        return { permissoes, status };
    }

    private async findAll(
        filters: FilterOrcamentoRealizadoDto | FilterOrcamentoRealizadoCompartilhadoDto,
        user: PessoaFromJwt,
        permissoes: OrcamentoRealizadoStatusPermissoesDto | undefined,
        ehCompartilhado: boolean,
        pdm_id: number
    ): Promise<OrcamentoRealizado[]> {
        let filterIdIn: undefined | number[] = undefined;
        if (!ehCompartilhado && !user.hasSomeRoles(['CadastroMeta.administrador_orcamento']))
            filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_responsavel_orcamento);

        // quando é compartilhado, queremos que o campo seja sempre filtrado para retornar o null, se não for enviado o vizinho
        const queryRows = await this.prisma.orcamentoRealizado.findMany({
            where: {
                meta: { pdm_id: pdm_id },
                removido_em: null,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
                dotacao: filters.dotacao,
                processo: ehCompartilhado ? (filters.processo ? filters.processo : null) : filters.processo,
                nota_empenho: ehCompartilhado
                    ? filters.nota_empenho
                        ? filters.nota_empenho
                        : null
                    : filters.nota_empenho,
                dotacao_complemento: 'dotacao_complemento' in filters ? filters.dotacao_complemento : undefined,
                AND: [
                    { meta_id: 'meta_id' in filters ? filters.meta_id : undefined },
                    { meta_id: filterIdIn ? { in: filterIdIn } : undefined },
                ],
                iniciativa_id: 'iniciativa_id' in filters ? filters.iniciativa_id : undefined,
                atividade_id: 'atividade_id' in filters ? filters.atividade_id : undefined,
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
                pdm_id: pdm_id,
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
                pdm_id: pdm_id,
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
                pdm_id: pdm_id,
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
                where: { pdm_id: pdm_id, ano_referencia: filters.ano_referencia },
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
                execucao_disponivel_meses: orc_config?.execucao_disponivel_meses ?? [],
                itens: orcaRealizado.itens.map((item) => {
                    return {
                        ...item,
                        valor_empenho: item.valor_empenho.toFixed(2),
                        valor_liquidado: item.valor_liquidado.toFixed(2),
                        percentual_empenho: item.percentual_empenho ? item.percentual_empenho.toFixed(2) : null,
                        percentual_liquidado: item.percentual_liquidado ? item.percentual_liquidado.toFixed(2) : null,
                    };
                }),

                pode_editar: permissoes ? permissoes.pode_editar : false,
            });
        }

        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async removeEmLote(params: BatchRecordWithId, user: PessoaFromJwt) {
        const now = new Date(Date.now());

        if (params.ids.length > MAX_BATCH_SIZE)
            throw new BadRequestException(`Máximo permitido é de ${MAX_BATCH_SIZE} remoções de uma vez`);

        // pra executar em lote, precisa ser CP
        const checkPermissions = params.ids.map((linha) =>
            this.verificaPermissaoDelete(linha.id, user, 'verificaPermissaoOrcamentoNaMetaRespNaCp')
        );

        await Promise.all(checkPermissions);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                for (const linha of params.ids) {
                    await this.performDelete(prismaTxn, linha.id, now, user);
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return;
    }

    private async statusConcluido(
        meta_id: number,
        ano_referencia: number,
        user: PessoaFromJwt,
        metasOk: number[]
    ): Promise<OrcamentoRealizadoStatusConcluidoDto> {
        const configAtual = await this.getStatusConcluido({ meta_id, ano_referencia });

        const isAdmin = user.hasSomeRoles(['CadastroMeta.administrador_orcamento']);

        const ret: OrcamentoRealizadoStatusConcluidoDto = {
            concluido: false,
            pode_editar: true, // todo mundo pode editar os registros que não existem ainda
            concluido_em: null,
            concluido_por: null,
        };

        if (configAtual) {
            ret.concluido = configAtual.execucao_concluida;
            if (ret.concluido) {
                ret.concluido_em = configAtual.atualizado_em;
                ret.concluido_por = configAtual.atualizador;

                // se não for admin, e está concluido, então pra poder editar,
                // precisa verificar se está na lista de responsável na CP
                if (!isAdmin) ret.pode_editar = metasOk.includes(+meta_id);
            }
        }

        return ret;
    }

    async orcamentoConcluido(dto: PatchOrcamentoRealizadoConcluidoDto, user: PessoaFromJwt) {
        const isAdmin = user.hasSomeRoles(['CadastroMeta.administrador_orcamento']);
        await user.verificaPermissaoOrcamentoNaMeta(dto.meta_id, this.prisma);

        const configAtual = await this.getStatusConcluido(dto);

        // só CP pode mudar depois de congelado
        if (configAtual && configAtual.execucao_concluida && !isAdmin) {
            await user.verificaPermissaoOrcamentoNaMetaRespNaCp(dto.meta_id, this.prisma);
        }

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            await prismaTxn.pdmOrcamentoRealizadoConfig.updateMany({
                where: {
                    ano_referencia: dto.ano_referencia,
                    meta_id: dto.meta_id,
                    ultima_revisao: true,
                },
                data: { ultima_revisao: null },
            });

            await prismaTxn.pdmOrcamentoRealizadoConfig.create({
                data: {
                    ano_referencia: dto.ano_referencia,
                    execucao_concluida: dto.concluido,
                    meta_id: dto.meta_id,
                    atualizado_em: now,
                    atualizado_por: user.id,
                    ultima_revisao: true,
                },
            });
            return;
        });
    }

    private async getStatusConcluido(dto: { ano_referencia: number; meta_id: number }) {
        return await this.prisma.pdmOrcamentoRealizadoConfig.findUnique({
            where: {
                meta_id_ano_referencia_ultima_revisao: {
                    ultima_revisao: true,
                    ano_referencia: dto.ano_referencia,
                    meta_id: dto.meta_id,
                },
            },
            include: {
                atualizador: {
                    select: { id: true, nome_exibicao: true },
                },
            },
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.verificaPermissaoDelete(id, user, 'verificaPermissaoOrcamentoNaMeta');

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                await this.performDelete(prismaTxn, id, now, user);
                return;
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }

    private async verificaPermissaoDelete(
        id: number,
        user: PessoaFromJwt,
        func: 'verificaPermissaoOrcamentoNaMeta' | 'verificaPermissaoOrcamentoNaMetaRespNaCp'
    ) {
        const orcamentoRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id: +id, removido_em: null },
            select: { ano_referencia: true, meta_id: true },
        });
        if (!orcamentoRealizado || orcamentoRealizado.meta_id === null)
            throw new HttpException('Orçamento realizado não encontrado', 404);

        const { permissoes, status } = await this.buscaPermissoesStatus(user, {
            ano_referencia: orcamentoRealizado.ano_referencia,
            meta_id: orcamentoRealizado.meta_id,
        });
        if (permissoes.pode_editar === false)
            throw new BadRequestException(`Sem permissão para remover o item. ${this.textoErroAnoConcluido(status)}`);

        await user[func](orcamentoRealizado.meta_id, this.prisma);
    }

    private textoErroAnoConcluido(status: OrcamentoRealizadoStatusConcluidoDto) {
        return status.concluido ? 'Ano está concluido, apenas os responsáveis na CP podem editar ou remover' : '';
    }

    private async performDelete(prismaTxn: Prisma.TransactionClient, id: number, now: Date, user: PessoaFromJwt) {
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
                if (!notaTx) throw new HttpException('Nota-Empenho não foi foi encontrado no banco de dados', 400);

                // não tem trigger nessa table, não há o que reprocessar
                // await prismaTxn.dotacaoProcessoNota.update({ where: { id: notaTx.id }, data: { id: notaTx.id } });
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
                // await prismaTxn.dotacaoProcesso.update({ where: { id: processoTx.id }, data: { id: processoTx.id } });
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
                // await prismaTxn.dotacaoRealizado.update({ where: { id: processoTx.id }, data: { id: processoTx.id } });
            }
        }
    }
}

const numberFormatterPtBr = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: true,
});
function FormataDinheiroBr(valor: number) {
    return `R$ ${numberFormatterPtBr.format(valor)}`;
}

export function DoubleCheckException(
    tipo: string,
    check_soma_valor_empenho: number,
    soma_valor_empenho: number,
    perc_valor_empenho: number
) {
    if (Math.round(check_soma_valor_empenho * 100) != Math.round(soma_valor_empenho * 100)) {
        throw new BadRequestException(
            `${perc_valor_empenho}% do valor ${tipo} informado, ${FormataDinheiroBr(soma_valor_empenho)}, não confere com valor esperado de ${FormataDinheiroBr(check_soma_valor_empenho)}`
        );
    }
}

export function DivPerc2Decimal(valorEmpOuLiq: Prisma.Decimal, perc_valor_empenhoOuLiq: number) {
    const soma_valor_empenhoOuLiq = +valorEmpOuLiq.times(new Decimal(perc_valor_empenhoOuLiq).div(100)).toFixed(2);
    return soma_valor_empenhoOuLiq;
}

export function verificaValorLiqEmpenhoMaiorEmp(soma_valor_empenho: number, soma_valor_liquidado: number) {
    // meio que reaproveitando a flag do liberarLiquidadoValoresMaioresQueSof, mas ok, só pra não apagar o código
    // completamente pois pode ser que a regra volte
    if (soma_valor_liquidado > soma_valor_empenho && this.liberarLiquidadoValoresMaioresQueSof == false)
        throw new BadRequestException('O valor liquidado não pode ser maior do que valor empenhado.');
}
