import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.portfolio.count({
            where: {
                titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const row = await prismaTx.portfolio.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        titulo: dto.titulo,
                        nivel_maximo_tarefa: dto.nivel_maximo_tarefa || undefined, // deixa o default do banco
                        descricao: dto.descricao,
                        data_criacao: dto.data_criacao,
                        orcamento_execucao_disponivel_meses: dto.orcamento_execucao_disponivel_meses,
                        nivel_regionalizacao: dto.nivel_regionalizacao,
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

    async findOne(id: number, user: PessoaFromJwt | null): Promise<PortfolioOneDto> {
        let orgao_id: undefined | number = undefined;
        if (
            user != null &&
            !user.hasSomeRoles(['Projeto.administrar_portfolios']) &&
            user != null &&
            user.hasSomeRoles(['Projeto.administrador_no_orgao'])
        ) {
            orgao_id = user.orgao_id!;
        }

        const r = await this.prisma.portfolio.findFirstOrThrow({
            where: {
                id: +id,
                removido_em: null,
                orgaos: orgao_id
                    ? {
                          some: {
                              orgao_id: orgao_id,
                          },
                      }
                    : undefined,
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
                descricao: true,
                data_criacao: true,
                orcamento_execucao_disponivel_meses: true,
                nivel_regionalizacao: true,
            },
        });

        return {
            ...r,
            orgaos: r.orgaos.map((rr) => rr.orgao_id),
        };
    }

    async findAll(user: PessoaFromJwt): Promise<PortfolioDto[]> {
        let orgao_id: undefined | number = undefined;

        // só pra manter mais ou menos uma retrocompatibilidade com o frontend
        // preciso pensar melhor nesse filtro
        if (
            !user.hasSomeRoles(['Projeto.administrador', 'Projeto.administrar_portfolios']) &&
            user.hasSomeRoles(['Projeto.administrador_no_orgao'])
        ) {
            if (!user.orgao_id) {
                throw new HttpException('Usuário Projeto.administrador_no_orgao precisa ter um órgão definido', 400);
            }
            orgao_id = user.orgao_id;
            this.logger.debug(`Filtro Projeto.administrador_no_orgao: orgao_id=${orgao_id}`);
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
                removido_em: null,
                orgaos: orgao_id ? { some: { orgao_id: orgao_id } } : undefined,
            },
            select: {
                id: true,
                titulo: true,
                nivel_maximo_tarefa: true,
                nivel_regionalizacao: true,
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

        return listActive.map((r) => {
            return {
                ...r,
                orgaos: r.orgaos.map((rr) => rr.orgao),
            };
        });
    }

    async update(id: number, dto: UpdatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (dto.titulo !== undefined) {
            const similarExists = await this.prisma.portfolio.count({
                where: {
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
                const findResp = await this.prisma.projeto.count({
                    where: {
                        responsavel: {
                            pessoa_fisica: {
                                orgao_id: orgaoRemoved.orgao.id,
                            },
                        },
                    },
                });

                if (findResp > 0)
                    throw new HttpException(
                        `Não é possível remover o órgão ${orgaoRemoved.orgao.sigla} pois há projetos com responsáveis deste órgão.`,
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
            if (prevVersions.filter((r) => r.grupo_portfolio_id == grupoPortId)) continue;

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
            if (dto.grupo_portfolio.filter((r) => r == prevPortRow.grupo_portfolio_id)) continue;

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

    async remove(id: number, user: PessoaFromJwt) {
        const count = await this.prisma.projeto.count({
            where: {
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
