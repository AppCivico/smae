import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProjetoProgramaDto, FilterProjetoProgramaDto, UpdateProgramaDto } from './dto/programa.dto';

@Injectable()
export class ProjetoProgramaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createTagDto: CreateProjetoProgramaDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.projetoPrograma.count({
            where: {
                nome: { equals: createTagDto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.projetoPrograma.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: createTagDto.nome,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterProjetoProgramaDto) {
        const listActive = await this.prisma.projetoPrograma.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
            },
            orderBy: { nome: 'asc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateProgramaDto, user: PessoaFromJwt) {
        const self = await this.prisma.projetoPrograma.findFirstOrThrow({
            where: { id: id },
            select: { id: true },
        });

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.projetoPrograma.count({
                where: {
                    nome: { equals: dto.nome, mode: 'insensitive' },
                    removido_em: null,

                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.projetoPrograma.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                nome: dto.nome,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.projeto.count({
            where: {
                removido_em: null,
                projeto_programa_id: id,
            },
        });
        if (emUso > 0) throw new HttpException('Registro em uso em Projetos.', 400);

        const created = await this.prisma.projetoPrograma.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
