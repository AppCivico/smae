import { HttpException, Injectable } from '@nestjs/common';
import { DistribuicaoStatusTipo, Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from '../../../common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDistribuicaoStatusDto } from './dto/create-distribuicao-status.dto';
import { UpdateDistribuicaoStatusDto } from './dto/update-distribuicao-status.dto';
import { DistribuicaoStatusDto, ListDistribuicaoStatusDto } from './entities/distribuicao-status.dto';

@Injectable()
export class DistribuicaoStatusService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateDistribuicaoStatusDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.distribuicaoStatus.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        tipo: dto.tipo,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                let valor_contabilizado_calc: boolean;
                // let valor_contabilizado_calc: boolean | undefined = dto.valor_distribuicao_contabilizado;
                if (dto.valor_distribuicao_contabilizado == undefined) {
                    // Define pelo tipo
                    valor_contabilizado_calc =
                        dto.tipo == DistribuicaoStatusTipo.Cancelada ||
                        dto.tipo == DistribuicaoStatusTipo.ImpedidaTecnicamente
                            ? false
                            : true;
                } else {
                    valor_contabilizado_calc = dto.valor_distribuicao_contabilizado;
                }

                let permite_novos_registros: boolean;
                if (dto.permite_novos_registros == undefined) {
                    permite_novos_registros =
                        dto.tipo == DistribuicaoStatusTipo.Cancelada ||
                        dto.tipo == DistribuicaoStatusTipo.ImpedidaTecnicamente ||
                        dto.tipo == DistribuicaoStatusTipo.Finalizada
                            ? false
                            : true;
                } else {
                    permite_novos_registros = dto.permite_novos_registros;
                }

                const transferenciaTipoDistribuicaoStatus = await prismaTxn.distribuicaoStatus.create({
                    data: {
                        nome: dto.nome,
                        tipo: dto.tipo,
                        valor_distribuicao_contabilizado: valor_contabilizado_calc,
                        permite_novos_registros: permite_novos_registros,
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

    async findOne(id: number, user: PessoaFromJwt): Promise<DistribuicaoStatusDto> {
        const row = await this.prisma.distribuicaoStatus.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                tipo: true,
                valor_distribuicao_contabilizado: true,
                permite_novos_registros: true,
            },
        });

        return {
            id: row.id,
            nome: row.nome,
            tipo: row.tipo,
            valor_distribuicao_contabilizado: row.valor_distribuicao_contabilizado,
            permite_novos_registros: row.permite_novos_registros,
            pode_editar: true,
            status_base: false,
        };
    }

    async findAllDistribuicaoStatus(): Promise<ListDistribuicaoStatusDto> {
        const rows = await this.prisma.distribuicaoStatus.findMany({
            where: {
                removido_em: null,
            },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                tipo: true,
                valor_distribuicao_contabilizado: true,
                permite_novos_registros: true,
            },
        });

        const rowsBase = await this.prisma.distribuicaoStatusBase.findMany({
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                tipo: true,
                valor_distribuicao_contabilizado: true,
                permite_novos_registros: true,
            },
        });

        return {
            linhas_base: rowsBase.map((r) => {
                return {
                    id: r.id,
                    nome: r.nome,
                    tipo: r.tipo,
                    valor_distribuicao_contabilizado: r.valor_distribuicao_contabilizado,
                    permite_novos_registros: r.permite_novos_registros,
                    pode_editar: false,
                    status_base: true,
                };
            }),

            linhas_customizadas: rows.map((r) => {
                return {
                    id: r.id,
                    nome: r.nome,
                    tipo: r.tipo,
                    valor_distribuicao_contabilizado: r.valor_distribuicao_contabilizado,
                    permite_novos_registros: r.permite_novos_registros,
                    pode_editar: true,
                    status_base: false,
                };
            }),
        };
    }

    async updateDistribuicaoStatus(
        id: number,
        dto: UpdateDistribuicaoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Não pode atualizar caso tenha rows de histórico de status em dist.
                const emUso = await prismaTxn.distribuicaoRecursoStatus.count({
                    where: {
                        removido_em: null,
                        status_id: id,
                    },
                });
                if (emUso) throw new HttpException('Edição indisponível, pois status já está em uso em histórico', 400);

                const transferenciaTipoDistribuicaoStatus = await prismaTxn.distribuicaoStatus.update({
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

                const similarExists = await this.prisma.distribuicaoStatus.count({
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
        // Não pode remover caso tenha rows de histórico de status em dist.
        const emUso = await this.prisma.distribuicaoRecursoStatus.count({
            where: {
                removido_em: null,
                status_id: id,
            },
        });
        if (emUso) throw new HttpException('Remoção indisponível, pois tipo de status já está em uso', 400);

        await this.prisma.distribuicaoStatus.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
