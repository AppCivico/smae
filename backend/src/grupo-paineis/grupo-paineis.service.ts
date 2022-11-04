import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGrupoPaineisDto } from './dto/create-grupo-paineis.dto';
import { FilterGrupoPaineisDto } from './dto/filter-grupo-paineis.dto';
import { UpdateGrupoPaineisDto } from './dto/update-grupo-paineis.dto';

@Injectable()
export class GrupoPaineisService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createGrupoPaineisDto: CreateGrupoPaineisDto, user: PessoaFromJwt) {

        const created = await this.prisma.grupoPainel.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createGrupoPaineisDto,
            },
            select: { id: true, nome: true }
        });

        return created;
    }

    async findAll(filters: FilterGrupoPaineisDto | undefined = undefined) {
        let ativo = filters?.ativo;

        let searchCond;
        if (typeof(ativo) === undefined) {
            searchCond = { removido_em: null }
        } else {
            searchCond = {
                removido_em: null,
                ativo: ativo
            }
        }

        let listActive = await this.prisma.grupoPainel.findMany({
            where: {...searchCond},
            select: {
                id: true,
                nome: true,
                ativo: true
            }
        });
        return listActive;
    }

    async update(id: number, updateGrupoPaineisDto: UpdateGrupoPaineisDto, user: PessoaFromJwt) {

        await this.prisma.grupoPainel.update({
            where: { id: id },
            data: {
                ...updateGrupoPaineisDto,
            }
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.grupoPainel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
