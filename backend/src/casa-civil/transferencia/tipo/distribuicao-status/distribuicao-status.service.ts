import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from '../../../../common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateDistribuicaoStatusDto } from './dto/create-distribuicao-status.dto';
import { UpdateDistribuicaoStatusDto } from './dto/update-distribuicao-status.dto';
import { DistribuicaoStatusDto } from './entities/distribuicao-status.dto';

@Injectable()
export class DistribuicaoStatusService {
    constructor(private readonly prisma: PrismaService) {}

    async createDistribuicaoStatus(
        transferencia_tipo_id: number,
        dto: CreateDistribuicaoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.transferenciaTipoDistribuicaoStatus.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        tipo: dto.tipo,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const transferenciaTipoDistribuicaoStatus = await prismaTxn.transferenciaTipoDistribuicaoStatus.create({
                    data: {
                        transferencia_tipo_id,
                        nome: dto.nome,
                        tipo: dto.tipo,
                        valor_distribuicao_contabilizado: dto.valor_distribuicao_contabilizado,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferenciaTipoDistribuicaoStatus;
            }
        );

        return created;
    }

    async findAllDistribuicaoStatus(transferencia_tipo_id: number): Promise<DistribuicaoStatusDto[]> {
        const rows = await this.prisma.transferenciaTipoDistribuicaoStatus.findMany({
            where: {
                transferencia_tipo_id,
                removido_em: null,
            },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                tipo: true,
                valor_distribuicao_contabilizado: true,
            },
        });

        const rowsBase = await this.prisma.distribuicaoStatusBase.findMany({
            orderBy: { nome: 'asc' },
            select: {
                nome: true,
                tipo: true,
                valor_distribuicao_contabilizado: true,
            },
        });

        const ret: DistribuicaoStatusDto[] = rows.map((r) => {
            return {
                id: r.id,
                nome: r.nome,
                tipo: r.tipo,
                valor_distribuicao_contabilizado: r.valor_distribuicao_contabilizado,
                pode_editar: true,
            };
        });

        ret.push(
            ...rowsBase.map((r) => {
                return {
                    nome: r.nome,
                    tipo: r.tipo,
                    valor_distribuicao_contabilizado: r.valor_distribuicao_contabilizado,
                    pode_editar: false,
                };
            })
        );

        return ret;
    }

    async updateDistribuicaoStatus(
        id: number,
        dto: UpdateDistribuicaoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipoDistribuicaoStatus = await prismaTxn.transferenciaTipoDistribuicaoStatus.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        tipo: dto.tipo,
                        valor_distribuicao_contabilizado: dto.valor_distribuicao_contabilizado,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        nome: true,
                        tipo: true,
                        valor_distribuicao_contabilizado: true,
                    },
                });

                const similarExists = await this.prisma.transferenciaTipoDistribuicaoStatus.count({
                    where: {
                        nome: { endsWith: transferenciaTipoDistribuicaoStatus.nome, mode: 'insensitive' },
                        tipo: transferenciaTipoDistribuicaoStatus.tipo,
                        removido_em: null,
                    },
                });
                if (similarExists > 1) throw new HttpException('Já existe um registro com estes campos.', 400);

                return { id };
            }
        );

        return updated;
    }

    async removeDistribuicaoStatus(id: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaTipoDistribuicaoStatus.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
