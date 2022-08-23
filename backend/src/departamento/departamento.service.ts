import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';

@Injectable()
export class DepartamentoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createDepartamentoDto: CreateDepartamentoDto, user: PessoaFromJwt) {

        const created = await this.prisma.departamento.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createDepartamentoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.departamento.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true }
        });

        return listActive;
    }

    async update(id: number, updateDepartamentoDto: UpdateDepartamentoDto, user: PessoaFromJwt) {

        const created = await this.prisma.departamento.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateDepartamentoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.departamento.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
