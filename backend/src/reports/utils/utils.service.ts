import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FiltroMetasIniAtividadeDto } from '../reports/dto/filtros.dto';

@Injectable()
export class UtilsService {

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async applyFilter(filters: FiltroMetasIniAtividadeDto, getResult: { atividades: boolean, iniciativas: boolean }) {

        const tags = Array.isArray(filters.tags) && filters.tags.length > 0 ? filters.tags : [];

        const metas = await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        });

        // aqui há uma duvida, se devemos buscar as iniciativas q deram match nas metas, ou se pelo filtro
        const iniciativas = getResult.iniciativas ? await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        }) : [];

        const atividades = getResult.atividades ? await this.prisma.meta.findMany({
            where: {
                pdm_id: filters.pdm_id,
                removido_em: null,
                id: filters.meta_id ? filters.meta_id : undefined,
                meta_tag: tags.length === 0 ? undefined : { some: { tag_id: { in: tags } } }
            },
            select: { id: true }
        }) : [];

        return {
            atividades,
            iniciativas,
            metas
        }
    }
}
