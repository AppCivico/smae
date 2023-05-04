import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { DotacaoService } from '../../dotacao/dotacao.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrcamentoPrevistoDto, FilterOrcamentoPrevistoDto } from './dto/create-orcamento-previsto.dto';
import { OrcamentoPrevistoDto } from './entities/orcamento-previsto.entity';
import { UpdateOrcamentoPrevistoDto } from './dto/create-orcamento-previsto.dto';

export class ProjetoOrcamentoUpdatedRet {
    id: number;
    new_id: number;
}

@Injectable()
export class OrcamentoPrevistoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly dotacaoService: DotacaoService
    ) { }

    async create(projeto_id: number, dto: CreateOrcamentoPrevistoDto, user: PessoaFromJwt): Promise<RecordWithId> {


        // não tem meta, logo, não tem ciclo/PDM, provavelmente vamos criar outra table
        //const anoCount = await this.prisma.pdmOrcamentoConfig.count({
        //  where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, previsao_custo_disponivel: true },
        //});
        //if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prisma.orcamentoPrevisto.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,

                        projeto_id,
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

    async findAll(projeto_id: number, filters: FilterOrcamentoPrevistoDto, user: PessoaFromJwt): Promise<OrcamentoPrevistoDto[]> {
        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles(['CadastroMeta.orcamento', 'PDM.admin_cp'])) {
            // logo, é um tecnico_cp
            filterIdIn = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
        }

        const metaOrcamentos = await this.prisma.orcamentoPrevisto.findMany({
            where: {
                AND: [{ meta_id: filterIdIn ? { in: filterIdIn } : undefined }],
                ano_referencia: filters?.ano_referencia,
                removido_em: null,
                versao_anterior_id: null,
                projeto_id,
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

        const list = metaOrcamentos.map(r => {
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


    async update(projeto_id: number, id: number, dto: UpdateOrcamentoPrevistoDto, user: PessoaFromJwt): Promise<ProjetoOrcamentoUpdatedRet> {

        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: { id: +id, removido_em: null, projeto_id, },
        });
        if (!metaOrcamento) throw new HttpException('projeto orçamento não encontrada', 400);

        //const anoCount = await this.prisma.pdmOrcamentoConfig.count({
        //    where: { pdm_id: meta.pdm_id, ano_referencia: metaOrcamento.ano_referencia, previsao_custo_disponivel: true },
        //});
        //if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const new_id = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<number> => {
                const now = new Date(Date.now());

                const metaOrcamento = await prisma.orcamentoPrevisto.update({
                    where: {
                        id: +id,
                    },
                    data: {
                        projeto_id,

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

                const metaOrcamentoAtualizado = await prisma.orcamentoPrevisto.create({
                    data: {
                        versao_anterior_id: metaOrcamento.id,

                        projeto_id,

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

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        const metaOrcamento = await this.prisma.orcamentoPrevisto.findFirst({
            where: { id: +id, removido_em: null, projeto_id },
        });
        if (!metaOrcamento || metaOrcamento.projeto_id == null) throw new HttpException('projeto orçamento não encontrada', 400);

        const now = new Date(Date.now());
        await this.prisma.orcamentoPrevisto.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id },
        });
    }
}
