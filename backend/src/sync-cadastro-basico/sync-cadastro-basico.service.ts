import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createEntidadesSync } from './entities/sync-entities.config';
import { EntidadesSyncMap, PrismaModelDelegate, EntidadeSyncConfig, BaseSelect } from './entities/sync-entities.type';

@Injectable()
export class SyncCadastroBasicoService {
    private entidadesSync: EntidadesSyncMap;
    private readonly logger = new Logger(SyncCadastroBasicoService.name);

    onModuleInit() {
        this.entidadesSync = createEntidadesSync(this.prisma);
    }
    constructor(private readonly prisma: PrismaService) {}

    async sync(query: { atualizado_em?: number; versao?: string; tipos?: string }) {
        const atualizadoEm = query.atualizado_em ? new Date(query.atualizado_em * 1000) : null;
        const requestedTipos = query.tipos
            ? (query.tipos.split(',').filter((tipo) => tipo in this.entidadesSync) as Array<keyof EntidadesSyncMap>)
            : (Object.keys(this.entidadesSync) as Array<keyof EntidadesSyncMap>);

        const dados = [];

        this.logger.log(
            `Starting sync for types: ${requestedTipos.join(', ')} ${atualizadoEm ? `since ${atualizadoEm.toISOString()}` : '(full sync)'}`
        );

        for (const tipo of requestedTipos) {
            const config = this.entidadesSync[tipo];

            if (!config) {
                this.logger.warn(`Sync configuration not found for type: ${tipo}`);
                continue;
            }

            try {
                const entidade = await this.syncEntidadeGenerica<typeof config.prismaDelegate, typeof config.select>(
                    tipo,
                    config as EntidadeSyncConfig<typeof config.prismaDelegate, typeof config.select>,
                    query.versao,
                    atualizadoEm
                );
                dados.push(entidade);
            } catch (error) {
                this.logger.error(`Error syncing entity ${tipo}: ${error.message}`, error.stack);
            }
        }

        this.logger.log(`Sync completed for types: ${requestedTipos.join(', ')}`);

        return {
            dados,
            timestamp: Date.now(),
        };
    }

    // Função generica para sincronizar entidades dos cadastros basicos
    private async syncEntidadeGenerica<TDelegate extends PrismaModelDelegate, TSelect extends BaseSelect>(
        nomeTipo: string,
        config: EntidadeSyncConfig<TDelegate, TSelect>,
        queryVersao: string | undefined,
        atualizadoEm: Date | null
    ) {
        const { prismaDelegate, select, versao: versaoAtual } = config;

        this.logger.debug(`Syncing ${nomeTipo}...`);

        const schemaDesatualizado = queryVersao !== versaoAtual;
        const isFullSync = schemaDesatualizado || !atualizadoEm;

        const whereClause: NonNullable<Parameters<TDelegate['findMany']>[0]>['where'] = isFullSync
            ? { removido_em: null }
            : {
                  removido_em: null,
                  OR: [
                      { criado_em: { gt: atualizadoEm } },
                      { atualizado_em: { gt: atualizadoEm } },
                  ],
              };

        const linhas = await prismaDelegate.findMany({
            where: whereClause,
            select: select,
        });

        let removidos: number[] = [];
        if (!isFullSync && atualizadoEm) {
            const removidosResult = await prismaDelegate.findMany({
                where: {
                    removido_em: { gt: atualizadoEm },
                },
                select: { id: true },
            });

            removidos = (removidosResult as Array<{ id: number }>).map((r) => r.id);
        }

        this.logger.debug(`Synced ${nomeTipo}: ${linhas.length} rows found, ${removidos.length} rows removed.`);

        return {
            tipo: nomeTipo,
            versao: versaoAtual,
            schema_desatualizado: schemaDesatualizado,
            linhas,
            removidos,
        };
    }
}
