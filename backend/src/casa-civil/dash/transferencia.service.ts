import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { NotaService } from '../../bloco-nota/nota/nota.service';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferenciaService } from '../transferencia/transferencia.service';
import { FilterDashNotasDto, MfDashNotasDto } from './dto/notas.dto';
import {
    FilterDashTransferenciasDto,
    ListMfDashTransferenciasDto,
    MfDashTransferenciasDto,
} from './dto/transferencia.dto';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}
@Injectable()
export class DashTransferenciaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly transferenciaService: TransferenciaService,
        private readonly jwtService: JwtService,
        private readonly notaService: NotaService
    ) {}

    async transferencias(filter: FilterDashTransferenciasDto): Promise<ListMfDashTransferenciasDto> {
        const ids = await this.transferenciaService.buscaIdsPalavraChave(filter.palavra_chave);

        // eh marco, ter data de termino (ter data planejado), não ter data de termino real
        //
        const rows = await this.prisma.transferenciaStatusConsolidado.findMany({
            where: {
                transferencia_id: ids ? { in: ids } : undefined,
                orgaos_envolvidos: filter.orgaos_ids ? { hasSome: filter.orgaos_ids } : undefined,
                situacao: filter.atividade ? { in: filter.atividade } : undefined,
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
                        esfera: true,
                        objeto: true,
                        partido_id: true,
                    },
                },
            },
            orderBy: [{ data: { sort: 'asc', nulls: 'first' } }, { transferencia: { identificador: 'asc' } }],
        });

        const ret: ListMfDashTransferenciasDto = {
            linhas: rows.map((r): MfDashTransferenciasDto => {
                return {
                    data: r.data,
                    data_origem: r.data_origem,
                    atividade: r.situacao,
                    identificador: r.transferencia.identificador,
                    transferencia_id: r.transferencia.id,
                    esfera: r.transferencia.esfera,
                    orgaos: r.orgaos_envolvidos,
                    objeto: r.transferencia.objeto,
                    partido_id: r.transferencia.partido_id,
                };
            }),
        };

        return ret;
    }

    async notas(filters: FilterDashNotasDto, user: PessoaFromJwt): Promise<PaginatedDto<MfDashNotasDto>> {
        const transferenciasIds = await this.transferenciaService.buscaIdsPalavraChave(filters.palavra_chave);

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const rows = await this.prisma.viewNotasTransferencias.findMany({
            where: {
                status: {
                    in: ['Em_Curso', 'Programado'],
                },
                removido_em: null,
                // TODO: Implementar permissões para a transferencia da mesma forma  que foi feito para a nota
                notaReferencia: {
                    status: {
                        in: ['Em_Curso', 'Programado'],
                    },
                    removido_em: null,
                    AND: this.notaService.permissionSet(user),
                },
                transferencia: {
                    removido_em: null,
                    id: transferenciasIds ? { in: transferenciasIds } : undefined,
                    partido_id: filters.partido_ids ? { in: filters.partido_ids } : undefined,
                    esfera: filters.esfera ? { in: filters.esfera } : undefined,

                    TransferenciaStatusConsolidado:
                        filters.orgaos_ids || filters.atividade
                            ? {
                                  some: {
                                      orgaos_envolvidos: filters.orgaos_ids
                                          ? { hasSome: filters.orgaos_ids }
                                          : undefined,
                                      situacao: filters.atividade ? { in: filters.atividade } : undefined,
                                  },
                              }
                            : undefined,
                },
            },
            orderBy: [{ data_ordenacao: 'desc' }],
            skip: offset,
            take: ipp + 1,
        });

        const linhas = rows.map((r) => {
            return {
                transferencia_id: r.transferencia_id,
                nota_id: r.id,
                bloco_id: r.bloco_nota_id,
                nota: r.nota,
                data_nota: r.data_nota,
                data_ordenacao: r.data_ordenacao,
                status: r.status,
                transferencia_identificador: r.transferencia_identificador,
            };
        });

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
        };
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
