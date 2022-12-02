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

        let meta_id: number;
        let iniciativa_id: number | undefined;
        let atividade_id: number | undefined;
        if (dto.atividade_id) {  // prioridade buscar pela atividade
            const atividade = await this.prisma.atividade.findFirst({
                where: { id: dto.atividade_id, removido_em: null },
                select: { id: true, iniciativa_id: true, iniciativa: { select: { meta_id: true } } }
            });
            if (!atividade) throw new HttpException('atividade não encontrada', 400);
            atividade_id = atividade.id;
            iniciativa_id = atividade.iniciativa_id;
            meta_id = atividade.iniciativa.meta_id;

        } else if (dto.iniciativa_id) {
            const iniciativa = await this.prisma.iniciativa.findFirst({
                where: { id: dto.iniciativa_id, removido_em: null },
                select: { id: true, meta_id: true }
            });
            if (!iniciativa) throw new HttpException('iniciativa não encontrada', 400);
            iniciativa_id = iniciativa.id;
            meta_id = iniciativa.meta_id;

        } else if (dto.meta_id) {
            meta_id = dto.meta_id;
        } else {
            new HttpException('é necessário informar: meta, iniciativa ou atividade', 400);
        }

        const meta = await this.prisma.meta.findFirst({
            where: { id: meta_id!, removido_em: null },
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
                    meta_id,
                    iniciativa_id,
                    atividade_id,
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
