import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, TipoProjeto } from 'src/generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import {
    CreatePPOrcamentoPlanejadoDto,
    FilterPPOrcamentoPlanejadoDto,
    UpdatePPOrcamentoPlanejadoDto,
} from './dto/create-orcamento-planejado.dto';
import { PPOrcamentoPlanejadoDto } from './entities/orcamento-planejado.entity';
import { ProjetoDetailDto } from '../projeto/entities/projeto.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrcamentoPlanejadoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async create(
        tipo: TipoProjeto,
        projeto_id: number,
        dto: CreatePPOrcamentoPlanejadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projetoPortfolio = await this.prisma.projeto.findFirstOrThrow({
            where: { id: projeto_id, tipo, removido_em: null },
            select: {
                portfolio: {
                    select: { modelo_clonagem: true },
                },
            },
        });
        if (projetoPortfolio.portfolio.modelo_clonagem)
            throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

        const dotacao = await this.prisma.dotacaoPlanejado.findFirst({
            where: { dotacao: dto.dotacao, ano_referencia: dto.ano_referencia },
            select: { id: true },
        });
        if (!dotacao) throw new HttpException('Dotação/projeto não foi ainda não foi importada no banco de dados', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const countExisting = await prismaTxn.orcamentoPlanejado.count({
                    where: {
                        projeto_id,
                        dotacao: dto.dotacao,
                        ano_referencia: dto.ano_referencia,
                        removido_em: null,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada no projeto.`,
                        400
                    );
                }

                const orcamentoPlanejado = await prismaTxn.orcamentoPlanejado.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        projeto_id,
                        ano_referencia: dto.ano_referencia,
                        dotacao: dto.dotacao,
                        valor_planejado: dto.valor_planejado,
                    },
                    select: { id: true, valor_planejado: true },
                });

                const dotacaoTx = await prismaTxn.dotacaoPlanejado.findFirst({
                    where: { id: dotacao.id },
                    select: { id: true },
                });
                if (!dotacaoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.',
                        400
                    );

                // dispara a trigger
                await prismaTxn.dotacaoPlanejado.update({
                    where: { id: dotacao.id },
                    data: { id: dotacao.id },
                });

                return orcamentoPlanejado;
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
        projeto_id: number,
        id: number,
        dto: UpdatePPOrcamentoPlanejadoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null, projeto_id, projeto: { tipo, id: projeto_id } },
        });
        if (!orcamentoPlanejado) throw new HttpException('Orçamento planejado não encontrado', 404);
        console.log(dto);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const orcamentoPlanejadoTx = await this.prisma.orcamentoPlanejado.findFirst({
                    where: { id: +id, removido_em: null, projeto_id },
                });
                if (!orcamentoPlanejadoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Registro deixou de existir no meio da atualização.',
                        400
                    );

                const dotacaoTx = await this.prisma.dotacaoPlanejado.findUnique({
                    where: {
                        ano_referencia_dotacao: {
                            ano_referencia: orcamentoPlanejado.ano_referencia,
                            dotacao: orcamentoPlanejado.dotacao,
                        },
                    },
                });
                if (!dotacaoTx)
                    throw new HttpException(
                        'Operação não pode ser realizada no momento. Dotação deixou de existir no meio da atualização.',
                        400
                    );

                const updated = await prismaTxn.orcamentoPlanejado.update({
                    where: {
                        id: orcamentoPlanejadoTx.id,
                    },
                    data: {
                        valor_planejado: dto.valor_planejado,
                    },
                });

                const countExisting = await prismaTxn.orcamentoPlanejado.count({
                    where: {
                        projeto_id,
                        dotacao: updated.dotacao,
                        NOT: { id: updated.id },
                        ano_referencia: updated.ano_referencia,
                        removido_em: null,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada no projeto.`,
                        400
                    );
                }

                // dispara a trigger
                await prismaTxn.dotacaoPlanejado.update({
                    where: { id: dotacaoTx.id },
                    data: { id: dotacaoTx.id },
                });
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return { id: orcamentoPlanejado.id };
    }

    async findAll(
        tipo: TipoProjeto,
        projeto: ProjetoDetailDto,
        filters: FilterPPOrcamentoPlanejadoDto,
        user: PessoaFromJwt
    ): Promise<PPOrcamentoPlanejadoDto[]> {
        const queryRows = await this.prisma.orcamentoPlanejado.findMany({
            where: {
                projeto_id: projeto.id,
                projeto: { tipo, id: projeto.id },
                removido_em: null,
                dotacao: filters?.dotacao,
                ano_referencia: filters.ano_referencia, // obrigatório para que o 'join' com a dotação seja feito sem complicações
            },
            select: {
                criador: { select: { nome_exibicao: true } },
                valor_planejado: true,
                ano_referencia: true,
                dotacao: true,
                criado_em: true,
                id: true,
                projeto_id: true,
            },
            orderBy: [{ meta_id: 'asc' }, { iniciativa_id: 'asc' }, { atividade_id: 'asc' }, { id: 'asc' }],
        });

        const dotacoesEncontradas: Record<string, boolean> = {};
        for (const op of queryRows) {
            if (dotacoesEncontradas[op.dotacao] == undefined) dotacoesEncontradas[op.dotacao] = true;
        }

        const dotacoesSomaInfo = await this.prisma.portfolioDotacaoPlanejado.findMany({
            where: {
                portfolio_id: projeto.portfolio_id,
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                soma_valor_planejado: true,
                pressao_orcamentaria: true,
                dotacao: true,
            },
        });
        const dotacoesSomaRef: Record<string, (typeof dotacoesSomaInfo)[0]> = {};
        for (const dotacao of dotacoesSomaInfo) {
            dotacoesSomaRef[dotacao.dotacao] = dotacao;
        }

        const dotacoesInfo = await this.prisma.dotacaoPlanejado.findMany({
            where: {
                dotacao: { in: Object.keys(dotacoesEncontradas) },
                ano_referencia: filters.ano_referencia,
            },
            select: {
                val_orcado_atualizado: true,
                val_orcado_inicial: true,
                saldo_disponivel: true,
                dotacao: true,
            },
        });
        const dotacoesRef: Record<string, (typeof dotacoesInfo)[0]> = {};
        for (const dotacao of dotacoesInfo) {
            dotacoesRef[dotacao.dotacao] = dotacao;
        }

        const rows: PPOrcamentoPlanejadoDto[] = [];

        for (const orcamentoPlanejado of queryRows) {
            let pressao_orcamentaria: boolean | null = null;
            let pressao_orcamentaria_valor: string | null = null;
            let smae_soma_valor_planejado: string | null = null;

            let val_orcado_atualizado: string | null = null;
            let val_orcado_inicial: string | null = null;
            let saldo_disponivel: string | null = null;

            const dotacaoInfo = dotacoesRef[orcamentoPlanejado.dotacao];
            const dotacaoSomaInfo = dotacoesSomaRef[orcamentoPlanejado.dotacao] || {
                soma_valor_planejado: new Decimal(0),
                pressao_orcamentaria: false,
                dotacao: '',
            };

            if (dotacaoInfo) {
                pressao_orcamentaria = dotacaoSomaInfo.pressao_orcamentaria;
                if (pressao_orcamentaria) {
                    pressao_orcamentaria_valor = Number(
                        +dotacaoSomaInfo.soma_valor_planejado - +dotacaoInfo.val_orcado_atualizado
                    ).toFixed(2);
                }

                smae_soma_valor_planejado = dotacaoSomaInfo.soma_valor_planejado.toFixed(2);
                val_orcado_atualizado = dotacaoInfo.val_orcado_atualizado.toFixed(2);
                val_orcado_inicial = dotacaoInfo.val_orcado_inicial.toFixed(2);
                saldo_disponivel = dotacaoInfo.saldo_disponivel.toFixed(2);
            }

            rows.push({
                id: orcamentoPlanejado.id,
                ano_referencia: orcamentoPlanejado.ano_referencia,
                projeto_id: orcamentoPlanejado.projeto_id!,

                criado_em: orcamentoPlanejado.criado_em,
                criador: orcamentoPlanejado.criador,
                dotacao: orcamentoPlanejado.dotacao,
                valor_planejado: orcamentoPlanejado.valor_planejado,
                pressao_orcamentaria,
                pressao_orcamentaria_valor,

                // campos da dotação/sof
                smae_soma_valor_planejado,
                val_orcado_atualizado,
                val_orcado_inicial,
                saldo_disponivel,
                // campos pra ser populado depois
                projeto_atividade: '',
            });
        }
        await this.dotacaoService.setManyProjetoAtividade(rows);

        return rows;
    }

    async remove(tipo: TipoProjeto, projeto_id: number, id: number, user: PessoaFromJwt) {
        const orcamentoPlanejado = await this.prisma.orcamentoPlanejado.findFirst({
            where: { id: +id, removido_em: null, projeto_id, projeto: { tipo, id: projeto_id } },
        });
        if (!orcamentoPlanejado) throw new HttpException('Orçamento planejado não encontrado', 404);

        const now = new Date(Date.now());

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const linhasAfetadas = await prismaTxn.orcamentoPlanejado.updateMany({
                    where: { id: +id, removido_em: null, projeto_id }, // nao apagar duas vezes
                    data: { removido_em: now, removido_por: user.id },
                });

                if (linhasAfetadas.count == 1) {
                    const dotacaoAgora = await prismaTxn.dotacaoPlanejado.findFirstOrThrow({
                        where: {
                            dotacao: orcamentoPlanejado.dotacao,
                            ano_referencia: orcamentoPlanejado.ano_referencia,
                        },
                        select: { id: true },
                    });

                    // dispara a trigger
                    await prismaTxn.dotacaoPlanejado.update({
                        where: { id: dotacaoAgora.id },
                        data: { id: dotacaoAgora.id },
                    });
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );
    }
}
