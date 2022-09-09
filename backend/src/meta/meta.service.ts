import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMetaDto } from './dto/create-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';

@Injectable()
export class MetaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createMetaDto: CreateMetaDto, user: PessoaFromJwt) {

        const created = await this.prisma.meta.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                status: '',
                ativo: true,
                ...createMetaDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.meta.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                titulo: true,
                contexto: true,
                codigo: true,
                complemento: true,
                macro_tema: { select: { descricao: true, id: true } },
                tema: { select: { descricao: true, id: true } },
                sub_tema: { select: { descricao: true, id: true } },
                pdm_id: true,
                status: true,
                ativo: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateMetaDto: UpdateMetaDto, user: PessoaFromJwt) {

        await this.prisma.meta.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateMetaDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.meta.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
