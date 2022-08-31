import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTagDto: CreateTagDto, user: PessoaFromJwt) {

        const created = await this.prisma.tag.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTagDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.tag.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
                ods_id: true,
                icone: true
            }
        });
        return listActive;
    }

    async update(id: number, updateTagDto: UpdateTagDto, user: PessoaFromJwt) {

        const created = await this.prisma.tag.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTagDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tag.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
