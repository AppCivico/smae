import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, TipoProjeto } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { OrcamentoPrevistoEhZeroStatusDto } from '../../meta-orcamento/dto/meta-orcamento.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateOrcamentoPrevistoDto,
    FilterOrcamentoPrevistoDto,
    ProjetoUpdateOrcamentoPrevistoZeradoDto,
    UpdateOrcamentoPrevistoDto,
} from './dto/create-orcamento-previsto.dto';
import { OrcamentoPrevistoDto } from './entities/orcamento-previsto.entity';

export class ProjetoOrcamentoUpdatedRet {
    id: number;
    new_id: number;
}

@Injectable()
export class OrcamentoPrevistoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async create(
        tipo: TipoProjeto,
        projeto_id: number,
        dto: CreateOrcamentoPrevistoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        // não tem meta, logo, não tem ciclo/PDM, provavelmente vamos criar outra table

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const projetoPortfolio = await prismaTxn.projeto.findFirstOrThrow({
                    where: { id: projeto_id, tipo },
                    select: {
                        portfolio: {
                            select: { modelo_clonagem: true },
                        },
                    },
                });
                if (projetoPortfolio.portfolio.modelo_clonagem)
                    throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

                const now = new Date(Date.now());

                const countExisting = await prismaTxn.orcamentoPrevisto.count({
                    where: {
                        projeto_id,
                        parte_dotacao: dto.parte_dotacao,
                        removido_em: null,
                        ano_referencia: dto.ano_referencia,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada no projeto.`,
                        400
                    );
                }

                const metaOrcamento = await prismaTxn.orcamentoPrevisto.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,

                        projeto_id,
                        ano_referencia: dto.ano_referencia,
                        ultima_revisao: true,

                        custo_previsto: dto.custo_previsto,
                        parte_dotacao: dto.parte_dotacao,
                    },
                    select: { id: true },
                });

                return metaOrcamento;
            },
            {
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return created;
    }

    async findAll(
        tipo: TipoProjeto,
        projeto_id: number,
        filters: FilterOrcamentoPrevistoDto,
        user: PessoaFromJwt
    ): Promise<OrcamentoPrevistoDto[]> {
        const metaOrcamentos = await this.prisma.orcamentoPrevisto.findMany({
            where: {
                ano_referencia: filters?.ano_referencia,
                removido_em: null,
                ultima_revisao: true,
                projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
                meta_id: null,
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                projeto_id: true,
                criado_em: true,
                ano_referencia: true,
                custo_previsto: true,
                parte_dotacao: true,
                atualizado_em: true,
            },
            orderBy: [{ meta_id: 'asc' }, { criado_em: 'desc' }],
        });

        const list = metaOrcamentos.map((r) => {
            return {
                ...r,
                projeto_id: r.projeto_id!,
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.dotacaoService.expandirParteDotacao(r.parte_dotacao),
            };
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return list;
    }

    async update(
        tipo: TipoProjeto,
        projeto_id: number,
        id: number,
        dto: UpdateOrcamentoPrevistoDto,
        user: PessoaFromJwt
    ): Promise<ProjetoOrcamentoUpdatedRet> {
        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: {
                id: +id,
                removido_em: null,
                projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
            },
        });
        if (!metaOrcamento) throw new HttpException('projeto orçamento não encontrada', 400);

        const alreadyUpdated = await this.prisma.orcamentoPrevisto.count({
            where: {
                versao_anterior_id: +id,
            },
        });
        if (alreadyUpdated) throw new HttpException('projeto orçamento já foi atualizado, atualize a página', 400);

        const new_id = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prismaTxn.orcamentoPrevisto.update({
                    where: {
                        id: +id,
                        projeto_id,
                    },
                    data: {
                        atualizado_em: now,
                        atualizado_por: user.id,
                        ultima_revisao: false,
                    },
                    select: {
                        id: true,
                        parte_dotacao: true,
                        custo_previsto: true,
                        ano_referencia: true,
                    },
                });

                const metaOrcamentoAtualizado = await prismaTxn.orcamentoPrevisto.create({
                    data: {
                        versao_anterior_id: metaOrcamento.id,

                        ultima_revisao: true,
                        projeto_id,

                        ano_referencia: metaOrcamento.ano_referencia,

                        custo_previsto: dto.custo_previsto || metaOrcamento.custo_previsto,
                        parte_dotacao: dto.parte_dotacao || metaOrcamento.parte_dotacao,

                        criado_por: user.id,
                    },
                    select: { id: true, parte_dotacao: true, ano_referencia: true },
                });

                const countExisting = await prismaTxn.orcamentoPrevisto.count({
                    where: {
                        projeto_id,
                        parte_dotacao: metaOrcamentoAtualizado.parte_dotacao,
                        NOT: { id: metaOrcamentoAtualizado.id },
                        removido_em: null,
                        ultima_revisao: true,
                        ano_referencia: metaOrcamentoAtualizado.ano_referencia,
                    },
                });
                if (countExisting) {
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada no projeto.`,
                        400
                    );
                }

                return metaOrcamentoAtualizado.id;
            },
            {
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return { id: id, new_id };
    }

    async remove(tipo: TipoProjeto, projeto_id: number, id: number, user: PessoaFromJwt) {
        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: {
                id: +id,
                removido_em: null,
                projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
            },
        });
        if (!metaOrcamento || metaOrcamento.projeto_id == null)
            throw new HttpException('projeto orçamento não encontrada', 400);

        const now = new Date(Date.now());
        await this.prisma.orcamentoPrevisto.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id },
        });
    }

    async orcamento_previsto_zero(
        tipo: TipoProjeto,
        projeto_id: number,
        ano_referencia: number
    ): Promise<OrcamentoPrevistoEhZeroStatusDto> {
        const opz = await this.prisma.orcamentoPrevistoZerado.findFirst({
            where: {
                projeto_id: projeto_id,
                projeto: { tipo: tipo, id: projeto_id },
                ano_referencia: ano_referencia,
                removido_em: null,
            },
            select: {
                criador: { select: { id: true, nome_exibicao: true } },
                criado_em: true,
            },
        });
        if (opz) {
            return {
                previsto_eh_zero: true,
                previsto_eh_zero_criado_por: opz.criador,
                previsto_eh_zero_criado_em: opz.criado_em,
            };
        }

        return {
            previsto_eh_zero: false,
            previsto_eh_zero_criado_por: null,
            previsto_eh_zero_criado_em: null,
        };
    }

    async patchZerado(
        tipo: TipoProjeto,
        projeto_id: number,
        dto: ProjetoUpdateOrcamentoPrevistoZeradoDto,
        user: PessoaFromJwt
    ): Promise<void> {
        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            // apaga/remove todas versões anteriores não removidas
            await prismaTxn.orcamentoPrevistoZerado.updateMany({
                where: {
                    projeto_id: projeto_id,
                    projeto: { tipo: tipo, id: projeto_id },
                    ano_referencia: dto.ano_referencia,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });

            // se é pra considerar zero, cria uma nova linha
            if (dto.considerar_zero) {
                const count = await prismaTxn.orcamentoPrevisto.count({
                    where: {
                        projeto_id: projeto_id,
                        removido_em: null,
                        ultima_revisao: true,
                        ano_referencia: dto.ano_referencia,
                    },
                });
                if (count > 0)
                    throw new HttpException(
                        `Para usar o ano ${dto.ano_referencia} como R$ 0,00, é necessário não ter nenhum registro de custo previsto.`,
                        400
                    );

                await prismaTxn.orcamentoPrevistoZerado.create({
                    data: {
                        projeto_id: projeto_id,
                        ano_referencia: dto.ano_referencia,
                        criado_por: user.id,
                        criado_em: now,
                    },
                });
            }
        });
    }
}
