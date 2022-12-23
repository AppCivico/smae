import { Injectable } from '@nestjs/common';
import { MetasAnaliseQualiService } from 'src/mf/metas/metas-analise-quali.service';
import { MetasFechamentoService } from 'src/mf/metas/metas-fechamento.service';
import { MetasRiscoService } from 'src/mf/metas/metas-risco.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRelMonitoramentoMensalDto } from './dto/create-monitoramento-mensal.dto';
import { RelMfMetas, RetMonitoramentoFisico } from './entities/monitoramento-mensal.entity';



@Injectable()
export class MonitoramentoMensalMfService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly analiseQuali: MetasAnaliseQualiService,
        private readonly analiseRisco: MetasRiscoService,
        private readonly fechamento: MetasFechamentoService,
    ) { }

    async create_mf(dto: CreateRelMonitoramentoMensalDto, metas: number[]): Promise<RetMonitoramentoFisico | null> {

        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: dto.pdm_id,
                data_ciclo: new Date([dto.ano, dto.mes, '01'].join('-')),
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
            };
            const params = { ciclo_fisico_id: cf.id, meta_id: meta.id, apenas_ultima_revisao: true };

            // fazendo dessa forma o prisma pode fazer as queries em parelelo
            const results = await Promise.all([
                this.analiseQuali.getMetaAnaliseQualitativa(params, null, null),
                this.analiseRisco.getMetaRisco(params, null, null),
                this.fechamento.getMetaFechamento(params, null, null)
            ]);

            if (results[0].analises.length)
                ret.analiseQuali = results[0].analises[0]

            if (results[1].riscos.length)
                ret.analiseRisco = results[1].riscos[0]

            if (results[2].Fechamentos)
                ret.fechamento = results[2].Fechamentos[0]

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
