import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UpsertPortfolioTagDto } from './dto/upsert-portfolio-tag.dto';
import { ListPortfolioTagDto } from './dto/list-portfolio-tag.dto';
import { FilterPortfolioTagDto } from './dto/filter-portfolio-tag.dto';

@Injectable()
export class PortfolioTagService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: UpsertPortfolioTagDto, user?: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        if (id) {
            const self = await this.prisma.portfolioTag.findFirst({
                where: { id, removido_em: null },
                select: {
                    descricao: true,
                },
            });
            if (!self) throw new HttpException('Tag de portfólio não encontrada', 404);
        }

        const similarExists = await this.prisma.portfolioTag.count({
            where: {
                id: { not: id || 0 },
                descricao: { endsWith: dto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);

        // Verificando portfolio (deve ser de PP)
        const portfolio = await this.prisma.portfolio.findFirst({
            where: { id: dto.portfolio_id, tipo_projeto: 'PP', removido_em: null },
            select: { id: true },
        });
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

    async findAll(filters?: FilterPortfolioTagDto): Promise<ListPortfolioTagDto> {
        const listActive = await this.prisma.portfolioTag.findMany({
            where: {
                removido_em: null,
                portfolio_id: filters?.portfolio_id,
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
            },
            orderBy: [{ descricao: 'asc' }],
        });
        return { linhas: listActive };
    }

    async findOne(id: number, user: PessoaFromJwt) {
        return await this.prisma.portfolioTag.findUniqueOrThrow({
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
            },
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        // Verificando se está em uso
        const emUso = await this.prisma.projetoPortfolioTag.count({
            where: { portfolio_tag_id: id },
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
