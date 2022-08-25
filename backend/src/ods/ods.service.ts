import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOdsDto } from './dto/create-ods.dto';
import { UpdateOdsDto } from './dto/update-ods.dto';

@Injectable()
export class OdsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createOdsDto: CreateOdsDto, user: PessoaFromJwt) {

        const created = await this.prisma.ods.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createOdsDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.ods.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true }
        });

        return listActive;
    }

    async update(id: number, updateOdsDto: UpdateOdsDto, user: PessoaFromJwt) {

        const created = await this.prisma.ods.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateOdsDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.ods.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
