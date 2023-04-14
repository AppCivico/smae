import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioDto, PortfolioOneDto } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.portfolio.count({
            where: {
                titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0) throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const row = await prismaTx.portfolio.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    titulo: dto.titulo,
                    nivel_maximo_tarefa: dto.nivel_maximo_tarefa || undefined, // deixa o default do banco
                },
                select: { id: true },
            });

            if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
                await prismaTx.portfolioOrgao.createMany({
                    data: dto.orgaos.map(r => {
                        return {
                            orgao_id: r,
                            portfolio_id: row.id,
                        };
                    }),
                });
            }

            return row;
        });

        return created;
    }

    async findOne(id: number, user: PessoaFromJwt | null): Promise<PortfolioOneDto> {
        let orgao_id: undefined | number = undefined;
        if (user != null && !user.hasSomeRoles(['Projeto.administrador_no_orgao'])) {
            orgao_id = user.orgao_id!;
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
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
                        orgao_id: true
                    },
                },
            },
        });

        return listActive.map(r => {
            return {
                ...r,
                orgaos: r.orgaos.map(rr => rr.orgao_id),
            };
        })[0];
    }

    async findAll(user: PessoaFromJwt): Promise<PortfolioDto[]> {
        let orgao_id: undefined | number = undefined;

        // só pra manter mais ou menos uma retrocompatibilidade com o frontend
        // preciso pensar melhor nesse filtro
        if (user.hasSomeRoles(['Projeto.administrador_no_orgao'])) {
            orgao_id = user.orgao_id!;
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
                removido_em: null,
                orgaos: orgao_id ? { some: { orgao_id: orgao_id }, } : undefined,
            },
            select: {
                id: true,
                titulo: true,
                nivel_maximo_tarefa: true,
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
        });

        return listActive.map(r => {
            return {
                ...r,
                orgaos: r.orgaos.map(rr => rr.orgao),
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
            if (similarExists > 0) throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);
        }


        if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {

            const toBeRemoved = await this.prisma.portfolioOrgao.findMany({
                where: {
                    portfolio_id: id,
                    orgao_id: { notIn: dto.orgaos.map(r => r) }
                },
                select: {
                    orgao: true
                }
            });

            for (const orgaoRemoved of toBeRemoved) {
                const findResp = await this.prisma.projeto.count({
                    where: {
                        responsavel: {
                            pessoa_fisica: {
                                orgao_id: orgaoRemoved.orgao.id
                            }
                        }
                    }
                });

                if (findResp > 0)
                    throw new HttpException(`Não é possível remover o órgão ${orgaoRemoved.orgao.sigla} pois há projetos com responsáveis deste órgão.`, 400);
            }
        }

        // conferir se todos os órgãos que estão saindo realmente nao estão em uso em nenhum projeto ativo
        // como orgao_gestor_id
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const row = await prismaTx.portfolio.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    titulo: dto.titulo,
                    nivel_maximo_tarefa: dto.nivel_maximo_tarefa,
                },
                select: { id: true },
            });


            if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {

                await prismaTx.portfolioOrgao.deleteMany({
                    where: { portfolio_id: row.id },
                });

                await prismaTx.portfolioOrgao.createMany({
                    data: dto.orgaos.map(r => {
                        return {
                            orgao_id: r,
                            portfolio_id: row.id,
                        };
                    }),
                });
            }
            return row;
        });

        return { id: created.id };
    }

    async remove(id: number, user: PessoaFromJwt) {

        const count = await this.prisma.projeto.count({
            where: {
                removido_em: null
            }
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
