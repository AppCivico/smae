import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type EntidadeSyncConfig = {
    prismaModel: string;
    versao: string;
};
type EntidadesSyncMap = Record<string, EntidadeSyncConfig>;

@Injectable()
export class SyncCadastroBasicoService {
    private readonly entidadesSync: EntidadesSyncMap = {
        orgao: {
            prismaModel: 'orgao',
            versao: '2024.0.1',
        },
        unidadeMedida: {
            prismaModel: 'unidadeMedida',
            versao: '2024.0.1',
        },
        assuntoVariavel: {
            prismaModel: 'assuntoVariavel',
            versao: '2024.0.1',
        },
        regiao: {
            prismaModel: 'regiao',
            versao: '2024.0.1',
        },
        fonteVariavel: {
            prismaModel: 'fonteVariavel',
            versao: '2024.0.1',
        },
        variavelCategorica: {
            prismaModel: 'variavelCategorica',
            versao: '2024.0.1',
        },
        tema: {
            prismaModel: 'tema',
            versao: '2024.0.1',
        },
        ods: {
            prismaModel: 'ods',
            versao: '2024.0.1',
        },
        tag: {
            prismaModel: 'tag',
            versao: '2024.0.1',
        },
        tipoAditivo: {
            prismaModel: 'tipoAditivo',
            versao: '2024.0.1',
        },
        projetoTag: {
            prismaModel: 'projetoTag',
            versao: '2024.0.1',
        },
        tipoIntervencao: {
            prismaModel: 'tipoIntervencao',
            versao: '2024.0.1',
        },
    };

    constructor(private readonly prisma: PrismaService) {}

    async sync(query: { atualizado_em?: number; versao?: string; tipos?: string }) {
        const atualizadoEm = query.atualizado_em ? new Date(query.atualizado_em * 1000) : null;
        const tipos = query.tipos ? query.tipos.split(',') : Object.keys(this.entidadesSync);

        const dados = [];

        for (const tipo of tipos) {
            const config = this.entidadesSync[tipo];
            if (!config) continue;

            const entidade = await this.syncEntidadeGenerica(
                tipo,
                config.prismaModel,
                config.versao,
                query.versao,
                atualizadoEm
            );

            dados.push(entidade);
        }

        return {
            dados,
            timestamp: Date.now(),
        };
    }

    private async syncEntidadeGenerica(
        nome: string,
        modelo: string,
        versaoAtual: string,
        queryVersao: string | undefined,
        atualizadoEm: Date | null
    ) {
        console.log('==========nome=============');
        console.log(nome);
        const schemaDesatualizado = queryVersao !== versaoAtual;
        const isFullSync = schemaDesatualizado || !atualizadoEm;

        const linhas = await (this.prisma as any)[modelo].findMany({
            where: isFullSync
                ? { removido_em: null }
                : {
                      removido_em: null,
                      OR: [{ criado_em: { gt: atualizadoEm } }, { atualizado_em: { gt: atualizadoEm } }],
                  },
        });

        const removidos = isFullSync
            ? []
            : (
                  await (this.prisma as any)[modelo].findMany({
                      where: { removido_em: { gt: atualizadoEm } },
                      select: { id: true },
                  })
              ).map((r: { id: number }) => r.id);

        return {
            tipo: nome,
            versao: versaoAtual,
            schema_desatualizado: schemaDesatualizado,
            linhas,
            removidos,
        };
    }
}
