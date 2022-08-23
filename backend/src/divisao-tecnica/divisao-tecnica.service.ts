import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDivisaoTecnicaDto } from './dto/create-divisao-tecnica.dto';
import { UpdateDivisaoTecnicaDto } from './dto/update-divisao-tecnica.dto';

@Injectable()
export class DivisaoTecnicaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDivisaoTecnicaDto: CreateDivisaoTecnicaDto, user: PessoaFromJwt) {

        const created = await this.prisma.cargo.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createDivisaoTecnicaDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.cargo.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true }
        });

        return listActive;
    }

    async update(id: number, updateDivisaoTecnicaDto: UpdateDivisaoTecnicaDto, user: PessoaFromJwt) {

        const created = await this.prisma.cargo.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateDivisaoTecnicaDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.cargo.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
