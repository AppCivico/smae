import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RelMfMetas, RetMonitoramentoFisico } from './entities/monitoramento-mensal.entity';



@Injectable()
export class MonitoramentoMensalMfService {

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async create_mf(dto: CreateRelMonitoramentoMensalDto, metas: number[]): Promise<RetMonitoramentoFisico | null> {

        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: dto.pdm_id,
                data_ciclo: [dto.ano, dto.mes, '01'].join('-'),
            }
        });
        if (!cf) return null;

        const metasOut: RelMfMetas[] = [];

        const metasDb = await this.prisma.meta.findMany({
            where: { id: { in: metas }, removido_em: null },
            select: { id: true, titulo: true, codigo: true }
        })

        for (const meta of metasDb) {
            const ret: RelMfMetas = {
                meta,
                analiseQuali: null,
                fechamento: null,
                analiseRisco: null,
            }

            metasOut.push(ret);
        }

        return {
            ano: cf.data_ciclo.getFullYear(),
            mes: cf.data_ciclo.getMonth(),
            ciclo_fisico_id: cf.id,
            metas: metasOut
        }

    }


}
