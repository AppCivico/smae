import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOdsDto } from './dto/create-ods.dto';
import { UpdateOdsDto } from './dto/update-ods.dto';

@Injectable()
export class OdsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createOdsDto: CreateOdsDto, user: PessoaFromJwt) {
        const equalExists = await this.prisma.ods.count({ where: { numero: createOdsDto.numero, removido_em: null } });
        if (equalExists > 0)
            throw new HttpException('numero| Número já existe em outro registro ativo', 400);

        const created = await this.prisma.ods.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createOdsDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.ods.findMany({
            where: {
                removido_em: null,
            },
            select: { id: true, descricao: true, titulo: true, numero: true }
        });

        return listActive;
    }

    async update(id: number, updateOdsDto: UpdateOdsDto, user: PessoaFromJwt) {

        if (updateOdsDto.numero !== undefined) {
            const equalExists = await this.prisma.ods.count({
                where: {
                    numero: updateOdsDto.numero,
                    removido_em: null,
                    NOT: { id: id }
                }
            });
            if (equalExists > 0)
                throw new HttpException('numero| Número já existe em outro registro ativo', 400);
        }

        await this.prisma.ods.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateOdsDto,
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const existsDown = await this.prisma.tag.count({
            where: { ods_id: id, removido_em: null }
        });
        if (existsDown > 0) throw new HttpException(`Há ${existsDown} tag(s) dependentes. Remova primeiro as tags.`, 400);

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
