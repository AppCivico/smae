import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTipoOrgaoDto } from './dto/create-tipo-orgao.dto';
import { UpdateTipoOrgaoDto } from './dto/update-tipo-orgao.dto';

@Injectable()
export class TipoOrgaoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTipoOrgaoDto: CreateTipoOrgaoDto, user: PessoaFromJwt) {

        const created = await this.prisma.tipoOrgao.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTipoOrgaoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.tipoOrgao.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true }
        });

        return listActive;
    }

    async update(id: number, updateTipoOrgaoDto: UpdateTipoOrgaoDto, user: PessoaFromJwt) {

        await this.prisma.tipoOrgao.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTipoOrgaoDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.tipoOrgao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
