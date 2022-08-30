import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFonteRecursoDto } from './dto/create-fonte-recurso.dto';
import { UpdateFonteRecursoDto } from './dto/update-fonte-recurso.dto';

@Injectable()
export class FonteRecursoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createFonteRecursoDto: CreateFonteRecursoDto, user: PessoaFromJwt) {

        const created = await this.prisma.fonteRecurso.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createFonteRecursoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        let listActive = await this.prisma.fonteRecurso.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                fonte: true,
                sigla: true,
            }
        });
        return listActive;
    }

    async update(id: number, updateFonteRecursoDto: UpdateFonteRecursoDto, user: PessoaFromJwt) {

        const created = await this.prisma.fonteRecurso.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateFonteRecursoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.fonteRecurso.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
