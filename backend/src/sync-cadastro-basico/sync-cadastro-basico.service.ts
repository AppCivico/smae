import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createEntidadesSync } from './entities/sync-entities.config';
import { EntidadesSyncMap, PrismaModelDelegate, EntidadeSyncConfig, BaseSelect } from './entities/sync-entities.type';
import { SyncCadastroBasicoRequestDto } from './dto/sync-cadastro-basico.dto';

@Injectable()
export class SyncCadastroBasicoService {
    private entidadesSync: EntidadesSyncMap;
    private readonly logger = new Logger(SyncCadastroBasicoService.name);

    onModuleInit() {
        this.entidadesSync = createEntidadesSync(this.prisma);
    }

    constructor(private readonly prisma: PrismaService) {}

    async sync(request: SyncCadastroBasicoRequestDto) {
        const atualizadoEm = request.atualizado_em ? new Date(request.atualizado_em) : null;
        const validTipos = new Set(Object.keys(this.entidadesSync));

        console.log(validTipos, request);

        // Se tipos não foram especificados, incluir todos os tipos disponíveis
        const requestedTipos =
            request.tipos && request.tipos.length > 0
                ? request.tipos.filter((item) => validTipos.has(item.tipo))
                : Object.keys(this.entidadesSync).map((tipo) => ({ tipo, versao: null }));

        const dados = [];

        this.logger.log(
            `Starting sync for types: ${requestedTipos.map((t) => t.tipo).join(', ')} ${atualizadoEm ? `since ${atualizadoEm.toISOString()}` : '(full sync)'}`
        );

        for (const tipoRequest of requestedTipos) {
            const config = this.entidadesSync[tipoRequest.tipo as keyof EntidadesSyncMap];
            console.log(config);

            if (!config) {
                this.logger.warn(`Sync configuration not found for type: ${tipoRequest.tipo}`);
                continue;
            }

            try {
                const entidade = await this.syncEntidadeGenerica<typeof config.prismaDelegate, typeof config.select>(
                    tipoRequest.tipo,
                    config as EntidadeSyncConfig<typeof config.prismaDelegate, typeof config.select>,
                    tipoRequest.versao,
                    atualizadoEm
                );
                dados.push(entidade);
            } catch (error) {
                this.logger.error(`Error syncing entity ${tipoRequest.tipo}: ${error.message}`, error.stack);
            }
        }

        this.logger.log(`Sync completed for types: ${requestedTipos.map((t) => t.tipo).join(', ')}`);

        return {
            dados,
            timestamp: Date.now(),
        };
    }

    // Função genérica para sincronizar entidades dos cadastros básicos
    private async syncEntidadeGenerica<TDelegate extends PrismaModelDelegate, TSelect extends BaseSelect>(
        nomeTipo: string,
        config: EntidadeSyncConfig<TDelegate, TSelect>,
        versaoTipoRequisitada: string | null | undefined,
        atualizadoEm: Date | null
    ) {
        const { prismaDelegate, select, versao: versaoAtual } = config;

        this.logger.debug(`Syncing ${nomeTipo}...`);

        // Schema está desatualizado se:
        // 1. Versão requisitada foi fornecida e é diferente da atual, OU
        // 2. Versão requisitada é null (força sync completo)
        const schemaDesatualizado =
            versaoTipoRequisitada !== undefined
                ? versaoTipoRequisitada === null || versaoTipoRequisitada !== versaoAtual
                : false;

        const isFullSync = schemaDesatualizado || !atualizadoEm;

        const whereClause: NonNullable<Parameters<TDelegate['findMany']>[0]>['where'] = isFullSync
            ? { removido_em: null }
            : {
                  removido_em: null,
                  OR: [{ criado_em: { gt: atualizadoEm } }, { atualizado_em: { gt: atualizadoEm } }],
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

        this.logger.debug(
            `Synced ${nomeTipo}: ${linhas.length} rows found, ${removidos.length} rows removed. Schema desatualizado: ${schemaDesatualizado}`
        );

        return {
            tipo: nomeTipo,
            versao: versaoAtual,
            schema_desatualizado: schemaDesatualizado,
            linhas,
            removidos,
        };
    }
}
