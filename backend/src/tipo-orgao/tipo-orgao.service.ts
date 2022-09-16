import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTipoOrgaoDto } from './dto/create-tipo-orgao.dto';
import { UpdateTipoOrgaoDto } from './dto/update-tipo-orgao.dto';

@Injectable()
export class TipoOrgaoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTipoOrgaoDto: CreateTipoOrgaoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.tipoOrgao.count({
            where: {
                descricao: { endsWith: createTipoOrgaoDto.descricao, mode: 'insensitive' },
                removido_em: null,
            }
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

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
        const self = await this.prisma.tipoOrgao.findFirst({ where: { id: id }, select: { id: true } });
        if (!self) throw new HttpException('Tipo de órgão não encontrado', 404);

        if (updateTipoOrgaoDto.descricao !== undefined) {
            const similarExists = await this.prisma.tipoOrgao.count({
                where: {
                    descricao: { endsWith: updateTipoOrgaoDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id }
                }
            });
            if (similarExists > 0)
                throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

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
        const self = await this.prisma.tipoOrgao.findFirst({ where: { id: id }, select: { id: true } });
        if (!self) throw new HttpException('Tipo de órgão não encontrado', 404);

        const existsDown = await this.prisma.orgao.count({
            where: { tipo_orgao_id: id, removido_em: null }
        });
        if (existsDown > 0) throw new HttpException(`Não é possível remover: Há ${existsDown} órgão(ãos) dependentes.`, 400);

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
