import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterDashTransferenciasDto, ListMfDashTransferenciasDto } from './dto/transferencia.dto';

@Injectable()
export class DashTransferenciaService {
    constructor(private readonly prisma: PrismaService) {}

    async transferencias(filter: FilterDashTransferenciasDto): Promise<ListMfDashTransferenciasDto> {
        const rows = await this.prisma.transferenciaStatusConsolidado.findMany({
            where: {
                orgaos_envolvidos: filter.orgaos_ids ? { hasSome: filter.orgaos_ids } : undefined,
                situacao: filter.situacao,
                transferencia: {
                    partido_id: filter.partido_ids ? { in: filter.partido_ids } : undefined,
                    esfera: filter.esfera,
                },
            },
            include: {
                transferencia: {
                    select: {
                        id: true,
                        identificador: true,
                    },
                },
            },
            orderBy: [{ data: { sort: 'asc', nulls: 'first' } }, { transferencia: { identificador: 'asc' } }],
        });

        const ret: ListMfDashTransferenciasDto = {
            linhas: rows.map((r) => {
                return {
                    data: r.data,
                    data_origem: r.data_origem,
                    situacao: r.situacao,
                    identificador: r.transferencia.identificador,
                    transferencia_id: r.transferencia.id,
                };
            }),
        };

        return ret;
    }
}
