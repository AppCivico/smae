import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateLicoesApreendidasDto } from './dto/create-licoes-aprendidas.dto';
import { LicaoAprendida } from './entities/licoes-aprendidas.entity';
import { UpdateLicoesAprendidasDto } from './dto/update-licoes-aprendidas.dto';

@Injectable()
export class LicoesAprendidasService {
    private readonly logger = new Logger(LicoesAprendidasService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreateLicoesApreendidasDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {

            const licao_aprendida = await prismaTx.projetoLicaoAprendida.create({
                data: {
                    ...dto,

                    projeto_id: projetoId,
                    criado_em: new Date(Date.now()),
                    criado_por: user.id
                },
                select: { id: true }
            });

            return { id: licao_aprendida.id };
        });

        return { id: created.id }
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<LicaoAprendida[]> {
        const projetoLicoesAprendidas = await this.prisma.projetoLicaoAprendida.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null
            },
            orderBy: [{ data_registro: 'desc' }],
            select: {
                id: true,
                data_registro: true,
                responsavel: true,
                descricao: true,
                observacao: true,
            }
        });

        return projetoLicoesAprendidas;
    }

    async findOne(projetoId: number, id: number, user: PessoaFromJwt): Promise<LicaoAprendida> {
        const licaoAprendida = await this.prisma.projetoLicaoAprendida.findFirst({
            where: {
                id,
                projeto_id: projetoId,
                removido_em: null
            },
            select: {
                id: true,
                data_registro: true,
                responsavel: true,
                descricao: true,
                observacao: true,
            }
        });
        if (!licaoAprendida) throw new HttpException('Não foi possível encontrar lição aprendida para este ID', 400)
        
        return licaoAprendida;
    }

    async update(projeto_id: number, id: number, dto: UpdateLicoesAprendidasDto, user: PessoaFromJwt) {

        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {

            return await prismaTx.projetoLicaoAprendida.update({
                where: { id },
                data: {
                    ...dto,
                },
                select: { id: true }
            });
        });

        return updated;
    }

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.projetoLicaoAprendida.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
            },
            select: { id: true }
        });

        return await this.prisma.projetoLicaoAprendida.updateMany({
            where: {
                id,
                projeto_id: projeto_id
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id
            }
        })
    }

}
