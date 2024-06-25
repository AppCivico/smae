import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoProxyPdmMetaDto } from './entities/projeto.proxy-pdm-meta.entity';

@Injectable()
export class ProjetoProxyPdmMetasService {
    constructor(private readonly prisma: PrismaService) {}
    async findAll(): Promise<ProjetoProxyPdmMetaDto[]> {
        const rows = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
                tipo: 'PDM',
            },
            orderBy: [{ ativo: 'desc' }, { atualizado_em: 'desc' }],
            select: {
                id: true,
                nome: true,
                ativo: true,
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
                metas: r.Meta,
            };
        });
    }
}
