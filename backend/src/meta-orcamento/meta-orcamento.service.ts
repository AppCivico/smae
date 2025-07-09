import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateMetaOrcamentoDto,
    FilterMetaOrcamentoDto,
    OrcamentoPrevistoEhZeroStatusDto,
    UpdateMetaOrcamentoDto,
    UpdateOrcamentoPrevistoZeradoDto,
} from './dto/meta-orcamento.dto';
import { MetaOrcamento } from './entities/meta-orcamento.entity';
import { PlanoSetorialController } from '../pdm/pdm.controller';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';

export class MetaOrcamentoUpdatedRet {
    id: number;
    new_id: number;
}
@Injectable()
export class MetaOrcamentoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
        private readonly dotacaoService: DotacaoService
    ) {}

    async create(tipo: TipoPdmType, dto: CreateMetaOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        await user.verificaPermissaoOrcamentoPontoFocal(tipo, meta_id, this.prisma);

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, previsao_custo_disponivel: true },
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const countExisting = await prismaTxn.orcamentoPrevisto.count({
                    where: {
                        meta_id,
                        iniciativa_id,
                        atividade_id,
                        parte_dotacao: dto.parte_dotacao,
                        removido_em: null,
                        ultima_revisao: true,
                        ano_referencia: dto.ano_referencia,
                    },
                });
                if (countExisting) {
                    // TODO puxar o rotulo do PDM
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada na ${categoria}.`,
                        400
                    );
                }

                const metaOrcamento = await prismaTxn.orcamentoPrevisto.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,

                        ultima_revisao: true,
                        meta_id: meta_id,
                        iniciativa_id,
                        atividade_id,
                        ano_referencia: dto.ano_referencia,

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

        // se por acaso tiver algum boolean zerado, remove ele
        await this.patchZerado(
            tipo,
            { ano_referencia: dto.ano_referencia, meta_id: meta.id, considerar_zero: false },
            user
        );

        return created;
    }

    async findAll(tipo: TipoPdmType, filters: FilterMetaOrcamentoDto, user: PessoaFromJwt): Promise<MetaOrcamento[]> {
        let filterIdIn: undefined | number[] = undefined;

        if (
            !user.hasSomeRoles([
                'CadastroMeta.administrador_orcamento',
                // TODO PS permissão de admin de meta
                // ver comentário em src/orcamento-realizado/orcamento-realizado.service.ts
                ...PlanoSetorialController.OrcamentoWritePerms,
            ])
        )
            filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_responsavel_orcamento);

        const metaOrcamentos = await this.prisma.orcamentoPrevisto.findMany({
            where: {
                AND: [{ meta_id: filters?.meta_id }, { meta_id: filterIdIn ? { in: filterIdIn } : undefined }],
                ano_referencia: filters?.ano_referencia,
                removido_em: null,
                ultima_revisao: true,
                meta_id: { not: null },
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
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
                meta: { ...r.meta! },
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.dotacaoService.expandirParteDotacao(r.parte_dotacao),
            };
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return list;
    }

    async update(
        tipo: TipoPdmType,
        id: number,
        dto: UpdateMetaOrcamentoDto,
        user: PessoaFromJwt
    ): Promise<MetaOrcamentoUpdatedRet> {
        const alreadyUpdated = await this.prisma.orcamentoPrevisto.count({
            where: {
                versao_anterior_id: +id,
            },
        });
        if (alreadyUpdated) throw new HttpException('meta orçamento já foi atualizado, atualize a página', 400);

        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        await user.verificaPermissaoOrcamentoPontoFocal(tipo, meta_id, this.prisma);

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!metaOrcamento) throw new HttpException('meta orçamento não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: {
                pdm_id: meta.pdm_id,
                ano_referencia: metaOrcamento.ano_referencia,
                previsao_custo_disponivel: true,
            },
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const new_id = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<number> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prismaTxn.orcamentoPrevisto.update({
                    where: {
                        id: +id,
                        meta_id: meta_id!,
                    },
                    data: {
                        atualizado_em: now,
                        atualizado_por: user.id,
                        ultima_revisao: false,
                    },
                    select: {
                        id: true,
                        meta_id: true,
                        iniciativa_id: true,
                        atividade_id: true,
                        parte_dotacao: true,
                        custo_previsto: true,
                        ano_referencia: true,
                    },
                });

                const metaOrcamentoAtualizado = await prismaTxn.orcamentoPrevisto.create({
                    data: {
                        versao_anterior_id: metaOrcamento.id,

                        meta_id,
                        iniciativa_id,
                        atividade_id,
                        ultima_revisao: true,

                        ano_referencia: metaOrcamento.ano_referencia,

                        custo_previsto: dto.custo_previsto || metaOrcamento.custo_previsto,
                        parte_dotacao: dto.parte_dotacao || metaOrcamento.parte_dotacao,

                        criado_por: user.id,
                    },
                    select: { id: true, parte_dotacao: true, ano_referencia: true },
                });

                const countExisting = await prismaTxn.orcamentoPrevisto.count({
                    where: {
                        meta_id,
                        iniciativa_id,
                        atividade_id,
                        parte_dotacao: metaOrcamentoAtualizado.parte_dotacao,
                        NOT: { id: metaOrcamentoAtualizado.id },
                        removido_em: null,
                        ultima_revisao: true,
                        ano_referencia: metaOrcamentoAtualizado.ano_referencia,
                    },
                });
                if (countExisting) {
                    // TODO puxar o rotulo do PDM
                    const categoria = atividade_id ? 'atividade' : iniciativa_id ? 'iniciativa' : 'meta';
                    throw new HttpException(
                        `Já existe um registro com a mesma dotação orçamentária associada na ${categoria}.`,
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

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!metaOrcamento || metaOrcamento.meta_id == null)
            throw new HttpException('meta orçamento não encontrada', 400);

        await user.verificaPermissaoOrcamentoPontoFocal(tipo, metaOrcamento.meta_id, this.prisma);

        const now = new Date(Date.now());
        await this.prisma.orcamentoPrevisto.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id },
        });
    }

    async orcamento_previsto_zero(
        tipo: TipoPdmType,
        meta_id: number,
        ano_referencia: number
    ): Promise<OrcamentoPrevistoEhZeroStatusDto> {
        const opz = await this.prisma.orcamentoPrevistoZerado.findFirst({
            where: {
                meta_id: meta_id,
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

    async patchZerado(tipo: TipoPdmType, dto: UpdateOrcamentoPrevistoZeradoDto, user: PessoaFromJwt): Promise<void> {
        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            // apaga/remove todas versões anteriores não removidas
            await prismaTxn.orcamentoPrevistoZerado.updateMany({
                where: {
                    meta_id: dto.meta_id,
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
                        meta_id: dto.meta_id,
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
                        meta_id: dto.meta_id,
                        ano_referencia: dto.ano_referencia,
                        criado_por: user.id,
                        criado_em: now,
                    },
                });
            }
        });
    }
}
