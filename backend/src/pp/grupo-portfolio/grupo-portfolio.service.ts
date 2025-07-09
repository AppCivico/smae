import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TipoProjeto } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGrupoPortfolioDto } from './dto/create-grupo-portfolio.dto';
import { FilterGrupoPortfolioDto, GrupoPortfolioItemDto } from './entities/grupo-portfolio.entity';
import { UpdateGrupoPortfolioDto } from './dto/update-grupo-portfolio.dto';
import { PessoaPrivilegioService } from '../../auth/pessoaPrivilegio.service';

@Injectable()
export class GrupoPortfolioService {
    private readonly logger = new Logger(GrupoPortfolioService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaPrivService: PessoaPrivilegioService
    ) {}

    async create(tipoProjeto: TipoProjeto, dto: CreateGrupoPortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orgao_id = dto.orgao_id ? dto.orgao_id : user.orgao_id;

        if (!orgao_id) throw new BadRequestException('Não foi possível determinar o órgão');

        if (!user.hasSomeRoles(['CadastroGrupoPortfolio.administrador', 'CadastroGrupoPortfolioMDO.administrador'])) {
            if (orgao_id != user.orgao_id)
                throw new BadRequestException('Você só tem permissão para criar Grupo de Portfólio no mesmo órgão.');
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const exists = await prismaTx.grupoPortfolio.count({
                    where: {
                        tipo_projeto: tipoProjeto,
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    [tipoProjeto == 'PP' ? 'SMAE.espectador_de_projeto' : 'MDO.espectador_de_projeto'],
                    dto.participantes
                );
                for (const pessoaId of dto.participantes) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser participante do grupo.`);
                }

                const gp = await prismaTx.grupoPortfolio.create({
                    data: {
                        tipo_projeto: tipoProjeto,
                        orgao_id,
                        titulo: dto.titulo,

                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                await prismaTx.grupoPortfolioPessoa.createMany({
                    data: dto.participantes.map((pessoaId) => {
                        const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_portfolio_id: gp.id,
                            criado_por: user.id,
                            orgao_id: pessoa.orgao_id,
                            pessoa_id: pessoa.pessoa_id,
                        };
                    }),
                });

                return { id: gp.id };
            }
        );

        return { id: created.id };
    }

    async findAll(tipoProjeto: TipoProjeto, filter: FilterGrupoPortfolioDto): Promise<GrupoPortfolioItemDto[]> {
        const rows = await this.prisma.grupoPortfolio.findMany({
            where: {
                tipo_projeto: tipoProjeto,
                id: filter.id,
                removido_em: null,
            },
            include: {
                GrupoPortfolioPessoa: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: [
                        {
                            pessoa: {
                                nome_exibicao: 'asc',
                            },
                        },
                    ],
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true,
                                id: true,
                            },
                        },
                    },
                },
                ProjetoGrupoPortfolio: filter.retornar_uso
                    ? {
                          where: {
                              removido_em: null,
                          },
                          include: {
                              projeto: {
                                  select: {
                                      id: true,
                                      nome: true,
                                      codigo: true,
                                  },
                              },
                          },
                      }
                    : undefined,
                PortfolioGrupoPortfolio: filter.retornar_uso
                    ? {
                          where: {
                              removido_em: null,
                          },
                          include: {
                              portfolio: {
                                  select: {
                                      id: true,
                                      titulo: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
            orderBy: { titulo: 'asc' },
        });

        // os dois any abaixo são por causa que o Prisma não gera a tipagem por causa do ternário do filter.retornar_uso
        return rows.map((r) => {
            return {
                id: r.id,
                titulo: r.titulo,
                criado_em: r.criado_em,
                orgao_id: r.orgao_id,
                portfolios: filter.retornar_uso ? r.PortfolioGrupoPortfolio.map((p: any) => p.portfolio) : [],
                projetos: filter.retornar_uso ? r.ProjetoGrupoPortfolio.map((p: any) => p.projeto) : [],
                participantes: r.GrupoPortfolioPessoa.map((p) => p.pessoa),
            };
        });
    }

    async update(
        tipoProjeto: TipoProjeto,
        id: number,
        dto: UpdateGrupoPortfolioDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const gp = await this.prisma.grupoPortfolio.findFirst({
            where: {
                id,
                tipo_projeto: tipoProjeto,
                removido_em: null,
            },
            select: {
                id: true,
                orgao_id: true,
            },
        });

        if (!gp) throw new NotFoundException('Grupo Portfólio não foi encontrado.');

        if (!user.hasSomeRoles(['CadastroGrupoPortfolio.administrador', 'CadastroGrupoPortfolioMDO.administrador'])) {
            if (user.orgao_id != gp.orgao_id)
                throw new BadRequestException('Você só tem permissão para editar Grupo de Portfólio no mesmo órgão.');
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            if (dto.titulo) {
                const exists = await prismaTx.grupoPortfolio.count({
                    where: {
                        NOT: { id: gp.id },
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');
            }

            if (dto.participantes) {
                const prevVersion = await prismaTx.grupoPortfolio.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoPortfolioPessoa: {
                            where: {
                                removido_em: null,
                            },
                            select: { pessoa_id: true },
                        },
                    },
                });

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    [tipoProjeto == 'PP' ? 'SMAE.espectador_de_projeto' : 'MDO.espectador_de_projeto'],
                    dto.participantes
                );

                const keptRecord: number[] = prevVersion?.GrupoPortfolioPessoa.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.participantes.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        this.logger.log(`participante removido: ${pessoaId}`);
                        await prismaTx.grupoPortfolioPessoa.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_portfolio_id: gp.id,
                                removido_em: null,
                            },
                            data: {
                                removido_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                for (const pessoaId of dto.participantes) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser participante do grupo.`);

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        this.logger.log(`Novo participante: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoPortfolioPessoa.create({
                            data: {
                                grupo_portfolio_id: gp.id,
                                criado_por: user.id,
                                orgao_id: pessoa.orgao_id,
                                pessoa_id: pessoa.pessoa_id,
                            },
                        });
                    } else {
                        this.logger.log(`participante mantido sem alterações: ${pessoaId}`);
                    }
                }
            }

            await prismaTx.grupoPortfolio.update({
                where: {
                    id: gp.id,
                },
                data: {
                    titulo: dto.titulo,

                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                },
                select: { id: true },
            });
        });

        return { id: gp.id };
    }

    async remove(tipoProjeto: TipoProjeto, id: number, user: PessoaFromJwt) {
        const exists = await this.prisma.grupoPortfolio.findFirst({
            where: {
                id,
                tipo_projeto: tipoProjeto,
                removido_em: null,
            },
            select: { id: true, orgao_id: true },
        });

        if (!exists) return;

        if (!user.hasSomeRoles(['CadastroGrupoPortfolio.administrador', 'CadastroGrupoPortfolioMDO.administrador'])) {
            if (user.orgao_id != exists.orgao_id)
                throw new BadRequestException('Você só tem permissão para remover Grupo de Portfólio no mesmo órgão.');
        }

        await this.prisma.grupoPortfolio.updateMany({
            where: {
                id,
                tipo_projeto: tipoProjeto,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }
}
