import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { DotacaoService } from '../dotacao/dotacao.service';
import { OrcamentoPlanejadoService } from '../orcamento-planejado/orcamento-planejado.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetaOrcamentoDto, FilterMetaOrcamentoDto, UpdateMetaOrcamentoDto } from './dto/meta-orcamento.dto';
import { MetaOrcamento } from './entities/meta-orcamento.entity';

@Injectable()
export class MetaOrcamentoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orcamentoPlanejado: OrcamentoPlanejadoService,
        private readonly dotacaoService: DotacaoService,
    ) { }

    async create(dto: CreateMetaOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: dto.meta_id, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, previsao_custo_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());


            const metaOrcamento = await prisma.metaOrcamento.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,

                    meta_id: meta_id!,
                    iniciativa_id,
                    atividade_id,
                    ano_referencia: dto.ano_referencia,

                    custeio_previsto: dto.custeio_previsto,
                    investimento_previsto: dto.investimento_previsto,
                    parte_dotacao: dto.parte_dotacao,

                },
                select: { id: true }
            });

            return metaOrcamento;
        }, {
            maxWait: 5000,
            timeout: 100000
        });

        return created;
    }

    async findAll(filters?: FilterMetaOrcamentoDto): Promise<MetaOrcamento[]> {

        const metaOrcamentos = await this.prisma.metaOrcamento.findMany({
            where: {
                meta_id: filters?.meta_id,
                ano_referencia: filters?.ano_referencia,
                removido_em: null,
            },
            select: {
                id: true,
                criador: { select: { nome_exibicao: true } },
                meta: { select: { id: true, codigo: true, titulo: true } },
                atividade: { select: { id: true, codigo: true, titulo: true } },
                iniciativa: { select: { id: true, codigo: true, titulo: true } },
                criado_em: true,
                ano_referencia: true,
                custeio_previsto: true,
                investimento_previsto: true,
                parte_dotacao: true,
            },
            orderBy: [
                { meta_id: 'asc' },
                { criado_em: 'desc' },
            ]
        });

        let list =  metaOrcamentos.map((r) => {
            return {
                ...r,
                custeio_previsto: r.custeio_previsto.toFixed(2),
                investimento_previsto: r.investimento_previsto.toFixed(2),
                projeto_atividade: ''
            }
        });
        await this.dotacaoService.setManyProjetoAtividade(list);

        return list;
    }

    async update(id: number, dto: UpdateMetaOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const { meta_id, iniciativa_id, atividade_id } = await this.orcamentoPlanejado.validaMetaIniAtv(dto);

        const meta = await this.prisma.meta.findFirst({
            where: { id: dto.meta_id, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const metaOrcamento = await this.prisma.metaOrcamento.findFirst({
            where: { id: +id, removido_em: null }
        });
        if (!metaOrcamento) throw new HttpException('meta orçamento não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: metaOrcamento.ano_referencia, previsao_custo_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);


        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {

            const now = new Date(Date.now());

            const metaOrcamento = await prisma.metaOrcamento.updateMany({
                where: {
                    id: +id
                },
                data: {
                    meta_id: meta_id!,
                    iniciativa_id,
                    atividade_id,

                    custeio_previsto: dto.custeio_previsto,
                    investimento_previsto: dto.investimento_previsto,
                    parte_dotacao: dto.parte_dotacao,

                }
            });
        }, {
            maxWait: 5000,
            timeout: 100000
        });

        return { id: id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const metaOrcamento = await this.prisma.metaOrcamento.count({
            where: { id: +id, removido_em: null }
        });
        if (!metaOrcamento) throw new HttpException('meta orçamento não encontrada', 400);

        const now = new Date(Date.now());
        await this.prisma.metaOrcamento.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id }
        });
    }

}
