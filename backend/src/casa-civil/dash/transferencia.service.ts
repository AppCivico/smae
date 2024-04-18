import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterDashTransferenciasDto, ListMfDashTransferenciasDto } from './dto/transferencia.dto';
import { TransferenciaService } from '../transferencia/transferencia.service';

@Injectable()
export class DashTransferenciaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transferenciaService: TransferenciaService
    ) {}

    async transferencias(filter: FilterDashTransferenciasDto): Promise<ListMfDashTransferenciasDto> {
        const ids = await this.transferenciaService.buscaIdsPalavraChave(filter.palavra_chave);

        const rows = await this.prisma.transferenciaStatusConsolidado.findMany({
            where: {
                transferencia_id: ids ? { in: ids } : undefined,
                orgaos_envolvidos: filter.orgaos_ids ? { hasSome: filter.orgaos_ids } : undefined,
                situacao: filter.situacao ? { in: filter.situacao } : undefined,
                transferencia: {
                    partido_id: filter.partido_ids ? { in: filter.partido_ids } : undefined,
                    esfera: filter.esfera ? { in: filter.esfera } : undefined,
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
