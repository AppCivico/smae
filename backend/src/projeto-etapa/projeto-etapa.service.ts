import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjetoEtapaDto } from './dto/create-projeto-etapa.dto';
import { UpdateProjetoEtapaDto } from './dto/update-projeto-etapa.dto';
import { TipoProjeto } from '@prisma/client';
import { FilterProjetoEtapaDto } from './dto/filter-projeto-etapa.dto';

@Injectable()
export class ProjetoEtapaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoProjeto, dto: CreateProjetoEtapaDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.projetoEtapa.count({
            where: {
                tipo_projeto: tipo,
                descricao: { equals: dto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.projetoEtapa.create({
            data: {
                portfolio_id: dto.portfolio_id,
                tipo_projeto: tipo,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                descricao: dto.descricao,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(tipo: TipoProjeto, filters: FilterProjetoEtapaDto) {
        const listActive = await this.prisma.projetoEtapa.findMany({
            where: {
                removido_em: null,
                tipo_projeto: tipo,
                portfolio_id: filters.portfolio_id,
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
            orderBy: { descricao: 'asc' },
        });

        return listActive;
    }

    async update(tipo: TipoProjeto, id: number, dto: UpdateProjetoEtapaDto, user: PessoaFromJwt) {
        await this.prisma.projetoEtapa.findFirstOrThrow({
            where: { id: id, tipo_projeto: tipo },
        });

        if (dto.descricao !== undefined) {
            const similarExists = await this.prisma.projetoEtapa.count({
                where: {
                    tipo_projeto: tipo,
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
                portfolio_id: dto.portfolio_id,
            },
        });

        return { id };
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        const emUso = await this.prisma.projeto.count({
            where: { tipo, removido_em: null, projeto_etapa_id: id },
        });
        if (emUso > 0) throw new HttpException('Etapa em uso em projetos.', 400);

        const created = await this.prisma.projetoEtapa.updateMany({
            where: { id: id, tipo_projeto: tipo },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
