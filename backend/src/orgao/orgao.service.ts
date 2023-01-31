import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';

@Injectable()
export class OrgaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createOrgaoDto: CreateOrgaoDto, user?: PessoaFromJwt) {
        const similarExists = await this.prisma.orgao.count({
            where: {
                descricao: { endsWith: createOrgaoDto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0) throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        if (createOrgaoDto.sigla) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    sigla: { endsWith: createOrgaoDto.sigla, mode: 'insensitive' },
                    removido_em: null,
                },
            });
            if (similarExists > 0) throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        const created = await this.prisma.orgao.create({
            data: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                ...createOrgaoDto,
            },
            select: { id: true },
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
                    select: { descricao: true, id: true },
                },
            },
        });
        return listActive;
    }

    async findOne(id: number) {
        return await this.prisma.orgao.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async update(id: number, updateOrgaoDto: UpdateOrgaoDto, user: PessoaFromJwt) {
        if (updateOrgaoDto.descricao !== undefined) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    descricao: { endsWith: updateOrgaoDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0) throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (updateOrgaoDto.sigla) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    sigla: { endsWith: updateOrgaoDto.sigla, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0) throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.orgao.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateOrgaoDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO
        // verificar se há pessoas neste orgao
        const created = await this.prisma.orgao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
