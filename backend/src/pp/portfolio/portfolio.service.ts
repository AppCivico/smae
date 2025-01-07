import {
    BadRequestException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';
import { ProjetoService } from '../projeto/projeto.service';

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService))
        private readonly projetoService: ProjetoService
    ) {}

    async create(tipoProjeto: TipoProjeto, dto: CreatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.portfolio.count({
            where: {
                tipo_projeto: tipoProjeto,
                titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);

        if (user.hasSomeRoles(['Projeto.administrar_portfolios', 'ProjetoMDO.administrar_portfolios']) == false) {
            for (const orgao of dto.orgaos) {
                if (user.orgao_id !== orgao)
                    throw new BadRequestException(`Você só tem permissão para criar portfólio no próprio órgão.`);
            }
        }
        if (tipoProjeto == 'MDO') dto.nivel_regionalizacao = 3;

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const row = await prismaTx.portfolio.create({
                    data: {
                        tipo_projeto: tipoProjeto,
                        criado_por: user.id,
                        criado_em: now,
                        titulo: dto.titulo,
                        nivel_maximo_tarefa: dto.nivel_maximo_tarefa || undefined, // deixa o default do banco
                        descricao: dto.descricao,
                        data_criacao: dto.data_criacao,
                        orcamento_execucao_disponivel_meses: dto.orcamento_execucao_disponivel_meses,
                        nivel_regionalizacao: dto.nivel_regionalizacao,
                        modelo_clonagem: dto.modelo_clonagem,
                    },
                    select: { id: true },
                });

                if (Array.isArray(dto.grupo_portfolio) && dto.grupo_portfolio.length > 0) {
                    for (const grupoPortId of dto.grupo_portfolio) {
                        const gp = await prismaTx.grupoPortfolio.findFirstOrThrow({
                            where: {
                                removido_em: null,
                                id: grupoPortId,
                            },
                            select: { id: true },
                        });

                        await prismaTx.portfolioGrupoPortfolio.create({
                            data: {
                                grupo_portfolio_id: gp.id,
                                criado_em: now,
                                criado_por: user.id,
                                portfolio_id: row.id,
                            },
                        });
                    }
                }

                if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
                    await prismaTx.portfolioOrgao.createMany({
                        data: dto.orgaos.map((r) => {
                            return {
                                orgao_id: r,
                                portfolio_id: row.id,
                            };
                        }),
                    });
                }

                return row;
            }
        );

        return created;
    }

    async findOne(tipoProjeto: TipoProjeto, id: number, user: PessoaFromJwt | null): Promise<PortfolioOneDto> {
        // faz o check de permissão pelo endpoint de listagem, se existir user
        if (user) await this.findAll(tipoProjeto, user, false, id);

        const r = await this.prisma.portfolio.findFirstOrThrow({
            where: {
                id: +id,
                removido_em: null,
            },
            select: {
                id: true,
                titulo: true,
                nivel_maximo_tarefa: true,
                orgaos: {
                    select: {
                        orgao_id: true,
                    },
                },
                modelo_clonagem: true,
                descricao: true,
                data_criacao: true,
                orcamento_execucao_disponivel_meses: true,
                nivel_regionalizacao: true,
                PortfolioGrupoPortfolio: {
                    where: { removido_em: null },
                    select: {
                        grupo_portfolio_id: true,
                    },
                },
            },
        });

        return {
            ...{ ...r, PortfolioGrupoPortfolio: undefined },
            grupo_portfolio: r.PortfolioGrupoPortfolio.map((rr) => rr.grupo_portfolio_id),
            orgaos: r.orgaos.map((rr) => rr.orgao_id),
        };
    }

    async findAll(
        tipoProjeto: TipoProjeto,
        user: PessoaFromJwt,
        listaParaProjetosOuObras: boolean,
        filterId: number | undefined = undefined
    ): Promise<PortfolioDto[]> {
        let orgao_id: undefined | number = undefined;

        const isFullAdmin = user.hasSomeRoles(['Projeto.administrar_portfolios', 'ProjetoMDO.administrar_portfolios']);
        const isAdminNoOrgao = user.hasSomeRoles([
            'Projeto.administrar_portfolios_no_orgao',
            'ProjetoMDO.administrar_portfolios_no_orgao',
        ]);

        let andIds: number[] | undefined = undefined;

        if (listaParaProjetosOuObras) {
            if (
                // TODO conferir isso para o MDO
                !user.hasSomeRoles(['Projeto.administrador', 'ProjetoMDO.administrador']) &&
                user.hasSomeRoles(['Projeto.administrador_no_orgao', 'ProjetoMDO.administrador_no_orgao'])
            ) {
                if (!user.orgao_id)
                    throw new BadRequestException(
                        'Usuário Projeto.administrador_no_orgao ou ProjetoMDO.administrador_no_orgao precisa ter um órgão definido'
                    );

                orgao_id = user.orgao_id;
                this.logger.debug(
                    `Filtro Projeto.administrador_no_orgao/ProjetoMDO.administrador_no_orgao: orgao_id=${orgao_id}`
                );
            } else if (!user.hasSomeRoles(['Projeto.administrador', 'ProjetoMDO.administrador'])) {
                // ...
                const projetoRows = await this.prisma.projeto.groupBy({
                    by: ['portfolio_id'],
                    where: {
                        tipo: tipoProjeto,
                        removido_em: null,
                        AND: this.projetoService.getProjetoWhereSet(tipoProjeto, user, false),
                    },
                });
                andIds = projetoRows.map((r) => r.portfolio_id);
            }
        } else if (!isFullAdmin) {
            // else do listaParaProjetos = listando para edição
            if (!isAdminNoOrgao)
                throw new BadRequestException(
                    'Necessário Projeto.administrar_portfolios_no_orgao/ProjetoMDO.administrar_portfolios_no_orgao para listar em modo edição.'
                );

            if (!user.orgao_id)
                throw new BadRequestException(
                    'Usuário com Projeto.administrar_portfolios_no_orgao/ProjetoMDO.administrar_portfolios_no_orgao precisa ter um órgão definido para utilizar a listar em modo edição.'
                );

            orgao_id = user.orgao_id;
            this.logger.debug(
                `Filtro Projeto.administrar_portfolios_no_orgao/ProjetoMDO.administrar_portfolios_no_orgao: orgao_id=${orgao_id}`
            );
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
                tipo_projeto: tipoProjeto,
                id: filterId,
                removido_em: null,
                orgaos: orgao_id ? { some: { orgao_id: orgao_id } } : undefined,
                AND: andIds ? { id: { in: andIds } } : undefined,
            },
            select: {
                id: true,
                titulo: true,
                nivel_maximo_tarefa: true,
                nivel_regionalizacao: true,
                modelo_clonagem: true,
                orgaos: {
                    select: {
                        orgao: {
                            select: {
                                sigla: true,
                                descricao: true,
                                id: true,
                            },
                        },
                    },
                },
            },
            orderBy: { titulo: 'asc' },
        });

        if (filterId && listActive.length == 0) throw new NotFoundException('Portfólio não encontrado.');

        return listActive.map((r) => {
            let pode_editar = isFullAdmin;

            if (!pode_editar && isAdminNoOrgao && orgao_id) {
                // orgao precisa ser exclusivamente o orgao da pessoa para que ela possa editar
                pode_editar = r.orgaos.length == 1 && r.orgaos[0].orgao.id == orgao_id;
            }

            return {
                pode_editar: pode_editar,
                ...r,
                orgaos: r.orgaos.map((rr) => rr.orgao),
            };
        });
    }

    async update(
        tipoProjeto: TipoProjeto,
        id: number,
        dto: UpdatePortfolioDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const self = await this.findAll(tipoProjeto, user, false, id);
        if (!self[0].pode_editar) throw new BadRequestException('Sem permissão para editar o portfólio');

        if (tipoProjeto == 'MDO' && dto.nivel_regionalizacao && dto.nivel_regionalizacao != 3)
            throw new BadRequestException('Nível de regionalização inválido para MDO');

        if (dto.titulo !== undefined) {
            const similarExists = await this.prisma.portfolio.count({
                where: {
                    tipo_projeto: tipoProjeto,
                    titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
            const toBeRemoved = await this.prisma.portfolioOrgao.findMany({
                where: {
                    portfolio_id: id,
                    orgao_id: { notIn: dto.orgaos.map((r) => r) },
                },
                select: {
                    orgao: true,
                },
            });

            for (const orgaoRemoved of toBeRemoved) {
                const findGestor = await this.prisma.projeto.findMany({
                    where: {
                        removido_em: null,
                        portfolio_id: id,
                        orgao_gestor_id: orgaoRemoved.orgao.id,
                    },
                    select: {
                        nome: true,
                    },
                });

                if (findGestor.length > 0)
                    throw new HttpException(
                        `Não é possível remover o órgão ${orgaoRemoved.orgao.sigla} pois há projetos com órgão gestor deste órgão. Projeto(s): ${findGestor.map((r) => r.nome).join(', ')}`,
                        400
                    );
            }
        }

        // Portfolio possui nivel de regionalização, pois os Projetos podem ser ligados a regiões.
        // Caso o Portfolio já possua projetos com regiões, deve ser bloqueado o update de nivel de regionalização
        if (dto.nivel_regionalizacao) {
            const self = await this.prisma.portfolio.findFirstOrThrow({
                where: { id },
                select: { nivel_regionalizacao: true },
            });

            const projetosComRegiao = await this.prisma.projeto.count({
                where: {
                    portfolio_id: id,
                    removido_em: null,
                    NOT: [{ regiao_id: null }],
                },
            });

            if (projetosComRegiao > 0 && dto.nivel_regionalizacao != self.nivel_regionalizacao)
                throw new HttpException(
                    'Não é possível modificar nível de regionalização, pois existem Projetos com regiões.',
                    400
                );
        }

        // conferir se todos os órgãos que estão saindo realmente nao estão em uso em nenhum projeto ativo
        // como orgao_gestor_id
        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const row = await prismaTx.portfolio.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: now,
                        titulo: dto.titulo,
                        nivel_maximo_tarefa: dto.nivel_maximo_tarefa,
                        descricao: dto.descricao,
                        data_criacao: dto.data_criacao,
                        orcamento_execucao_disponivel_meses: dto.orcamento_execucao_disponivel_meses,
                        nivel_regionalizacao: dto.nivel_regionalizacao,
                    },
                    select: { id: true },
                });

                if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
                    await prismaTx.portfolioOrgao.deleteMany({
                        where: { portfolio_id: row.id },
                    });

                    await prismaTx.portfolioOrgao.createMany({
                        data: dto.orgaos.map((r) => {
                            return {
                                orgao_id: r,
                                portfolio_id: row.id,
                            };
                        }),
                    });
                }

                await this.upsertGrupoPort(prismaTx, row, dto, now, user);

                return row;
            }
        );

        return { id: created.id };
    }

    private async upsertGrupoPort(
        prismaTx: Prisma.TransactionClient,
        row: { id: number },
        dto: UpdatePortfolioDto,
        now: Date,
        user: PessoaFromJwt
    ) {
        if (!Array.isArray(dto.grupo_portfolio)) return;

        const prevVersions = await prismaTx.portfolioGrupoPortfolio.findMany({
            where: {
                removido_em: null,
                portfolio_id: row.id,
            },
        });

        for (const grupoPortId of dto.grupo_portfolio) {
            if (prevVersions.filter((r) => r.grupo_portfolio_id == grupoPortId)[0]) continue;

            const gp = await prismaTx.grupoPortfolio.findFirstOrThrow({
                where: {
                    removido_em: null,
                    id: grupoPortId,
                },
                select: { id: true },
            });

            await prismaTx.portfolioGrupoPortfolio.create({
                data: {
                    grupo_portfolio_id: gp.id,
                    criado_em: now,
                    criado_por: user.id,
                    portfolio_id: row.id,
                },
            });
        }

        for (const prevPortRow of prevVersions) {
            // pula as que continuam na lista
            if (dto.grupo_portfolio.filter((r) => r == prevPortRow.grupo_portfolio_id)[0]) continue;

            // remove o relacionamento
            await prismaTx.portfolioGrupoPortfolio.update({
                where: {
                    id: prevPortRow.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });
        }
    }

    async remove(tipoProjeto: TipoProjeto, id: number, user: PessoaFromJwt) {
        const self = await this.findAll(tipoProjeto, user, false, id);
        if (!self[0].pode_editar) throw new BadRequestException('Sem permissão para remover o portfólio');

        const count = await this.prisma.projeto.count({
            where: {
                tipo: tipoProjeto,
                removido_em: null,
                portfolio_id: +id,
            },
        });
        if (count > 0) throw new HttpException('Não é possível mais apagar o portfólio, há projetos dependentes.', 400);

        const created = await this.prisma.portfolio.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
