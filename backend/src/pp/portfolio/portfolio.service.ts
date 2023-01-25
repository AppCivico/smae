import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { PortfolioDto } from './entities/portfolio.entity';

@Injectable()
export class PortfolioService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.portfolio.count({
            where: {
                titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                removido_em: null
            }
        });
        if (similarExists > 0)
            throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const row = await prismaTx.portfolio.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    titulo: dto.titulo,

                },
                select: { id: true }
            });

            if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
                await prismaTx.portfolioOrgao.createMany({
                    data: dto.orgaos.map(r => {
                        return {
                            orgao_id: r,
                            portfolio_id: row.id
                        }
                    })
                });
            }

            return row;
        });

        return created;
    }

    async findAll(user: PessoaFromJwt): Promise<PortfolioDto[]> {
        let orgao_id: undefined | number = undefined;
        if (!user.hasSomeRoles(['Projeto.administrador'])) {
            // provavelmente há outras situações para criar aqui, por exemplo, se a pessoa fizer
            // parte dos responsáveis, ela pode visualizar mas não pode criar
            if (user.hasSomeRoles(['SMAE.gestor_de_projeto']) === false)
                throw new HttpException('Necessário SMAE.gestor_de_projeto se não for Projeto.administrador', 400);

            // só vai poder ver os portfolios que tem a organização dele
            if (!user.orgao_id) throw new HttpException('usuário está sem órgão', 400);
            orgao_id = user.orgao_id!;
        }

        const listActive = await this.prisma.portfolio.findMany({
            where: {
                removido_em: null,
                orgaos: orgao_id ? {
                    some: {
                        orgao_id: orgao_id
                    }
                } : undefined
            },
            select: {
                id: true,
                titulo: true,
                orgaos: {
                    select: {
                        orgao: {
                            select: {
                                sigla: true,
                                descricao: true,
                                id: true
                            }
                        }
                    }
                }
            }
        });

        return listActive.map(r => {
            return {
                ...r,
                orgaos: r.orgaos.map(rr => rr.orgao)
            }
        });
    }

    async update(id: number, dto: UpdatePortfolioDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (dto.titulo !== undefined) {
            const similarExists = await this.prisma.portfolio.count({
                where: {
                    titulo: { endsWith: dto.titulo, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('titulo| Título igual ou semelhante já existe em outro registro ativo', 400);
        }


        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {

            const row = await prismaTx.portfolio.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    titulo: dto.titulo
                },
                select: { id: true }
            });

            await prismaTx.portfolioOrgao.deleteMany({
                where: { portfolio_id: row.id }
            })

            if (Array.isArray(dto.orgaos) && dto.orgaos.length > 0) {
                await prismaTx.portfolioOrgao.createMany({
                    data: dto.orgaos.map(r => {
                        return {
                            orgao_id: r,
                            portfolio_id: row.id
                        }
                    })
                });
            }
            return row;
        });

        return { id: created.id };
    }

    async remove(id: number, user: PessoaFromJwt) {

        // TODO: verificar por exemplo, se todos os projetos estão arquivados?

        const created = await this.prisma.portfolio.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
