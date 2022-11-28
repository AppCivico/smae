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
        // aguardar o Lucas fazer a parte que popula essa tabela quando muda o PDM
        // pra fazer esse HttpException
        //if (!anoCount) throw new HttpException('Ano de referencia não encontrado, verifique se está ativo no PDM', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());

            await prisma.metaOrcamento.updateMany({
                where: { meta_id: meta.id, ano_referencia: dto.ano_referencia, ultima_revisao: true },
                data: { ultima_revisao: false },
            });

            const metaOrcamento = await prisma.metaOrcamento.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    ultima_revisao: true,
                    meta_id: meta.id,
                    ano_referencia: dto.ano_referencia,
                    custeio_previsto: dto.custeio_previsto,
                    investimento_previsto: dto.investimento_previsto,
                    parte_dotacao: dto.parte_dotacao
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

        return [];
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
