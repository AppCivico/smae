import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuildArquivoBaseDto, PrismaArquivoComPreviewSelect } from 'src/upload/arquivo-preview.helper';
import { UploadService } from 'src/upload/upload.service';
import { AppendDemandaConfigAnexoDto } from './dto/demanda-config-anexo.dto';
import { CreateDemandaConfigDto } from './dto/create-demanda-config.dto';
import { FilterDemandaConfigDto } from './dto/filter-demanda-config.dto';
import { UpdateDemandaConfigDto } from './dto/update-demanda-config.dto';
import { DemandaConfigAnexoDto, DemandaConfigDetailDto, DemandaConfigDto } from './entities/demanda-config.entity';

@Injectable()
export class DemandaConfigService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    async create(dto: CreateDemandaConfigDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Validate dates
                if (dto.data_fim_vigencia && dto.data_fim_vigencia < dto.data_inicio_vigencia) {
                    throw new HttpException('data_fim_vigencia deve ser maior ou igual a data_inicio_vigencia', 400);
                }

                // Validate values
                const valorMinimo = parseFloat(dto.valor_minimo);
                const valorMaximo = parseFloat(dto.valor_maximo);
                if (valorMaximo < valorMinimo) {
                    throw new HttpException('valor_maximo deve ser maior ou igual a valor_minimo', 400);
                }

                // Find current active record FIRST (before overlap check)
                const activeConfig = await prismaTxn.demandaConfig.findFirst({
                    where: {
                        ativo: true,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        data_inicio_vigencia: true,
                        data_fim_vigencia: true,
                    },
                });

                // Check for date overlaps, excluding active (it will be auto-closed)
                await this.checkDateOverlap(
                    prismaTxn,
                    dto.data_inicio_vigencia,
                    dto.data_fim_vigencia,
                    activeConfig ? [activeConfig.id] : []
                );

                // If exists, shrink or supersede the active config
                if (activeConfig) {
                    const newEndDate = new Date(dto.data_inicio_vigencia);
                    newEndDate.setDate(newEndDate.getDate() - 1);

                    if (newEndDate < activeConfig.data_inicio_vigencia) {
                        // New config fully supersedes the active one — soft delete it
                        await prismaTxn.demandaConfig.update({
                            where: { id: activeConfig.id },
                            data: {
                                ativo: null,
                                removido_por: user.id,
                                removido_em: new Date(Date.now()),
                            },
                        });
                    } else {
                        // Shrink the active config to end right before the new one starts
                        await prismaTxn.demandaConfig.update({
                            where: { id: activeConfig.id },
                            data: {
                                data_fim_vigencia: newEndDate,
                                ativo: null,
                                atualizado_por: user.id,
                                atualizado_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                // Create new config with ativo = true
                const demandaConfig = await prismaTxn.demandaConfig.create({
                    data: {
                        data_inicio_vigencia: dto.data_inicio_vigencia,
                        data_fim_vigencia: dto.data_fim_vigencia,
                        valor_minimo: dto.valor_minimo,
                        valor_maximo: dto.valor_maximo,
                        bloqueio_valor_min: dto.bloqueio_valor_min ?? true,
                        bloqueio_valor_max: dto.bloqueio_valor_max ?? false,
                        alerta_valor_min: dto.alerta_valor_min ?? false,
                        alerta_valor_max: dto.alerta_valor_max ?? true,
                        observacao: dto.observacao,
                        ativo: true,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                // Create anexo records from upload_tokens
                if (dto.upload_tokens && dto.upload_tokens.length > 0) {
                    for (const token of dto.upload_tokens) {
                        const arquivoId = this.uploadService.checkUploadOrDownloadToken(token);
                        await prismaTxn.demandaConfigArquivo.create({
                            data: {
                                demanda_config_id: demandaConfig.id,
                                arquivo_id: arquivoId,
                                criado_por: user.id,
                                criado_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                return demandaConfig;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateDemandaConfigDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Fetch existing record
                const existing = await prismaTxn.demandaConfig.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        data_inicio_vigencia: true,
                        data_fim_vigencia: true,
                        valor_minimo: true,
                        valor_maximo: true,
                    },
                });

                if (!existing) {
                    throw new NotFoundException('Configuração não encontrada');
                }

                // Check if record is at extremes (first or last)
                const isExtreme = await this.isRecordAtExtremes(prismaTxn, id);
                if (!isExtreme) {
                    throw new HttpException(
                        'Apenas o primeiro ou último registro pode ser editado para evitar lacunas',
                        400
                    );
                }

                // Validate dates if provided
                const newStartDate = dto.data_inicio_vigencia ?? existing.data_inicio_vigencia;
                const newEndDate =
                    dto.data_fim_vigencia !== undefined ? dto.data_fim_vigencia : existing.data_fim_vigencia;

                if (newEndDate && newEndDate < newStartDate) {
                    throw new HttpException('data_fim_vigencia deve ser maior ou igual a data_inicio_vigencia', 400);
                }

                // Validate values if provided
                const newValorMinimo = dto.valor_minimo
                    ? parseFloat(dto.valor_minimo)
                    : parseFloat(existing.valor_minimo.toString());
                const newValorMaximo = dto.valor_maximo
                    ? parseFloat(dto.valor_maximo)
                    : parseFloat(existing.valor_maximo.toString());

                if (newValorMaximo < newValorMinimo) {
                    throw new HttpException('valor_maximo deve ser maior ou igual a valor_minimo', 400);
                }

                // Check for date overlaps (excluding current record)
                await this.checkDateOverlap(prismaTxn, newStartDate, newEndDate, [id]);

                // Update record
                const demandaConfig = await prismaTxn.demandaConfig.update({
                    where: { id },
                    data: {
                        data_inicio_vigencia: dto.data_inicio_vigencia,
                        data_fim_vigencia: dto.data_fim_vigencia !== undefined ? dto.data_fim_vigencia : undefined,
                        valor_minimo: dto.valor_minimo,
                        valor_maximo: dto.valor_maximo,
                        bloqueio_valor_min: dto.bloqueio_valor_min,
                        bloqueio_valor_max: dto.bloqueio_valor_max,
                        alerta_valor_min: dto.alerta_valor_min,
                        alerta_valor_max: dto.alerta_valor_max,
                        observacao: dto.observacao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                // Handle upload_tokens if provided
                if (dto.upload_tokens !== undefined) {
                    // Get existing arquivo IDs from upload tokens
                    const newArquivoIds = dto.upload_tokens.map((token) =>
                        this.uploadService.checkUploadOrDownloadToken(token)
                    );

                    // Get current arquivos for this config
                    const currentArquivos = await prismaTxn.demandaConfigArquivo.findMany({
                        where: {
                            demanda_config_id: id,
                            removido_em: null,
                        },
                        select: {
                            id: true,
                            arquivo_id: true,
                        },
                    });

                    const currentArquivoIds = currentArquivos.map((a) => a.arquivo_id);

                    // Soft delete arquivos that are not in the new list
                    const toRemove = currentArquivos.filter((a) => !newArquivoIds.includes(a.arquivo_id));
                    for (const arquivo of toRemove) {
                        await prismaTxn.demandaConfigArquivo.update({
                            where: { id: arquivo.id },
                            data: {
                                removido_por: user.id,
                                removido_em: new Date(Date.now()),
                            },
                        });
                    }

                    // Create new arquivos that don't exist yet
                    const toCreate = newArquivoIds.filter((arquivoId) => !currentArquivoIds.includes(arquivoId));
                    for (const arquivoId of toCreate) {
                        await prismaTxn.demandaConfigArquivo.create({
                            data: {
                                demanda_config_id: id,
                                arquivo_id: arquivoId,
                                criado_por: user.id,
                                criado_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                return demandaConfig;
            }
        );

        return updated;
    }

    async findAll(filters: FilterDemandaConfigDto, user: PessoaFromJwt): Promise<DemandaConfigDto[]> {
        const where: Prisma.DemandaConfigWhereInput = {
            removido_em: null,
        };

        if (filters.apenas_ativo) {
            where.ativo = true;
        }

        const rows = await this.prisma.demandaConfig.findMany({
            where,
            orderBy: {
                data_inicio_vigencia: 'desc',
            },
            select: {
                id: true,
                data_inicio_vigencia: true,
                data_fim_vigencia: true,
                valor_minimo: true,
                valor_maximo: true,
                bloqueio_valor_min: true,
                bloqueio_valor_max: true,
                alerta_valor_min: true,
                alerta_valor_max: true,
                observacao: true,
                ativo: true,
                arquivos: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        arquivo: {
                            select: PrismaArquivoComPreviewSelect,
                        },
                    },
                },
            },
        });

        return rows.map((row) => this.buildDemandaConfigDto(row));
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DemandaConfigDetailDto> {
        const row = await this.prisma.demandaConfig.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                data_inicio_vigencia: true,
                data_fim_vigencia: true,
                valor_minimo: true,
                valor_maximo: true,
                bloqueio_valor_min: true,
                bloqueio_valor_max: true,
                alerta_valor_min: true,
                alerta_valor_max: true,
                observacao: true,
                ativo: true,
                arquivos: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        arquivo: {
                            select: PrismaArquivoComPreviewSelect,
                        },
                    },
                },
            },
        });

        if (!row) {
            throw new NotFoundException('Configuração não encontrada');
        }

        return this.buildDemandaConfigDto(row);
    }

    async getActiveConfig(): Promise<DemandaConfigDto | null> {
        const row = await this.prisma.demandaConfig.findFirst({
            where: {
                ativo: true,
                removido_em: null,
            },
            select: {
                id: true,
                data_inicio_vigencia: true,
                data_fim_vigencia: true,
                valor_minimo: true,
                valor_maximo: true,
                bloqueio_valor_min: true,
                bloqueio_valor_max: true,
                alerta_valor_min: true,
                alerta_valor_max: true,
                observacao: true,
                ativo: true,
                arquivos: {
                    where: {
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        arquivo: {
                            select: PrismaArquivoComPreviewSelect,
                        },
                    },
                },
            },
        });

        if (!row) {
            return null;
        }

        return this.buildDemandaConfigDto(row);
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<void> => {
            const existing = await prismaTxn.demandaConfig.findFirst({
                where: {
                    id,
                    removido_em: null,
                },
                select: {
                    ativo: true,
                },
            });

            if (!existing) {
                throw new NotFoundException('Configuração não encontrada');
            }

            // Check if record is at extremes (first or last)
            const isExtreme = await this.isRecordAtExtremes(prismaTxn, id);
            if (!isExtreme) {
                throw new HttpException(
                    'Apenas o primeiro ou último registro pode ser removido para evitar lacunas',
                    400
                );
            }

            // Soft delete the record
            await prismaTxn.demandaConfig.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            // Soft delete all related anexos
            await prismaTxn.demandaConfigArquivo.updateMany({
                where: {
                    demanda_config_id: id,
                    removido_em: null,
                },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            // If deleting active record, activate the next most recent record
            if (existing.ativo === true) {
                const nextMostRecent = await prismaTxn.demandaConfig.findFirst({
                    where: {
                        id: { not: id },
                        removido_em: null,
                    },
                    orderBy: {
                        data_inicio_vigencia: 'desc',
                    },
                    select: {
                        id: true,
                    },
                });

                if (nextMostRecent) {
                    await prismaTxn.demandaConfig.update({
                        where: { id: nextMostRecent.id },
                        data: {
                            ativo: true,
                            data_fim_vigencia: null,
                            atualizado_por: user.id,
                            atualizado_em: new Date(Date.now()),
                        },
                    });
                }
            }
        });
    }

    async appendAnexo(configId: number, dto: AppendDemandaConfigAnexoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const arquivoId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        // test if config exists
        const config = await this.prisma.demandaConfig.findFirst({
            where: {
                id: configId,
                removido_em: null,
            },
            select: { id: true, ativo: true },
        });

        if (!config) throw new NotFoundException('Configuração não encontrada');
        const isExtreme = await this.isRecordAtExtremes(this.prisma, configId);
        if (!isExtreme) {
            throw new HttpException('Apenas o primeiro ou último registro pode ser editada para evitar lacunas', 400);
        }

        const anexo = await this.prisma.demandaConfigArquivo.create({
            data: {
                demanda_config_id: configId,
                arquivo_id: arquivoId,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return anexo;
    }

    async listAnexos(configId: number, user: PessoaFromJwt): Promise<DemandaConfigAnexoDto[]> {
        const config = await this.prisma.demandaConfig.findFirst({
            where: { id: configId, removido_em: null },
            select: { id: true },
        });

        if (!config) {
            throw new NotFoundException('Configuração não encontrada');
        }

        const anexos = await this.prisma.demandaConfigArquivo.findMany({
            where: {
                demanda_config_id: configId,
                removido_em: null,
            },
            select: {
                id: true,
                arquivo: {
                    select: PrismaArquivoComPreviewSelect,
                },
            },
        });

        return anexos.map((anexo) => ({
            id: anexo.id,
            arquivo: BuildArquivoBaseDto(
                anexo.arquivo,
                (id: number, expiresIn: string) => this.uploadService.getDownloadToken(id, expiresIn).download_token
            ),
        }));
    }

    // Helper methods

    private async checkDateOverlap(
        prismaTxn: Prisma.TransactionClient,
        startDate: Date,
        endDate: Date | null | undefined,
        excludeIds: number[]
    ): Promise<void> {
        if (endDate === undefined) endDate = null;

        // Standard interval overlap: [A,B] overlaps [C,D] iff A <= D AND B >= C
        // Where null = infinity

        const conditions: Prisma.DemandaConfigWhereInput[] = [
            // existing.end >= new.start OR existing.end is null (infinity)
            {
                OR: [{ data_fim_vigencia: { gte: startDate } }, { data_fim_vigencia: null }],
            },
        ];

        // existing.start <= new.end (only when new.end is not null)
        // If new.end is null (infinity), any existing record that passes condition 1 overlaps
        if (endDate !== null) {
            conditions.push({ data_inicio_vigencia: { lte: endDate } });
        }

        const where: Prisma.DemandaConfigWhereInput = {
            removido_em: null,
            AND: conditions,
        };

        if (excludeIds.length > 0) {
            where.id = { notIn: excludeIds };
        }

        const overlappingCount = await prismaTxn.demandaConfig.count({ where });

        if (overlappingCount > 0) {
            throw new HttpException('Período de vigência se sobrepõe a outra configuração existente', 400);
        }
    }

    private async isRecordAtExtremes(prismaTxn: Prisma.TransactionClient, id: number): Promise<boolean> {
        const allRecords = await prismaTxn.demandaConfig.findMany({
            where: {
                removido_em: null,
            },
            orderBy: {
                data_inicio_vigencia: 'asc',
            },
            select: {
                id: true,
            },
        });

        if (allRecords.length === 0) return false;
        if (allRecords.length === 1) return true;

        const firstId = allRecords[0].id;
        const lastId = allRecords[allRecords.length - 1].id;

        return id === firstId || id === lastId;
    }

    private buildDemandaConfigDto(row: any): DemandaConfigDto {
        return {
            id: row.id,
            data_inicio_vigencia: row.data_inicio_vigencia.toISOString().split('T')[0],
            data_fim_vigencia: row.data_fim_vigencia ? row.data_fim_vigencia.toISOString().split('T')[0] : null,
            valor_minimo: row.valor_minimo.toString(),
            valor_maximo: row.valor_maximo.toString(),
            bloqueio_valor_min: row.bloqueio_valor_min,
            bloqueio_valor_max: row.bloqueio_valor_max,
            alerta_valor_min: row.alerta_valor_min,
            alerta_valor_max: row.alerta_valor_max,
            observacao: row.observacao,
            ativo: row.ativo,
            anexos: row.arquivos.map((anexo: any) => ({
                id: anexo.id,
                arquivo: BuildArquivoBaseDto(
                    anexo.arquivo,
                    (id: number, expiresIn: string) => this.uploadService.getDownloadToken(id, expiresIn).download_token
                ),
            })),
        };
    }
}
