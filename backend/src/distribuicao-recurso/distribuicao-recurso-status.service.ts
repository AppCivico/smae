import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateDistribuicaoRecursoStatusDto } from './dto/create-distribuicao-recurso-status.dto';
import { UpdateDistribuicaoRecursoStatusDto } from './dto/update-distribuicao-recurso-status.dto';

@Injectable()
export class DistribuicaoRecursoStatusService {
    constructor(private readonly prisma: PrismaService) {}

    async create(
        distribuicao_id: number,
        dto: CreateDistribuicaoRecursoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        if (dto.status_base_id == undefined && dto.status_id == undefined)
            throw new HttpException('É necessário enviar um ID de status.', 400);

        if (dto.status_base_id != undefined && dto.status_id != undefined)
            throw new HttpException('É permitido apenas um ID de status.', 400);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Verificando se tem status anterior e status anterior permite novas entradas.
                const statusAnterior = await prismaTx.distribuicaoRecursoStatus.findFirst({
                    where: {
                        removido_em: null,
                        distribuicao_id: distribuicao_id,
                    },
                    orderBy: { data_troca: 'desc' },
                    select: {
                        status_base: true,
                        status: true,
                    },
                });
                if (statusAnterior) {
                    const status_config = statusAnterior.status_base ?? statusAnterior.status;

                    if (!status_config!.permite_novos_registros)
                        throw new HttpException('Status atual não permite novos registros.', 400);
                }

                const distribuicaoRecursoStatus = await prismaTx.distribuicaoRecursoStatus.create({
                    data: {
                        distribuicao_id: distribuicao_id,
                        status_base_id: dto.status_base_id,
                        status_id: dto.status_id,
                        motivo: dto.motivo,
                        data_troca: dto.data_troca,
                        orgao_responsavel_id: dto.orgao_responsavel_id,
                        nome_responsavel: dto.nome_responsavel,
                        criado_por: user.id,
                    },
                    select: {
                        id: true,
                    },
                });

                return { id: distribuicaoRecursoStatus.id };
            }
        );

        return { id: created.id };
    }

    async update(
        distribuicao_id: number,
        id: number,
        dto: UpdateDistribuicaoRecursoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            // Verificando se existe status mais novo. Ou seja, não pode editar.
            const self = await prismaTx.distribuicaoRecursoStatus.findFirstOrThrow({
                where: {
                    id: id,
                    distribuicao_id: distribuicao_id,
                    removido_em: null,
                },
                select: {
                    data_troca: true,
                },
            });

            const maisNovoExiste = await prismaTx.distribuicaoRecursoStatus.count({
                where: {
                    removido_em: null,
                    distribuicao_id: distribuicao_id,
                    data_troca: { gt: self.data_troca },
                },
            });
            if (maisNovoExiste)
                throw new HttpException('Status não pode ser atualizado, pois não é o status atual.', 400);

            await prismaTx.distribuicaoRecursoStatus.update({
                where: { id },
                data: {
                    motivo: dto.motivo,
                    data_troca: dto.data_troca,
                    orgao_responsavel_id: dto.orgao_responsavel_id,
                    nome_responsavel: dto.nome_responsavel,
                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                },
                select: {
                    id: true,
                },
            });

            return { id };
        });

        return { id };
    }

    async remove(distribuicao_id: number, id: number, user: PessoaFromJwt) {
        const exists = await this.prisma.distribuicaoRecursoStatus.findFirst({
            where: {
                id,
                distribuicao_id,
                removido_em: null,
            },
            select: { id: true },
        });
        if (!exists) return;

        await this.prisma.distribuicaoRecursoStatus.updateMany({
            where: {
                id,
                distribuicao_id,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }
}
