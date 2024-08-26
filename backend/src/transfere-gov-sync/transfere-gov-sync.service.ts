import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ComunicadoTipo, ComunicadoTransfereGov, Prisma } from '@prisma/client';
import { BlocoNotaService } from '../bloco-nota/bloco-nota/bloco-nota.service';
import { NotaService } from '../bloco-nota/nota/nota.service';
import { CONST_BOT_USER_ID, CONST_TIPO_NOTA_TRANSF_GOV } from '../common/consts';
import { JOB_TRANSFERE_GOV_LOCK } from '../common/dto/locks';
import { PaginatedDto } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
    TransfGovComunicado,
    TransfereGovApiService,
    TransfereGovError,
} from '../transfere-gov-api/transfere-gov-api.service';
import { FilterTransfereGovListDto, TransfereGovDto } from './entities/transfere-gov-sync.entity';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class TransfereGovSyncService {
    private readonly logger = new Logger(TransfereGovSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly transfereGovApi: TransfereGovApiService,
        private readonly blocosService: BlocoNotaService,
        private readonly notaService: NotaService,
        private readonly jwtService: JwtService
    ) {}

    private transformComunicado(
        comunicado: TransfGovComunicado,
        tipo: ComunicadoTipo
    ): Prisma.ComunicadoTransfereGovCreateInput {
        return {
            numero: comunicado.numero,
            ano: comunicado.ano,
            titulo: comunicado.titulo,
            link: comunicado.link,
            data: comunicado.data,
            descricao: comunicado.descricao,
            tipo: tipo,
        };
    }

    private async syncComunicados(
        comunicados: TransfGovComunicado[],
        tipo: ComunicadoTipo
    ): Promise<ComunicadoTransfereGov[]> {
        const newItems: ComunicadoTransfereGov[] = [];

        const now = new Date();
        for (const comunicado of comunicados) {
            const transformedComunicado = this.transformComunicado(comunicado, tipo);

            try {
                const result = await this.prisma.comunicadoTransfereGov.upsert({
                    where: {
                        numero_ano_titulo: {
                            numero: transformedComunicado.numero,
                            ano: transformedComunicado.ano,
                            titulo: transformedComunicado.titulo,
                        },
                    },
                    update: transformedComunicado,
                    create: {
                        ...transformedComunicado,
                        criado_em: now,
                        atualizado_em: now,
                    },
                });

                if (result.criado_em.getTime() === result.atualizado_em.getTime()) {
                    newItems.push(result);
                }
            } catch (error) {
                this.logger.error(`Erro ao atualizar comunicados: ${error.message}`);
            }
        }

        return newItems;
    }

    private async syncEndpoint(
        endpoint: () => Promise<any[]>,
        tipo: ComunicadoTipo
    ): Promise<ComunicadoTransfereGov[]> {
        try {
            this.logger.log(`Iniciando sync ${tipo}`);
            const comunicados = await endpoint();
            const newItems = await this.syncComunicados(comunicados, tipo);
            this.logger.log(`Synced ${comunicados.length} ${tipo} comunicados, ${newItems.length} novos itens`);
            return newItems;
        } catch (error) {
            if (error instanceof HttpException) {
                this.logger.error(`HTTP erro syncing ${tipo} comunicados: ${error.getStatus()} - ${error.message}`);
            } else if (error instanceof TransfereGovError) {
                this.logger.error(`TransfereGov erro syncing ${tipo} comunicados: ${error.message}`);
            } else {
                this.logger.error(`Erro: syncing ${tipo} comunicados: ${error.message}`);
            }
            return [];
        }
    }

    @Cron(CronExpression.EVERY_6_HOURS)
    async handleTransfereGovCron() {
        if (process.env['DISABLE_TRANSFERE_GOV_CRONTAB']) return;

        this.logger.log('Iniciando TransfereGOV sync');

        try {
            await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                const locked: { locked: boolean }[] = await prisma.$queryRaw`
                    SELECT pg_try_advisory_xact_lock(${JOB_TRANSFERE_GOV_LOCK}) as locked
                `;
                if (!locked[0].locked) {
                    return;
                }

                await this.syncAllEndpoints();
                await this.createNotifications();
            });
        } catch (error) {
            this.logger.error(`Erro no sync TransfereGOV: ${error.message}`);
        }
    }

    private async syncAllEndpoints(): Promise<ComunicadoTransfereGov[]> {
        const newItems: ComunicadoTransfereGov[] = [];

        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getGerais(), 'Geral')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getIndividuais(), 'Individual')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getEspeciais(), 'Especial')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getBancada(), 'Bancada')));

        this.logger.log(`Sync TransfereGOV finalizado com sucesso. Novos items: ${newItems.length}`);
        return newItems;
    }

    private async createNotifications(): Promise<void> {
        const now = new Date();
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const novosItems = await prismaTx.comunicadoTransfereGov.findMany({
                where: {
                    criado_em: {
                        equals: prismaTx.comunicadoTransfereGov.fields.atualizado_em,
                    },
                },
            });
            this.logger.log(`Criando ${novosItems.length} notas`);

            for (const item of novosItems) {
                const bloco = await this.blocosService.getTokenFor(
                    { transfere_gov: item.tipo.toString() },
                    { id: CONST_BOT_USER_ID },
                    prismaTx
                );

                await this.notaService.create(
                    {
                        bloco_token: bloco,
                        titulo: item.titulo,
                        nota: item.descricao ?? '',
                        data_nota: item.data,
                        status: 'Em_Curso',
                        dados: {
                            transfere_gov_id: item.id,
                            tipo: item.tipo,
                            numero: item.numero,
                            ano: item.ano,
                            link: item.link,
                        },
                        dispara_email: false,
                        tipo_nota_id: CONST_TIPO_NOTA_TRANSF_GOV,
                        enderecamentos: [],
                        rever_em: null,
                    },
                    { id: CONST_BOT_USER_ID },
                    prismaTx
                );
            }
            // atualiza a data de atualização para evitar que a mesma nota seja criada novamente
            await prismaTx.comunicadoTransfereGov.updateMany({
                where: { id: { in: novosItems.map((item) => item.id) } },
                data: { atualizado_em: now },
            });
        });
    }

    async manualSync(): Promise<ComunicadoTransfereGov[]> {
        this.logger.log('Iniciando sync manual TransfereGOV');
        const newItems = await this.syncAllEndpoints();
        await this.createNotifications();
        return newItems;
    }

    async listaComunicados(filters: FilterTransfereGovListDto): Promise<PaginatedDto<TransfereGovDto>> {
        const { data_inicio, data_fim } = filters;

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const dbRows = await this.prisma.comunicadoTransfereGov.findMany({
            where: {
                data: {
                    gte: data_inicio,
                    lte: data_fim,
                },
            },
            skip: offset,
            take: ipp + 1,
            orderBy: { id: 'desc' },
        });

        const linhas: TransfereGovDto[] = dbRows.map((item) => ({
            id: item.id,
            numero: item.numero,
            ano: item.ano,
            titulo: item.titulo,
            link: item.link,
            data: item.data,
            descricao: item.descricao,
            tipo: item.tipo,
        }));

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
