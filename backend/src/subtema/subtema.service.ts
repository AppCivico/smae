import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubTemaDto } from './dto/create-subtema.dto';
import { UpdateSubTemaDto } from './dto/update-subtema.dto';

@Injectable()
export class SubTemaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createSubTemaDto: CreateSubTemaDto, user: PessoaFromJwt) {

        const created = await this.prisma.macroTema.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createSubTemaDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.macroTema.findMany({
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

    async update(id: number, updateSubTemaDto: UpdateSubTemaDto, user: PessoaFromJwt) {
        delete updateSubTemaDto.pdm_id; // nao deixa editar o PDM

        await this.prisma.macroTema.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateSubTemaDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.macroTema.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
