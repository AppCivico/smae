import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoProxyPdmMetaDto } from './entities/projeto.proxy-pdm-meta.entity';
import { FilterPdmOrNotDto } from './dto/create-projeto.dto';

@Injectable()
export class ProjetoProxyPdmMetasService {
    constructor(private readonly prisma: PrismaService) {}
    async findAll(filters: FilterPdmOrNotDto): Promise<ProjetoProxyPdmMetaDto[]> {
        if (filters.apenas_pdm === undefined) filters.apenas_pdm = true;
        const rows = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
                tipo: filters.apenas_pdm ? 'PDM' : undefined,
            },
            orderBy: [{ ativo: 'desc' }, { atualizado_em: 'desc' }],
            select: {
                id: true,
                nome: true,
                ativo: true,
                tipo: true,
                rotulo_iniciativa: true,
                rotulo_atividade: true,
                Meta: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: [{ codigo: 'asc' }, { atualizado_em: 'desc' }],
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                nome: r.nome,
                ativo: r.ativo,
                tipo: r.tipo,
                metas: r.Meta,
                rotulo_atividade: r.rotulo_atividade,
                rotulo_iniciativa: r.rotulo_iniciativa,
            } satisfies ProjetoProxyPdmMetaDto;
        });
    }
}
