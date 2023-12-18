import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MetaService } from '../meta/meta.service';
import { ProjetoService } from '../pp/projeto/projeto.service';
import { DashboardOptionDto, RetornoLinhasDashboardLinhasDto } from './entities/dashboard.entity';

@Injectable()
export class DashboardService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService
    ) {}

    async findAll(user: PessoaFromJwt): Promise<RetornoLinhasDashboardLinhasDto[]> {
        const liberados: RetornoLinhasDashboardLinhasDto[] = [];

        const rows = await this.prisma.metabasePermissao.findMany({
            orderBy: [{ ordem: 'asc' }],
        });

        const memory: any = {};

        for (const r of rows) {
            if (!user.hasSomeRoles([r.permissao as any])) continue;

            const config = r.configuracao && typeof r.configuracao == 'object' ? r.configuracao.valueOf() : false;
            if (config === false) continue;

            if (config && (config as any)['params'] && (config as any)['params']['projetos_ids']) {
                if (memory['projetos_ids'] === undefined)
                    memory['projetos_ids'] = (await this.projetoService.findAllIds(user)).map((p) => p.id);

                (config as any)['params']['projetos_ids'] = memory['projetos_ids'];
            }

            if (config && (config as any)['params'] && (config as any)['params']['metas_ids']) {
                if (memory['metas_ids'] === undefined)
                    memory['metas_ids'] = (await this.metaService.findAllIds(user)).map((p) => p.id);

                (config as any)['params']['metas_ids'] = memory['metas_ids'];
            }

            if (config && (config as any)['params'] && (config as any)['params']['pdm_id']) {
                const pdms = await this.prisma.pdm.findMany({
                    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
                    select: { id: true, nome: true },
                });

                const opcoes: DashboardOptionDto[] = [];
                for (const pdm of pdms) {
                    (config as any)['params']['pdm_id'] = pdm.id;

                    const jwt = sign(
                        {
                            ...config,
                        },
                        r.metabase_token,
                        { algorithm: 'HS256', expiresIn: 86400 }
                    );
                    const url =
                        r.metabase_url + '/embed/dashboard/' + jwt + '#theme=transparent&bordered=false&titled=false';

                    opcoes.push({
                        titulo: pdm.nome,
                        url: url,
                        id: pdm.id,
                    });
                }

                liberados.push({
                    id: r.id,
                    titulo: r.titulo,
                    opcoes_titulo: 'Programa de Metas',
                    opcoes: opcoes,
                });
            } else {
                const jwt = sign(
                    {
                        ...config,
                    },
                    r.metabase_token,
                    { algorithm: 'HS256', expiresIn: 86400 }
                );
                const url =
                    r.metabase_url + '/embed/dashboard/' + jwt + '#theme=transparent&bordered=false&titled=false';

                liberados.push({
                    id: r.id,
                    titulo: r.titulo,
                    url: url,
                });
            }
        }

        return liberados;
    }
}
