import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrcamentoPlanejadoDto, FilterOrcamentoPlanejadoDto } from './dto/orcamento-planejado.dto';
import { OrcamentoPlanejado } from './entities/orcamento-planejado.entity';

@Injectable()
export class OrcamentoPlanejadoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateOrcamentoPlanejadoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const meta = await this.prisma.meta.findFirst({
            where: { id: dto.meta_id, removido_em: null },
            select: { pdm_id: true, id: true }
        });
        if (!meta) throw new HttpException('meta não encontrada', 400);

        const anoCount = await this.prisma.pdmOrcamentoConfig.count({
            where: { pdm_id: meta.pdm_id, ano_referencia: dto.ano_referencia, planejado_disponivel: true }
        });
        if (!anoCount) throw new HttpException('Ano de referencia não encontrado ou não está com o planejamento liberado', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const now = new Date(Date.now());

            const oP = await prisma.orcamentoPlanejado.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    meta_id: meta.id,
                    ano_referencia: dto.ano_referencia,
                    dotacao: dto.dotacao,
                    valor_planejado: dto.valor_planejado,
                },
                select: { id: true }
            });

            return oP;
        }, {
            maxWait: 5000,
            timeout: 100000
        });

        return created;
    }

    async findAll(filters?: FilterOrcamentoPlanejadoDto): Promise<OrcamentoPlanejado[]> {

        return [];
    }

    async remove(id: number, user: PessoaFromJwt) {
        const op = await this.prisma.orcamentoPlanejado.count({
            where: { id: +id, removido_em: null }
        });
        if (!op) throw new HttpException('orcamento planejado não encontrada', 400);

        const now = new Date(Date.now());
        await this.prisma.orcamentoPlanejado.updateMany({
            where: { id: +id, removido_em: null },
            data: { removido_em: now, removido_por: user.id }
        });
    }


}
