import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRegiaoDto } from './dto/create-regiao.dto';
import { UpdateRegiaoDto } from './dto/update-regiao.dto';

@Injectable()
export class RegiaoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createRegiaoDto: CreateRegiaoDto, user: PessoaFromJwt) {

        if (createRegiaoDto.parente_id === null) {
            createRegiaoDto.parente_id = undefined;

            if (createRegiaoDto.nivel != 1) throw new HttpException('Região sem parente_id precisa ser nível 1', 404);
        }

        if (createRegiaoDto.parente_id) {
            const upper = await this.prisma.regiao.findFirst({ where: { id: createRegiaoDto.parente_id, removido_em: null }, select: { nivel: true } });
            if (!upper) throw new HttpException('Região acima não encontrada', 404);

            if (upper.nivel != createRegiaoDto.nivel - 1) {
                throw new HttpException('Região acima precisa ser do nível menor que a nova região', 400);
            }
        }

        const created = await this.prisma.regiao.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createRegiaoDto,
            },
            select: { id: true }
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.regiao.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                nivel: true,
                parente_id: true,
            }
        });

        return listActive;
    }

    async update(id: number, updateRegiaoDto: UpdateRegiaoDto, user: PessoaFromJwt) {

        const self = await this.prisma.regiao.findFirst({ where: { id: updateRegiaoDto.parente_id, removido_em: null }, select: { nivel: true } });
        if (!self) throw new HttpException('Região não encontrada', 404);

        if (updateRegiaoDto.parente_id) {
            const upper = await this.prisma.regiao.findFirst({ where: { id: updateRegiaoDto.parente_id, removido_em: null }, select: { nivel: true } });
            if (!upper) throw new HttpException('Região acima não encontrada', 404);

            if (upper.nivel != self.nivel - 1) {
                throw new HttpException('Região acima precisa ser de um nível menor que a atual', 400);
            }
        }

        await this.prisma.regiao.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateRegiaoDto,
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const self = await this.prisma.regiao.findFirst({
            where: { id: id }, select: { parente_id: true }
        });
        if (!self) throw new HttpException('Região não encontrada', 404);

        const existsDown = await this.prisma.regiao.count({
            where: { parente_id: id, removido_em: null }
        });
        if (existsDown > 0) throw new HttpException(`Há ${existsDown} região(ões) depedentes. Apgue primeiro as regiões abaixo.`, 400);

        const created = await this.prisma.regiao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }


    async getDetail(id: number, user: PessoaFromJwt) {
        const first = await this.prisma.regiao.findFirst({
            where: {
                id: id,
            },
            select: {
                id: true,
                descricao: true,
                nivel: true,
                parente_id: true,
                shapefile: true,
            }
        });
        if (!first) throw new HttpException('Região não encontrada', 404);

        return first;
    }
}
