import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RetMonitoramentoFisico } from './entities/monitoramento-mensal.entity';



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

        return {
            ano: cf.data_ciclo.getFullYear(),
            mes: cf.data_ciclo.getMonth(),
            ciclo_fisico_id: cf.id,
            metas: []
        }

    }


}
