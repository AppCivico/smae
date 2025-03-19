import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    CreateModalidadeContratacaoDto,
    FilterModalidadeContratacaoDto,
    UpdateModalidadeContratacaoDto,
} from './dto/mod-contratacao.dto';

@Injectable()
export class ProjetoModalidadeContratacaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateModalidadeContratacaoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.modalidadeContratacao.count({
            where: {
                nome: { equals: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.modalidadeContratacao.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterModalidadeContratacaoDto) {
        const listActive = await this.prisma.modalidadeContratacao.findMany({
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

    async update(id: number, dto: UpdateModalidadeContratacaoDto, user: PessoaFromJwt) {
        const self = await this.prisma.modalidadeContratacao.findFirstOrThrow({
            where: { id: id },
            select: { id: true },
        });

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.modalidadeContratacao.count({
                where: {
                    nome: { equals: dto.nome, mode: 'insensitive' },
                    removido_em: null,

                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.modalidadeContratacao.update({
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
                modalidade_contratacao_id: id,
            },
        });
        if (emUso > 0) throw new HttpException('Registro em uso em Projetos.', 400);

        const existsModalidadeRelacionada = await this.prisma.contrato.count({
            where: {
                removido_em: null,
                modalidade_contratacao_id: id,
            },
        });

        if (existsModalidadeRelacionada > 0) {
            throw new HttpException('Essa modalidade de contratação esta sendo usada em algum contrato. Não é possível excluir', 400);
        }

        const created = await this.prisma.modalidadeContratacao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
    
}
