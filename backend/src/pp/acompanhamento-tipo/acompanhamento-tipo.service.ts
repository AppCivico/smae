import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoAcompanhamentoItem } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { AcompanhamentoTipo } from './entities/acompanhament-tipo.entities.dto';
import { CreateTipoAcompanhamentoDto } from './dto/create-acompanhamento-tipo.dto';
import { UpdateAcompanhamentoTipoDto } from './dto/update-acompanhamento-tipo.dto';

@Injectable()
export class AcompanhamentoTipoService {
    private readonly logger = new Logger(AcompanhamentoTipoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateTipoAcompanhamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const acompanhamentoTipo = await this.prisma.acompanhamentoTipo.create({
            data: {
                nome: dto.nome,
                criado_em: new Date(Date.now()),
                criado_por: user.id,
            },
            select: { id: true }
        })

        return { id: acompanhamentoTipo.id }
    }

    async findAll(user: PessoaFromJwt): Promise<AcompanhamentoTipo[]> {
        const acompanhamentoTipoRows = await this.prisma.acompanhamentoTipo.findMany({
            select: {
                id: true,
                nome: true
            }
        })

        return acompanhamentoTipoRows
    }

    async update(id: number, dto: UpdateAcompanhamentoTipoDto, user: PessoaFromJwt) {
        return await this.prisma.acompanhamentoTipo.update({
            where: {id},
            data: {
                nome: dto.nome,
                atualizado_em: new Date(Date.now()),
                atualizado_por: user.id
            },
            select: { id: true }
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        return await this.prisma.acompanhamentoTipo.deleteMany({
            where: {
                id
            }
        });
    }
}
