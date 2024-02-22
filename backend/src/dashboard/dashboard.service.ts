import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { MetaService } from '../meta/meta.service';
import { ProjetoService } from '../pp/projeto/projeto.service';
import { DashboardOptionDto, RetornoLinhasDashboardLinhasDto } from './entities/dashboard.entity';
import { MetabasePermissao } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => MetaService)) private readonly metaService: MetaService
    ) {}

    async findAll(user: PessoaFromJwt, hostname: string): Promise<RetornoLinhasDashboardLinhasDto[]> {
        const liberados: RetornoLinhasDashboardLinhasDto[] = [];

        const rows = await this.prisma.metabasePermissao.findMany({
            orderBy: [{ ordem: 'asc' }],
        });

        const memory: any = {};

        for (const r of rows) {
            if (!user.hasSomeRoles([r.permissao as any])) continue;

            const config = r.configuracao && typeof r.configuracao == 'object' ? r.configuracao.valueOf() : false;
            if (config === false) continue;

            if (user.hasSomeRoles(['Reports.dashboard_pdm'])) {
                await this.reportPdm(config, memory, user);
            }

            if (user.hasSomeRoles(['Reports.dashboard_portfolios'])) {
                await this.reportProjetos(config, r, liberados);
            }
        }

        if (user.hasSomeRoles(['SMAE.espectador_de_painel_externo'])) {
            await this.painelExterno(user, liberados, hostname);
        }
        return liberados;
    }

    private async painelExterno(user: PessoaFromJwt, liberados: RetornoLinhasDashboardLinhasDto[], hostname: string) {
        /*
        const painelExterno = await this.prisma.painelExterno.findMany({
            orderBy: [{ titulo: 'asc' }],
            where: {
                removido_em: null,
                PainelExternoGrupoPainelExterno: {
                    some: {
                        removido_em: null,
                        GrupoPainelExterno: {
                            removido_em: null,
                            GrupoPainelExternoPessoa: {
                                some: {
                                    removido_em: null,
                                    pessoa_id: user.id,
                                },
                            },
                        },
                    },
                },
            },
        });
        */
        // ve todos os links por enquanto
        const painelExterno = await this.prisma.painelExterno.findMany({
            orderBy: [{ titulo: 'asc' }],
            where: {
                removido_em: null,
            },
        });

        if (painelExterno.length === 0) return;

        const opcoes: DashboardOptionDto[] = painelExterno.map((r) => {
            const url = new URL('https://' + hostname + '/api/dashboard/iframe');
            url.searchParams.append('url', r.link);

            return {
                id: r.id,
                titulo: r.titulo,
                url: url.toString(),
            };
        });

        liberados.push({
            id: -1,
            titulo: 'Painéis Externos',
            opcoes_titulo: 'Escolha o Painel',
            opcoes: opcoes,
        });
    }

    private async reportProjetos(config: any, r: MetabasePermissao, liberados: RetornoLinhasDashboardLinhasDto[]) {
        if (config && config['params'] && config['params']['pdm_id']) {
            const pdms = await this.prisma.pdm.findMany({
                orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
                select: { id: true, nome: true },
            });

            const opcoes: DashboardOptionDto[] = [];
            for (const pdm of pdms) {
                config['params']['pdm_id'] = pdm.id;

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
            const url = r.metabase_url + '/embed/dashboard/' + jwt + '#theme=transparent&bordered=false&titled=false';

            liberados.push({
                id: r.id,
                titulo: r.titulo,
                url: url,
            });
        }
    }

    private async reportPdm(config: any, memory: any, user: PessoaFromJwt) {
        if (config && config['params'] && config['params']['projetos_ids']) {
            if (memory['projetos_ids'] === undefined) {
                memory['projetos_ids'] = (await this.projetoService.findAllIds(user)).map((p) => p.id);
                if (memory['projetos_ids'].length == 0) memory['projetos_ids'] = [-1];
            }

            config['params']['projetos_ids'] = memory['projetos_ids'];
        }

        if (config && config['params'] && config['params']['metas_ids']) {
            if (memory['metas_ids'] === undefined) {
                memory['metas_ids'] = (await this.metaService.findAllIds(user)).map((p) => p.id);
                if (memory['metas_ids'].length == 0) memory['metas_ids'] = [-1];
            }

            config['params']['metas_ids'] = memory['metas_ids'];
        }
    }
}
