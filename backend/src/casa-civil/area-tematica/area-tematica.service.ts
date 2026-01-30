import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAreaTematicaDto, CreateAcaoDto } from './dto/create-area-tematica.dto';
import { UpdateAreaTematicaDto } from './dto/update-area-tematica.dto';
import { AreaTematicaDto } from './entities/area-tematica.entity';

@Injectable()
export class AreaTematicaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAreaTematicaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                let areaTematica;
                try {
                    areaTematica = await prismaTxn.areaTematica.create({
                        data: {
                            nome: dto.nome,
                            ativo: dto.ativo ?? true,
                            criado_por: user.id,
                            criado_em: now,
                        },
                        select: { id: true },
                    });
                } catch (error) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                        throw new HttpException('Área temática com este nome já existe', 400);
                    }
                    throw error;
                }

                // Create nested acoes if provided
                if (dto.acoes && dto.acoes.length > 0) {
                    try {
                        await prismaTxn.acao.createMany({
                            data: dto.acoes.map((acao) => ({
                                area_tematica_id: areaTematica.id,
                                nome: acao.nome,
                                ativo: acao.ativo,
                                criado_por: user.id,
                                criado_em: now,
                            })),
                        });
                    } catch (error) {
                        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                            throw new HttpException('Ação com nome duplicado na mesma área temática', 400);
                        }
                        throw error;
                    }
                }

                return areaTematica;
            },
            {
                isolationLevel: 'ReadCommitted',
            }
        );

        return created;
    }

    async findAll(): Promise<AreaTematicaDto[]> {
        const areas = await this.prisma.areaTematica.findMany({
            where: { removido_em: null },
            select: {
                id: true,
                nome: true,
                ativo: true,
                acoes: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        nome: true,
                        ativo: true,
                    },
                    orderBy: { nome: 'asc' },
                },
            },
            orderBy: { nome: 'asc' },
        });

        return areas;
    }

    async findOne(id: number): Promise<AreaTematicaDto> {
        const area = await this.prisma.areaTematica.findFirst({
            where: { id, removido_em: null },
            select: {
                id: true,
                nome: true,
                ativo: true,
                acoes: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        nome: true,
                        ativo: true,
                    },
                    orderBy: { nome: 'asc' },
                },
            },
        });

        if (!area) throw new HttpException('Área temática não encontrada', 404);

        return area;
    }

    async update(id: number, dto: UpdateAreaTematicaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                // Check if area exists
                const existing = await prismaTxn.areaTematica.findFirst({
                    where: { id, removido_em: null },
                    select: {
                        id: true,
                        acoes: {
                            where: { removido_em: null },
                            select: { id: true, nome: true },
                        },
                    },
                });

                if (!existing) throw new HttpException('Área temática não encontrada', 404);

                // Update area base fields
                const updateData: Prisma.AreaTematicaUncheckedUpdateInput = {
                    atualizado_por: user.id,
                    atualizado_em: now,
                };
                if (dto.nome !== undefined) updateData.nome = dto.nome;
                if (dto.ativo !== undefined) updateData.ativo = dto.ativo;

                try {
                    await prismaTxn.areaTematica.update({
                        where: { id },
                        data: updateData,
                    });
                } catch (error) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                        throw new HttpException('Área temática com este nome já existe', 400);
                    }
                    throw error;
                }

                // Handle nested acoes if provided
                if (dto.acoes !== undefined) {
                    await this.handleAcoesUpdate(prismaTxn, id, dto.acoes, existing.acoes, user, now);
                }

                return { id };
            },
            {
                isolationLevel: 'ReadCommitted',
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<void> => {
                const now = new Date(Date.now());

                // Check if area exists
                const existing = await prismaTxn.areaTematica.findFirst({
                    where: { id, removido_em: null },
                    select: {
                        id: true,
                        acoes: {
                            where: { removido_em: null },
                            select: { id: true },
                        },
                    },
                });

                if (!existing) throw new HttpException('Área temática não encontrada', 404);

                // Check if any acao is in use
                for (const acao of existing.acoes) {
                    // TODO: uncomment when demanda_acao table exists
                    // const emUso = await prismaTxn.demandaAcao.count({
                    //     where: { acao_id: acao.id },
                    // });
                    // if (emUso > 0) {
                    //     throw new HttpException(
                    //         'Não é possível remover a área temática pois possui ações em uso',
                    //         400
                    //     );
                    // }
                }

                // Soft delete all acoes
                if (existing.acoes.length > 0) {
                    await prismaTxn.acao.updateMany({
                        where: {
                            id: { in: existing.acoes.map((a) => a.id) },
                        },
                        data: {
                            removido_por: user.id,
                            removido_em: now,
                        },
                    });
                }

                // Soft delete area
                await prismaTxn.areaTematica.update({
                    where: { id },
                    data: {
                        removido_por: user.id,
                        removido_em: now,
                    },
                });
            },
            {
                isolationLevel: 'ReadCommitted',
            }
        );
    }

    /**
     * Handles update logic for nested acoes:
     * - With id: update existing
     * - Without id: dedup by name, upsert
     * - Missing in payload: check usage, soft delete if not in use
     */
    private async handleAcoesUpdate(
        prismaTxn: Prisma.TransactionClient,
        areaTematicaId: number,
        acoesDto: CreateAcaoDto[],
        existingAcoes: { id: number; nome: string }[],
        user: PessoaFromJwt,
        now: Date
    ): Promise<void> {
        const payloadIds = new Set(acoesDto.filter((a) => a.id).map((a) => a.id!));
        const existingMap = new Map(existingAcoes.map((a) => [a.id, a.nome]));

        // Process acoes from DTO
        for (const acaoDto of acoesDto) {
            if (acaoDto.id) {
                // Update existing acao
                if (!existingMap.has(acaoDto.id)) {
                    throw new HttpException(`Ação id=${acaoDto.id} não encontrada nesta área`, 400);
                }

                try {
                    await prismaTxn.acao.update({
                        where: { id: acaoDto.id },
                        data: {
                            nome: acaoDto.nome,
                            ativo: acaoDto.ativo,
                            atualizado_por: user.id,
                            atualizado_em: now,
                        },
                    });
                } catch (error) {
                    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                        throw new HttpException('Ação com nome duplicado na mesma área temática', 400);
                    }
                    throw error;
                }
            } else {
                // No id: check if name exists in this area, upsert
                const existing = await prismaTxn.acao.findFirst({
                    where: {
                        area_tematica_id: areaTematicaId,
                        nome: acaoDto.nome,
                        removido_em: null,
                    },
                    select: { id: true },
                });

                if (existing) {
                    // Update existing
                    await prismaTxn.acao.update({
                        where: { id: existing.id },
                        data: {
                            ativo: acaoDto.ativo,
                            atualizado_por: user.id,
                            atualizado_em: now,
                        },
                    });
                } else {
                    // Create new
                    try {
                        await prismaTxn.acao.create({
                            data: {
                                area_tematica_id: areaTematicaId,
                                nome: acaoDto.nome,
                                ativo: acaoDto.ativo,
                                criado_por: user.id,
                                criado_em: now,
                            },
                        });
                    } catch (error) {
                        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                            throw new HttpException('Ação com nome duplicado na mesma área temática', 400);
                        }
                        throw error;
                    }
                }
            }
        }

        // Handle missing acoes (in DB but not in payload)
        for (const [acaoId, acaoNome] of existingMap) {
            if (!payloadIds.has(acaoId)) {
                // Check if in use
                // TODO: uncomment when demanda_acao table exists
                // const emUso = await prismaTxn.demandaAcao.count({
                //     where: { acao_id: acaoId },
                // });
                // if (emUso > 0) {
                //     throw new HttpException(
                //         `Ação "${acaoNome}" está em uso e não pode ser removida`,
                //         400
                //     );
                // }

                // Soft delete
                await prismaTxn.acao.update({
                    where: { id: acaoId },
                    data: {
                        removido_por: user.id,
                        removido_em: now,
                    },
                });
            }
        }
    }
}
