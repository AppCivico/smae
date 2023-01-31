import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetaOrcamentoDto, FilterMetaOrcamentoDto, UpdateMetaOrcamentoDto } from './dto/meta-orcamento.dto';
import { MetaOrcamento } from './entities/meta-orcamento.entity';

export class MetaOrcamentoUpdatedRet {
    id: number;
    new_id: number;
}
@Injectable()
export class MetaOrcamentoService {
    constructor(private readonly prisma: PrismaService, private readonly orcamentoPlanejado: OrcamentoPlanejadoService, private readonly dotacaoService: DotacaoService) {}

    async create(dto: CreateMetaOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);
        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(meta_id) == false) {
                throw new HttpException('Sem permissão para editar orçamento', 400);
            }
        }

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, previsao_custo_disponivel: true },
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prisma.metaOrcamento.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,

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
            },
        );

        return created;
    }

    async findAll(filters: FilterMetaOrcamentoDto, user: PessoaFromJwt): Promise<MetaOrcamento[]> {
        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
        }

        const metaOrcamentos = await this.prisma.metaOrcamento.findMany({
            where: {
                AND: [{ meta_id: filters?.meta_id }, { meta_id: filterIdIn ? { in: filterIdIn } : undefined }],
                ano_referencia: filters?.ano_referencia,
                removido_em: null,
                versao_anterior_id: null,
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

        const list = metaOrcamentos.map(r => {
            return {
                ...r,
                custo_previsto: r.custo_previsto.toFixed(2),
                projeto_atividade: '',
                parte_dotacao: this.expandirParteDotacao(r.parte_dotacao),
            };
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return list;
    }

    // 11.13.08.091.*.1.278.*.00 => 11.13.08.091.****.1.278.********.00
    // 11.*.08.091.*.1.278.*.00 => 11.**.08.091.****.1.278.********.00
    private expandirParteDotacao(parte_dotacao: string): string {
        const partes = parte_dotacao.split('.');
        if ((partes[1] = '*')) partes[1] = '**';
        if ((partes[4] = '*')) partes[4] = '****';
        if ((partes[7] = '*')) partes[7] = '********';
        return partes.join('.');
    }

    async update(id: number, dto: UpdateMetaOrcamentoDto, user: PessoaFromJwt): Promise<MetaOrcamentoUpdatedRet> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(meta_id) == false) {
                throw new HttpException('Sem permissão para editar orçamento', 400);
            }
        }

        const meta = await this.prisma.meta.findFirst({
            where: { id: dto.meta_id, removido_em: null },
            select: { pdm_id: true, id: true },
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const metaOrcamento = await this.prisma.metaOrcamento.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!metaOrcamento) throw new HttpException('meta orçamento não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: metaOrcamento.ano_referencia, previsao_custo_disponivel: true },
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const new_id = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<number> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prisma.metaOrcamento.update({
                    where: {
                        id: +id,
                    },
                    data: {
                        meta_id: meta_id!,
                        iniciativa_id,
                        atividade_id,

                        atualizado_em: now,
                        atualizado_por: user.id,
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

                const metaOrcamentoAtualizado = await prisma.metaOrcamento.create({
                    data: {
                        versao_anterior_id: metaOrcamento.id,

                        meta_id,
                        iniciativa_id,
                        atividade_id,

                        ano_referencia: metaOrcamento.ano_referencia,

                        custo_previsto: dto.custo_previsto || metaOrcamento.custo_previsto,
                        parte_dotacao: dto.parte_dotacao || metaOrcamento.parte_dotacao,

                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                return metaOrcamentoAtualizado.id;
            },
            {
                maxWait: 5000,
                timeout: 100000,
            },
        );

        return { id: id, new_id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const metaOrcamento = await this.prisma.metaOrcamento.findFirst({
            where: { id: +id, removido_em: null },
        });
        if (!metaOrcamento) throw new HttpException('meta orçamento não encontrada', 400);

        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            const filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            if (filterIdIn.includes(metaOrcamento.meta_id) == false) {
                throw new HttpException('Sem permissão para remover orçamento', 400);
            }
        }

        const now = new Date(Date.now());
        await this.prisma.metaOrcamento.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id },
        });
    }
}
