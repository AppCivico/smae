import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { FilterPdmCiclo } from 'src/pdm-ciclo/dto/update-pdm-ciclo.dto';
import { CicloFisicoDto } from 'src/pdm/dto/list-pdm.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PdmCicloService {
    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async findAll(params: FilterPdmCiclo): Promise<CicloFisicoDto[]> {

        const retorno: CicloFisicoDto[] = [];

        const ciclos = await this.prisma.cicloFisico.findMany({
            where: { pdm_id: params.pdm_id },
            include: {
                fases: true
            },
            orderBy: [
                { data_ciclo: 'asc' }
            ]
        });

        for (const ciclo of ciclos) {
            const item: CicloFisicoDto = {
                id: ciclo.id,
                data_ciclo: Date2YMD.toString(ciclo.data_ciclo),
                fases: [],
                ativo: ciclo.ativo
            };
            for (const fase of ciclo.fases) {
                item.fases.push({
                    id: fase.id,
                    ciclo_fase: fase.ciclo_fase,
                    data_inicio: Date2YMD.toString(fase.data_inicio),
                    data_fim: Date2YMD.toString(fase.data_fim),
                    fase_corrente: ciclo.ciclo_fase_atual_id == fase.id && ciclo.ativo
                });
            }

            retorno.push(item)
        }

        return retorno;
    }




}
