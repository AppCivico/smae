import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';

@Injectable()
export class OrgaoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createOrgaoDto: CreateOrgaoDto, user: PessoaFromJwt) {

        const created = await this.prisma.orgao.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createOrgaoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.orgao.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                sigla: true,
                tipo_orgao: {
                    select: { descricao: true, id: true }
                },
            }
        });

        return listActive;
    }

    async update(id: number, updateOrgaoDto: UpdateOrgaoDto, user: PessoaFromJwt) {

        const created = await this.prisma.orgao.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateOrgaoDto,
            },
            select: { id: true, descricao: true }
        });

        return created;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.orgao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
