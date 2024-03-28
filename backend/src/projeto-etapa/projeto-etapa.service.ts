import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjetoEtapaDto } from './dto/create-projeto-etapa.dto';
import { UpdateProjetoEtapaDto } from './dto/update-projeto-etapa.dto';

@Injectable()
export class ProjetoEtapaService {
    constructor(
        private readonly prisma: PrismaService
    ) {}

    async create(dto: CreateProjetoEtapaDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.projetoEtapa.count({
            where: {
                descricao: { equals: dto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.projetoEtapa.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                descricao: dto.descricao,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.projetoEtapa.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
            },
            orderBy: { descricao: 'asc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateProjetoEtapaDto, user: PessoaFromJwt) {
        await this.prisma.projetoEtapa.findFirstOrThrow({
            where: { id: id },
        });

        if (dto.descricao !== undefined) {
            const similarExists = await this.prisma.projetoEtapa.count({
                where: {
                    descricao: { equals: dto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });

            if (similarExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        await this.prisma.projetoEtapa.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                descricao: dto.descricao,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.projeto.count({
            where: {
                removido_em: null,
                projeto_etapa_id: id,
            },
        });
        if (emUso > 0) throw new HttpException('Etapa em uso em projetos.', 400);

        const created = await this.prisma.projetoEtapa.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
