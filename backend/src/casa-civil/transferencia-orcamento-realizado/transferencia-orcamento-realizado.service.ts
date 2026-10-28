import { BadRequestException, forwardRef, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FormataNotaEmpenho } from '../../common/FormataNotaEmpenho';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateOrcamentoRealizadoItemDto } from '../../orcamento-realizado/dto/create-orcamento-realizado.dto';
import {
    DivPerc2Decimal,
    DoubleCheckException,
    FRASE_ERRO_EMPENHO,
    FRASE_ERRO_LIQUIDADO,
    LIBERAR_LIQUIDADO_VALORES_MAIORES_QUE_SOF,
    verificaValorLiqEmpenhoMaiorEmp,
} from '../../orcamento-realizado/orcamento-realizado.service';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { ChaveRealizadoTransferencia, SomaRealizadoTransferencias } from '../../dotacao/soma-realizado-transferencia';
import { PrismaService } from '../../prisma/prisma.service';
import { ExtraiComplementoDotacao, TrataDotacaoGrande } from '../../sof-api/sof-api.service';
import { TransferenciaService } from '../transferencia/transferencia.service';
import { VinculoService } from '../vinculo/vinculo.service';
import {
    CreateTransferenciaOrcamentoRealizadoDto,
    UpdateTransferenciaOrcamentoRealizadoDto,
} from './dto/transferencia-orcamento-realizado.dto';
import { TransferenciaOrcamentoRealizado } from './entities/transferencia-orcamento-realizado.entity';

type ValorSof = {
    empenho_liquido: Decimal;
    valor_liquidado: Decimal;
    mes_utilizado: number;
};

const chaveTexto = (c: ChaveRealizadoTransferencia) =>
    [c.ano_referencia, c.dotacao, c.processo ?? '', c.nota_empenho ?? ''].join('|');

@Injectable()
export class TransferenciaOrcamentoRealizadoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService,
        private readonly transferenciaService: TransferenciaService,
        @Inject(forwardRef(() => VinculoService))
        private readonly vinculoService: VinculoService
    ) {}

    async buscaTransferencia(id: number, user: PessoaFromJwt): Promise<{ id: number }> {
        const transferencia = await this.prisma.transferencia.findFirst({
            where: { id, removido_em: null, AND: this.transferenciaService.permissionSet(user) },
            select: { id: true },
        });
        if (!transferencia) throw new NotFoundException('Transferência não encontrada');
        return transferencia;
    }

    async create(
        transferenciaId: number,
        dto: CreateTransferenciaOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const distribuicao_recurso_id = dto.distribuicao_recurso_id ?? null;
        if (distribuicao_recurso_id) {
            const distribuicao = await this.prisma.distribuicaoRecurso.count({
                where: { id: distribuicao_recurso_id, transferencia_id: transferenciaId, removido_em: null },
            });
            if (!distribuicao) throw new BadRequestException('Distribuição não encontrada nesta transferência');
        }

        const dotacao_complemento = ExtraiComplementoDotacao(dto);
        const chave: ChaveRealizadoTransferencia = {
            ano_referencia: dto.ano_referencia,
            dotacao: TrataDotacaoGrande(dto.dotacao),
            nota_empenho: dto.nota_empenho ? FormataNotaEmpenho(dto.nota_empenho) : null,
            processo: dto.processo ? dto.processo.replace(/[^0-9]/g, '') : null,
        };
        if (chave.nota_empenho && !chave.processo)
            throw new BadRequestException('Necessário enviar Processo ao enviar Nota Empenho');

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const sof = await this.buscaSof(prismaTxn, chave);
                const somas = this.calculaSomas(dto.itens, sof);

                const outraTransferencia = await prismaTxn.orcamentoRealizado.findFirst({
                    where: {
                        transferencia_id: { not: transferenciaId },
                        transferencia: { removido_em: null },
                        removido_em: null,
                        ano_referencia: chave.ano_referencia,
                        dotacao: chave.dotacao,
                    },
                    select: { transferencia: { select: { identificador: true } } },
                });
                if (outraTransferencia)
                    throw new BadRequestException(
                        `Dotação já está vinculada a outra transferência (${outraTransferencia.transferencia!.identificador}).`
                    );

                const countExisting = await prismaTxn.orcamentoRealizado.count({
                    where: {
                        transferencia_id: transferenciaId,
                        dotacao_complemento,
                        removido_em: null,
                        ...chave,
                    },
                });
                if (countExisting)
                    throw new BadRequestException(
                        'Já existe um registro com a mesma dotação/processo e/ou nota de empenho na transferência ou em uma de suas distribuições.'
                    );

                const created = await prismaTxn.orcamentoRealizado.create({
                    data: {
                        ...chave,
                        transferencia_id: transferenciaId,
                        distribuicao_recurso_id,
                        dotacao_complemento,
                        mes_utilizado: sof.mes_utilizado,
                        soma_valor_empenho: somas.soma_valor_empenho,
                        soma_valor_liquidado: somas.soma_valor_liquidado,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        itens: {
                            createMany: { data: this.montaItens(dto.itens, chave.ano_referencia, somas.mes, sof) },
                        },
                    },
                    select: { id: true },
                });

                await this.verificaLimiteSof(prismaTxn, chave, sof);

                return created;
            },
            { isolationLevel: 'Serializable', maxWait: 5000, timeout: 100000 }
        );
    }

    async update(
        transferenciaId: number,
        id: number,
        dto: UpdateTransferenciaOrcamentoRealizadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const orcRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id, transferencia_id: transferenciaId, removido_em: null },
        });
        if (!orcRealizado) throw new NotFoundException('Orçamento realizado não encontrado');

        const chave: ChaveRealizadoTransferencia = {
            ano_referencia: orcRealizado.ano_referencia,
            dotacao: orcRealizado.dotacao,
            processo: orcRealizado.processo,
            nota_empenho: orcRealizado.nota_empenho,
        };

        return await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());
                const sof = await this.buscaSof(prismaTxn, chave);
                const somas = this.calculaSomas(dto.itens, sof);

                await prismaTxn.orcamentoRealizadoItem.updateMany({
                    where: { orcamento_realizado_id: orcRealizado.id, sobrescrito_em: null },
                    data: { sobrescrito_em: now, sobrescrito_por: user.id },
                });

                await prismaTxn.orcamentoRealizado.update({
                    where: { id: orcRealizado.id },
                    data: {
                        soma_valor_empenho: somas.soma_valor_empenho,
                        soma_valor_liquidado: somas.soma_valor_liquidado,
                        itens: {
                            createMany: { data: this.montaItens(dto.itens, chave.ano_referencia, somas.mes, sof) },
                        },
                    },
                });

                await this.verificaLimiteSof(prismaTxn, chave, sof);

                return { id: orcRealizado.id };
            },
            { isolationLevel: 'Serializable', maxWait: 5000, timeout: 100000 }
        );
    }

    async findAll(transferenciaId: number, user: PessoaFromJwt): Promise<TransferenciaOrcamentoRealizado[]> {
        const queryRows = await this.prisma.orcamentoRealizado.findMany({
            where: { transferencia_id: transferenciaId, removido_em: null },
            select: {
                id: true,
                transferencia_id: true,
                ano_referencia: true,
                dotacao: true,
                dotacao_complemento: true,
                processo: true,
                nota_empenho: true,
                soma_valor_empenho: true,
                soma_valor_liquidado: true,
                criado_em: true,
                criador: { select: { nome_exibicao: true } },
                distribuicao_recurso: { select: { id: true, nome: true, objeto: true } },
                vinculosDistribuicoes: {
                    where: { removido_em: null, invalidado_em: null },
                    select: { id: true },
                    take: 1,
                },
                itens: {
                    where: { sobrescrito_em: null },
                    select: {
                        valor_empenho: true,
                        valor_liquidado: true,
                        percentual_empenho: true,
                        percentual_liquidado: true,
                        mes: true,
                    },
                    orderBy: { mes: 'asc' },
                },
            },
            orderBy: [{ ano_referencia: 'desc' }, { id: 'asc' }],
        });
        if (queryRows.length == 0) return [];

        const anos = [...new Set(queryRows.map((r) => r.ano_referencia))];
        const dotacoes = [...new Set(queryRows.map((r) => r.dotacao))];

        const smaeSomas = await this.prisma.orcamentoRealizado.groupBy({
            by: ['ano_referencia', 'dotacao', 'processo', 'nota_empenho'],
            where: {
                transferencia_id: { not: null },
                transferencia: { removido_em: null },
                removido_em: null,
                ano_referencia: { in: anos },
                dotacao: { in: dotacoes },
            },
            _sum: { soma_valor_empenho: true, soma_valor_liquidado: true },
        });
        const smaeSomaRef = new Map(smaeSomas.map((r) => [chaveTexto(r), r._sum]));

        const sofRef = new Map<string, { empenho_liquido: Decimal; valor_liquidado: Decimal }>();
        const [dotacoesSof, processosSof, notasSof] = await Promise.all([
            this.prisma.dotacaoRealizado.findMany({
                where: { ano_referencia: { in: anos }, dotacao: { in: dotacoes } },
                select: { ano_referencia: true, dotacao: true, empenho_liquido: true, valor_liquidado: true },
            }),
            this.prisma.dotacaoProcesso.findMany({
                where: { ano_referencia: { in: anos }, dotacao: { in: dotacoes } },
                select: {
                    ano_referencia: true,
                    dotacao: true,
                    dotacao_processo: true,
                    empenho_liquido: true,
                    valor_liquidado: true,
                },
            }),
            this.prisma.dotacaoProcessoNota.findMany({
                where: {
                    dotacao: { in: dotacoes },
                    dotacao_processo_nota: {
                        in: queryRows.map((r) => r.nota_empenho).filter((n): n is string => !!n),
                    },
                },
                select: {
                    dotacao: true,
                    dotacao_processo: true,
                    dotacao_processo_nota: true,
                    empenho_liquido: true,
                    valor_liquidado: true,
                },
            }),
        ]);
        for (const r of dotacoesSof) sofRef.set(chaveTexto({ ...r, processo: null, nota_empenho: null }), r);
        for (const r of processosSof)
            sofRef.set(chaveTexto({ ...r, processo: r.dotacao_processo, nota_empenho: null }), r);
        // o SOF guarda a nota pelo ano da própria nota, não pelo ano de referência
        const notaRef = new Map(
            notasSof.map((r) => [[r.dotacao, r.dotacao_processo, r.dotacao_processo_nota].join('|'), r])
        );

        const pode_editar = user.hasSomeRoles(['CadastroTransferencia.editar', 'CadastroTransferencia.administrador']);

        const rows: TransferenciaOrcamentoRealizado[] = queryRows.map((r) => {
            const smae = smaeSomaRef.get(chaveTexto(r));
            const sof = r.nota_empenho
                ? notaRef.get([r.dotacao, r.processo, r.nota_empenho].join('|'))
                : sofRef.get(chaveTexto(r));

            return {
                id: r.id,
                transferencia_id: r.transferencia_id!,
                ano_referencia: r.ano_referencia,
                dotacao: r.dotacao,
                dotacao_complemento: r.dotacao_complemento,
                processo: r.processo,
                nota_empenho: r.nota_empenho,
                projeto_atividade: '',
                soma_valor_empenho: r.soma_valor_empenho.toFixed(2),
                soma_valor_liquidado: r.soma_valor_liquidado.toFixed(2),
                smae_soma_valor_empenho: (smae?.soma_valor_empenho ?? new Decimal(0)).toFixed(2),
                smae_soma_valor_liquidado: (smae?.soma_valor_liquidado ?? new Decimal(0)).toFixed(2),
                empenho_liquido: sof ? sof.empenho_liquido.toFixed(2) : null,
                valor_liquidado: sof ? sof.valor_liquidado.toFixed(2) : null,
                criado_em: r.criado_em,
                criador: r.criador,
                execucao_disponivel_meses: [],
                itens: r.itens.map((item) => ({
                    mes: item.mes,
                    valor_empenho: item.valor_empenho.toFixed(2),
                    valor_liquidado: item.valor_liquidado.toFixed(2),
                    percentual_empenho: item.percentual_empenho ? item.percentual_empenho.toFixed(2) : null,
                    percentual_liquidado: item.percentual_liquidado ? item.percentual_liquidado.toFixed(2) : null,
                })),
                distribuicao_recurso: r.distribuicao_recurso,
                possui_vinculos: r.vinculosDistribuicoes.length > 0,
                pode_editar,
            };
        });

        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async remove(transferenciaId: number, id: number, user: PessoaFromJwt) {
        const orcRealizado = await this.prisma.orcamentoRealizado.findFirst({
            where: { id, transferencia_id: transferenciaId, removido_em: null },
            select: { id: true },
        });
        if (!orcRealizado) throw new NotFoundException('Orçamento realizado não encontrado');

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const removido = await prismaTxn.orcamentoRealizado.updateMany({
                    where: { id, removido_em: null },
                    data: { removido_em: new Date(Date.now()), removido_por: user.id },
                });
                if (removido.count == 0) return;

                const vinculos = await prismaTxn.distribuicaoRecursoVinculo.findMany({
                    where: { orcamento_realizado_id: id, removido_em: null, invalidado_em: null },
                    select: { id: true },
                });
                for (const vinculo of vinculos)
                    await this.vinculoService.invalidarVinculo({ id: vinculo.id }, 'Dotação removida.', prismaTxn);
            },
            { isolationLevel: 'Serializable' }
        );
    }

    private async buscaSof(prisma: Prisma.TransactionClient, chave: ChaveRealizadoTransferencia): Promise<ValorSof> {
        const select = { empenho_liquido: true, valor_liquidado: true, mes_utilizado: true } as const;

        if (chave.nota_empenho) {
            const nota = await prisma.dotacaoProcessoNota.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo_dotacao_processo_nota: {
                        ano_referencia: +chave.nota_empenho.split('/')[1],
                        dotacao: chave.dotacao,
                        dotacao_processo: chave.processo!,
                        dotacao_processo_nota: chave.nota_empenho,
                    },
                },
                select,
            });
            if (!nota) throw new BadRequestException('Nota de Empenho não foi encontrada no banco de dados');
            return nota;
        }

        if (chave.processo) {
            const processo = await prisma.dotacaoProcesso.findUnique({
                where: {
                    ano_referencia_dotacao_dotacao_processo: {
                        ano_referencia: chave.ano_referencia,
                        dotacao: chave.dotacao,
                        dotacao_processo: chave.processo,
                    },
                },
                select,
            });
            if (!processo) throw new BadRequestException('Processo não foi encontrado no banco de dados');
            return processo;
        }

        const dotacao = await prisma.dotacaoRealizado.findUnique({
            where: { ano_referencia_dotacao: { ano_referencia: chave.ano_referencia, dotacao: chave.dotacao } },
            select,
        });
        if (!dotacao) throw new BadRequestException('Dotação não foi encontrada no banco de dados');
        return dotacao;
    }

    private async verificaLimiteSof(
        prismaTxn: Prisma.TransactionClient,
        chave: ChaveRealizadoTransferencia,
        sof: ValorSof
    ) {
        const soma = await SomaRealizadoTransferencias(prismaTxn, chave);

        if (soma.soma_valor_empenho.greaterThan(sof.empenho_liquido)) throw new HttpException(FRASE_ERRO_EMPENHO, 400);

        if (!LIBERAR_LIQUIDADO_VALORES_MAIORES_QUE_SOF && soma.soma_valor_liquidado.greaterThan(sof.valor_liquidado))
            throw new HttpException(FRASE_ERRO_LIQUIDADO, 400);
    }

    private calculaSomas(itens: CreateOrcamentoRealizadoItemDto[], sof: ValorSof) {
        const ultimo = [...itens].sort((a, b) => b.mes - a.mes)[0];
        let soma_valor_empenho = ultimo.valor_empenho;
        let soma_valor_liquidado = ultimo.valor_liquidado;

        if (ultimo.percentual_empenho) {
            const calc = DivPerc2Decimal(sof.empenho_liquido, ultimo.percentual_empenho);
            if (soma_valor_empenho == null) soma_valor_empenho = calc;
            else if (soma_valor_empenho)
                DoubleCheckException('de empenho', calc, soma_valor_empenho, ultimo.percentual_empenho);
        }
        if (ultimo.percentual_liquidado) {
            const calc = DivPerc2Decimal(sof.valor_liquidado, ultimo.percentual_liquidado);
            if (soma_valor_liquidado == null) soma_valor_liquidado = calc;
            else if (soma_valor_liquidado)
                DoubleCheckException('do liquidado', calc, soma_valor_liquidado, ultimo.percentual_liquidado);
        }

        if (soma_valor_empenho == null || soma_valor_liquidado == null)
            throw new BadRequestException('soma_valor_empenho ou soma_valor_liquidado estão nulo');

        verificaValorLiqEmpenhoMaiorEmp(soma_valor_empenho, soma_valor_liquidado);

        return { soma_valor_empenho, soma_valor_liquidado, mes: ultimo.mes };
    }

    private montaItens(
        itens: CreateOrcamentoRealizadoItemDto[],
        ano_referencia: number,
        mes_corrente: number,
        sof: ValorSof
    ): Prisma.OrcamentoRealizadoItemCreateManyOrcamentoRealizadoInput[] {
        return itens.map((item) => {
            const valor_empenho =
                item.valor_empenho ??
                (item.percentual_empenho ? DivPerc2Decimal(sof.empenho_liquido, item.percentual_empenho) : null);
            const valor_liquidado =
                item.valor_liquidado ??
                (item.percentual_liquidado ? DivPerc2Decimal(sof.valor_liquidado, item.percentual_liquidado) : null);

            if (valor_empenho == null) throw new BadRequestException(`Faltando valor_empenho para mês ${item.mes}`);
            if (valor_liquidado == null) throw new BadRequestException(`Faltando valor_liquidado para mês ${item.mes}`);

            return {
                valor_empenho,
                valor_liquidado,
                percentual_empenho: item.percentual_empenho,
                percentual_liquidado: item.percentual_liquidado,
                mes: item.mes,
                data_referencia: new Date([ano_referencia, item.mes, '01'].join('-')),
                mes_corrente: item.mes == mes_corrente,
            };
        });
    }
}
