import { HttpException, Injectable } from '@nestjs/common';
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

        const created = await this.prisma.portfolio.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...dto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll(user: PessoaFromJwt): Promise<PortfolioDto[]> {
        const listActive = await this.prisma.portfolio.findMany({
            where: {
                removido_em: null,
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

        await this.prisma.portfolio.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...dto,
            }
        });

        return { id };
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
