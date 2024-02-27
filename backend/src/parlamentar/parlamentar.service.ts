import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateParlamentarDto } from './dto/create-parlamentar.dto';
import { Prisma } from '@prisma/client';
import { ParlamentarDetailDto, ParlamentarDto } from './entities/parlamentar.entity';
import { UpdateParlamentarDto } from './dto/update-parlamentar.dto';

@Injectable()
export class ParlamentarService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateParlamentarDto, user?: PessoaFromJwt): Promise<RecordWithId> {

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.create({
                    data: {
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                        
                    },
                    select: { id: true },
                });

                return parlamentar;
            }
        );

        return created;
    }

    async findAll(): Promise<ParlamentarDto[]> {
        const listActive = await this.prisma.parlamentar.findMany({
            where: {
                // TODO: filtros.
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                em_atividade: true
            },
            orderBy: [{ nome: 'asc' }],
        });

        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ParlamentarDetailDto> {
        return await this.prisma.parlamentar.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async update(id: number, dto: UpdateParlamentarDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                });

                return parlamentar;
            }
        );
    
        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO verificar dependentes

        const deleted = await this.prisma.parlamentar.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }

    async createMandato() {
        
    }
}
