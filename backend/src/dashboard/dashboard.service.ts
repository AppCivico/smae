import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { DashboardItemDto } from './entities/dashboard.entity';

import { sign } from 'jsonwebtoken';
import { MetaService } from '../meta/meta.service';
import { ProjetoService } from '../pp/projeto/projeto.service';

@Injectable()
export class DashboardService {

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService,
    ) { }

    async findAll(user: PessoaFromJwt): Promise<DashboardItemDto[]> {

        const liberados: DashboardItemDto[] = [];

        const rows = await this.prisma.metabasePermissao.findMany({
            orderBy: [{ ordem: 'asc' }]
        });

        const memory: any = {};

        for (const r of rows) {
            if (!user.hasSomeRoles([r.permissao as any])) continue;

            const config = (r.configuracao && typeof r.configuracao == 'object' ? r.configuracao.valueOf() : false);
            if (config === false) continue;

            if (config && (config as any)['params'] && (config as any)['params']['projetos_ids']) {
                if (memory['projetos_ids'] === undefined)
                    memory['projetos_ids'] = (await this.projetoService.findAllIds(user)).map(p => p.id);

                (config as any)['params']['projetos_ids'] = memory['projetos_ids'];
            }

            if (config && (config as any)['params'] && (config as any)['params']['metas_ids']) {
                if (memory['metas_ids'] === undefined)
                    memory['metas_ids'] = (await this.metaService.findAllIds(user)).map(p => p.id);

                (config as any)['params']['metas_ids'] = memory['metas_ids'];
            }

            const jwt = sign(
                {
                    ...config,
                },
                r.metabase_token,
                { algorithm: 'HS256', expiresIn: 86400, }
            );

            const url = r.metabase_url + '/embed/dashboard/' + jwt + '#bordered=true&titled=true';

            liberados.push({
                id: r.id,
                titulo: r.titulo,
                url: url,
            });
        }

        return liberados;
    }

}
