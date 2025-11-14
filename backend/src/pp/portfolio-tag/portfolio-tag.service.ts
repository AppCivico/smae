import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpsertPortfolioTagDto } from './dto/upsert-portfolio-tag.dto';
import { ListPortfolioTagDto } from './dto/list-portfolio-tag.dto';
import { FilterPortfolioTagDto } from './dto/filter-portfolio-tag.dto';
import { PortfolioTagDto } from './entities/portfolio-tag.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { TipoProjeto } from '@prisma/client';

@Injectable()
export class PortfolioTagService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly portfolioService: PortfolioService
    ) {}

    async upsert(dto: UpsertPortfolioTagDto, user: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        if (id) {
            const self = await this.prisma.portfolioTag.findFirst({
                where: { id, removido_em: null },
                select: {
                    descricao: true,
                },
            });
            if (!self) throw new HttpException('Tag de portfólio não encontrada', 404);

            // Caso esteja em uso, não pode editar.
            const emUso = await this.prisma.projetoPortfolioTag.count({
                where: { portfolio_tag_id: id, removido_em: null, portfolio: { id: dto.portfolio_id } },
            });
            if (emUso > 0) throw new HttpException('Tag de portfólio em uso em projetos. Edição não permitida.', 400);
        }

        const similarExists = await this.prisma.portfolioTag.count({
            where: {
                id: { not: id || 0 },
                descricao: { endsWith: dto.descricao, mode: 'insensitive' },
                removido_em: null,
                portfolio_id: dto.portfolio_id,
            },
        });
        if (similarExists > 0)
            throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);

        // Verificando portfolio (deve ser de PP)
        // Chamando findOne do service de portfolio, para garantir permissão de acesso.
        const portfolio = await this.portfolioService.findOne(TipoProjeto.PP, dto.portfolio_id, user);
        if (!portfolio) throw new HttpException('Portfólio não encontrado', 404);

        const created = await this.prisma.portfolioTag.upsert({
            where: { id: id || 0 },
            create: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                descricao: dto.descricao,
                portfolio_id: dto.portfolio_id,
            },
            update: {
                atualizado_por: user ? user.id : undefined,
                atualizado_em: new Date(Date.now()),
                descricao: dto.descricao,
                portfolio_id: dto.portfolio_id,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(user: PessoaFromJwt, filters?: FilterPortfolioTagDto): Promise<ListPortfolioTagDto> {
        // Chamando findAll para verificar acesso.
        let portfoliosId = [];

        if (filters?.portfolio_id) {
            const portfolio = await this.portfolioService.findOne('PP', filters.portfolio_id, user);
            if (!portfolio) throw new HttpException('Portfólio não encontrado ou sem permissão para acesso', 400);
            portfoliosId = [filters.portfolio_id];
        } else {
            const portfolios = await this.portfolioService.findAll('PP', user, true);
            portfoliosId = portfolios.map((p) => p.id);
            if (portfoliosId.length === 0) {
                return { linhas: [] };
            }
        }

        const listActive = await this.prisma.portfolioTag.findMany({
            where: {
                removido_em: null,
                portfolio_id: { in: portfoliosId },
            },
            select: {
                id: true,
                descricao: true,
                portfolio: {
                    select: {
                        id: true,
                        titulo: true,
                    },
                },
                projetos: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        projeto_id: true,
                    },
                },
            },
            orderBy: [{ portfolio: { titulo: 'asc' } }, { descricao: 'asc' }],
        });

        const linhas = listActive.map((item) => ({
            id: item.id,
            descricao: item.descricao,
            portfolio_id: item.portfolio.id,
            portfolio: item.portfolio,
            pode_editar: true,
        }));

        return { linhas };
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<PortfolioTagDto> {
        const linha = await this.prisma.portfolioTag.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                descricao: true,
                portfolio: {
                    select: {
                        id: true,
                        titulo: true,
                    },
                },
                projetos: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        projeto_id: true,
                    },
                },
            },
        });

        return {
            id: linha.id,
            descricao: linha.descricao,
            portfolio_id: linha.portfolio.id,
            portfolio: linha.portfolio,
            pode_editar: true,
        };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // Verificando se está em uso
        const emUso = await this.prisma.projetoPortfolioTag.count({
            where: { portfolio_tag_id: id, removido_em: null },
        });
        if (emUso > 0) throw new HttpException('Tag de portfólio em uso em projetos.', 400);

        const deleted = await this.prisma.portfolioTag.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }
}
