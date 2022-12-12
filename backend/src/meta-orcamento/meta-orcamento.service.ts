import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMetaOrcamentoDto, FilterMetaOrcamentoDto } from './dto/meta-orcamento.dto';
import { MetaOrcamento } from './entities/meta-orcamento.entity';

@Injectable()
export class MetaOrcamentoService {
    constructor(private readonly prisma: PrismaService) { }

    async upsert(dto: CreateMetaOrcamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {

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

            await prisma.metaOrcamento.updateMany({
                where: { meta_id: meta.id, ano_referencia: dto.ano_referencia, ultima_revisao: true },
                data: { ultima_revisao: false },
            });

            const soma_custeio_previsto = dto.itens.reduce((acc, item) => acc + item.custeio_previsto, 0);
            const soma_investimento_previsto = dto.itens.reduce((acc, item) => acc + item.investimento_previsto, 0);

            const metaOrcamento = await prisma.metaOrcamento.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    ultima_revisao: true,
                    meta_id: meta.id,
                    ano_referencia: dto.ano_referencia,
                    soma_custeio_previsto,
                    soma_investimento_previsto,
                    itens: {
                        createMany: {
                            data: dto.itens.map((item) => {
                                return {
                                    custeio_previsto: item.custeio_previsto,
                                    investimento_previsto: item.investimento_previsto,
                                    parte_dotacao: item.parte_dotacao,
                                }
                            })
                        }
                    }
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
                ultima_revisao: (filters?.apenas_ultima_revisao == undefined ? true : filters?.apenas_ultima_revisao) ? true : undefined,
                removido_em: null,
            },
            select: {
                id: true,
                meta_id: true,
                criado_em: true,
                criador: {
                    select: { nome_exibicao: true }
                },
                ano_referencia: true,
                soma_custeio_previsto: true,
                ultima_revisao: true,
                soma_investimento_previsto: true,
                itens: true
            },
            orderBy: [
                { meta_id: 'asc' },
                { criado_em: 'desc' },
            ]
        });

        return metaOrcamentos;
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
