import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { FilterPdmCiclo } from 'src/pdm-ciclo/dto/update-pdm-ciclo.dto';
import { CicloFisicoV2Dto } from 'src/pdm-ciclo/entities/pdm-ciclo.entity';
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
            where: {
                pdm_id: params.pdm_id,
                data_ciclo: {
                    gt: params.apenas_futuro ? new Date(Date.now()) : undefined
                }
            },
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


    async findAllV2(params: FilterPdmCiclo): Promise<CicloFisicoV2Dto[]> {

        const process = await this.findAll(params);

        const retorno: CicloFisicoV2Dto[] = [];
        let ativoVisto = params.apenas_futuro ? true : false;
        for (const ciclo of process) {
            retorno.push({
                id: ciclo.id,
                data_ciclo: ciclo.data_ciclo,
                ativo: ciclo.ativo,
                inicio_coleta: ciclo.fases.filter(n => n.ciclo_fase == 'Coleta')[0].data_inicio,
                inicio_qualificacao: ciclo.fases.filter(n => n.ciclo_fase == 'Analise')[0].data_inicio,
                inicio_analise_risco: ciclo.fases.filter(n => n.ciclo_fase == 'Risco')[0].data_inicio,
                inicio_fechamento: ciclo.fases.filter(n => n.ciclo_fase == 'Fechamento')[0].data_inicio,
                fechamento: ciclo.fases.filter(n => n.ciclo_fase == 'Fechamento')[0].data_fim,
                pode_editar: ativoVisto
            });

            if (ciclo.ativo) ativoVisto = true;
        }

        return retorno;
    }




}
