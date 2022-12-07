import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEixoDto } from './dto/create-eixo.dto';
import { FilterEixoDto } from './dto/filter-eixo.dto';
import { UpdateEixoDto } from './dto/update-eixo.dto';

@Injectable()
export class EixoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createEixoDto: CreateEixoDto, user: PessoaFromJwt) {

        const created = await this.prisma.macroTema.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createEixoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll(filters: FilterEixoDto | undefined = undefined) {
        let pdmId = filters?.pdm_id;

        let listActive = await this.prisma.macroTema.findMany({
            where: {
                removido_em: null,
                pdm_id: pdmId
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
        delete updateEixoDto.pdm_id; // nao deixa editar o PDM

        await this.prisma.macroTema.update({
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
