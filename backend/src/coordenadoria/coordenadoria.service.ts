import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCoordenadoriaDto } from './dto/create-coordenadoria.dto';
import { UpdateCoordenadoriaDto } from './dto/update-coordenadoria.dto';

@Injectable()
export class CoordenadoriaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createCoordenadoriaDto: CreateCoordenadoriaDto, user: PessoaFromJwt) {

        const created = await this.prisma.coordenadoria.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createCoordenadoriaDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.coordenadoria.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true }
        });

        return listActive;
    }

    async update(id: number, updateCoordenadoriaDto: UpdateCoordenadoriaDto, user: PessoaFromJwt) {

        const created = await this.prisma.coordenadoria.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateCoordenadoriaDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.coordenadoria.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
