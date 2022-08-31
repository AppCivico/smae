import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEixoDto } from './dto/create-eixo.dto';
import { UpdateEixoDto } from './dto/update-eixo.dto';

@Injectable()
export class EixoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createEixoDto: CreateEixoDto, user: PessoaFromJwt) {

        const created = await this.prisma.eixo.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createEixoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.eixo.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                pdm_id: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateEixoDto: UpdateEixoDto, user: PessoaFromJwt) {

        await this.prisma.eixo.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateEixoDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.eixo.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
