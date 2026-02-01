import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DemandaStatus, Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { Date2YMD } from 'src/common/date2ymd';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateGeoEnderecoReferenciaDto, FindGeoEnderecoReferenciaDto } from 'src/geo-loc/entities/geo-loc.entity';
import { GeoLocService } from 'src/geo-loc/geo-loc.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuildArquivoBaseDto, PrismaArquivoComPreviewSelect } from 'src/upload/arquivo-preview.helper';
import { UploadService } from 'src/upload/upload.service';
import { CreateDemandaDto } from './dto/create-demanda.dto';
import { FilterDemandaDto } from './dto/filter-demanda.dto';
import { CancelarDemandaDto, DevolverDemandaDto } from './dto/status-transition.dto';
import { UpdateDemandaDto } from './dto/update-demanda.dto';
import {
    DemandaDetailDto,
    DemandaHistoricoDto,
    DemandaPermissoesDto,
    ListDemandaDto
} from './entities/demanda.entity';

export const DemandaGetPermissionSet = async (
    user: PessoaFromJwt | undefined
): Promise<Array<Prisma.DemandaWhereInput>> => {
    const permissionsBaseSet: Prisma.Enumerable<Prisma.DemandaWhereInput> = [
        {
            removido_em: null,
        },
    ];
    if (!user) return permissionsBaseSet;

    // SERI (validadores) pode ver tudo
    if (user.hasSomeRoles(['CadastroDemanda.validar'])) {
        Logger.debug('roles CadastroDemanda.validar, ver todas as demandas');
        return permissionsBaseSet;
    }

    // Gestor Municipal só pode ver demandas do seu orgao
    Logger.verbose(`Adicionar ver demandas do orgao ${user.orgao_id} (Gestor Municipal)`);
    return [
        ...permissionsBaseSet,
        {
            orgao_id: user.orgao_id,
        },
    ];
};

@Injectable()
export class DemandaService {
    private readonly logger = new Logger(DemandaService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly geolocService: GeoLocService
    ) {}

    async create(dto: CreateDemandaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Validate orgao access
                await this.validateOrgaoAccess(prismaTxn, dto.orgao_id, user);

                // Validate valor against DemandaConfig
                await this.validateValor(prismaTxn, dto.valor);

                // Validate area_tematica exists
                await this.validateAreaTematica(prismaTxn, dto.area_tematica_id);

                // Validate acoes exist and belong to area
                await this.validateAcoes(prismaTxn, dto.acao_ids, dto.area_tematica_id);

                // Validate arquivos (max 3 with autoriza_divulgacao=true)
                if (dto.arquivos) {
                    await this.validateArquivos(dto.arquivos);
                }

                // Create Demanda
                const demanda = await prismaTxn.demanda.create({
                    data: {
                        orgao_id: dto.orgao_id,
                        unidade_responsavel: dto.unidade_responsavel,
                        nome_responsavel: dto.nome_responsavel,
                        cargo_responsavel: dto.cargo_responsavel,
                        email_responsavel: dto.email_responsavel,
                        telefone_responsavel: dto.telefone_responsavel,
                        nome_projeto: dto.nome_projeto,
                        descricao: dto.descricao,
                        justificativa: dto.justificativa,
                        valor: dto.valor,
                        finalidade: dto.finalidade,
                        observacao: dto.observacao,
                        area_tematica_id: dto.area_tematica_id,
                        status: DemandaStatus.Registro,
                        data_status_atual: new Date(),
                        data_registro: new Date(),
                        criado_por: user.id,
                        criado_em: new Date(),
                    },
                });

                // Create DemandaAcao junction records
                for (const acaoId of dto.acao_ids) {
                    await prismaTxn.demandaAcao.create({
                        data: {
                            demanda_id: demanda.id,
                            acao_id: acaoId,
                            criado_por: user.id,
                        },
                    });
                }

                // Create geolocalizacao references via GeoLocService
                const geoTokens = dto.localizacoes
                    ?.filter((l) => l.geolocalizacao_token)
                    .map((l) => l.geolocalizacao_token!);
                if (geoTokens && geoTokens.length > 0) {
                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.tokens = geoTokens;
                    geoDto.tipo = 'Endereco';
                    geoDto.demanda_id = demanda.id;

                    await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTxn, new Date());
                }

                // Create DemandaArquivo records
                if (dto.arquivos) {
                    for (const arq of dto.arquivos) {
                        const arquivoId = this.uploadService.checkUploadOrDownloadToken(arq.upload_token);

                        await prismaTxn.demandaArquivo.create({
                            data: {
                                demanda_id: demanda.id,
                                arquivo_id: arquivoId,
                                autoriza_divulgacao: arq.autoriza_divulgacao,
                                descricao: arq.descricao,
                                criado_por: user.id,
                            },
                        });
                    }
                }

                // Create initial historico entry
                await prismaTxn.demandaHistorico.create({
                    data: {
                        demanda_id: demanda.id,
                        status_anterior: null,
                        status_novo: DemandaStatus.Registro,
                        motivo: null,
                        criado_por: user.id,
                    },
                });

                return { id: demanda.id };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                maxWait: 15000,
                timeout: 30000,
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateDemandaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Find existing demanda
                const existing = await prismaTxn.demanda.findUnique({
                    where: { id, removido_em: null },
                    include: {
                        acoes: { where: { removido_em: null } },
                        arquivos: { where: { removido_em: null } },
                    },
                });

                if (!existing) {
                    throw new NotFoundException('Demanda não encontrada');
                }

                // Validate permissions based on status
                await this.validateUpdatePermission(existing, user);

                // Check if update requires versioning (Validacao or Publicado status)
                const requiresSnapshot =
                    existing.status === DemandaStatus.Validacao || existing.status === DemandaStatus.Publicado;

                // Validate updates if provided
                if (dto.orgao_id) {
                    await this.validateOrgaoAccess(prismaTxn, dto.orgao_id, user);
                }
                if (dto.valor) {
                    await this.validateValor(prismaTxn, dto.valor);
                }
                if (dto.area_tematica_id) {
                    await this.validateAreaTematica(prismaTxn, dto.area_tematica_id);
                }
                if (dto.acao_ids) {
                    await this.validateAcoes(
                        prismaTxn,
                        dto.acao_ids,
                        dto.area_tematica_id || existing.area_tematica_id
                    );
                }
                if (dto.arquivos) {
                    await this.validateArquivos(dto.arquivos);
                }

                // Create snapshot if needed
                if (requiresSnapshot) {
                    await this.createSnapshot(prismaTxn, existing, user);
                }

                // Update main Demanda record
                const updateData: Prisma.DemandaUpdateInput = {
                    atualizador: user.id ? { connect: { id: user.id } } : undefined,
                    atualizado_em: new Date(),
                };

                if (dto.orgao_id !== undefined) updateData.orgao = { connect: { id: dto.orgao_id } };
                if (dto.unidade_responsavel !== undefined) updateData.unidade_responsavel = dto.unidade_responsavel;
                if (dto.nome_responsavel !== undefined) updateData.nome_responsavel = dto.nome_responsavel;
                if (dto.cargo_responsavel !== undefined) updateData.cargo_responsavel = dto.cargo_responsavel;
                if (dto.email_responsavel !== undefined) updateData.email_responsavel = dto.email_responsavel;
                if (dto.telefone_responsavel !== undefined) updateData.telefone_responsavel = dto.telefone_responsavel;
                if (dto.nome_projeto !== undefined) updateData.nome_projeto = dto.nome_projeto;
                if (dto.descricao !== undefined) updateData.descricao = dto.descricao;
                if (dto.justificativa !== undefined) updateData.justificativa = dto.justificativa;
                if (dto.valor !== undefined) updateData.valor = dto.valor;
                if (dto.finalidade !== undefined) updateData.finalidade = dto.finalidade;
                if (dto.observacao !== undefined) updateData.observacao = dto.observacao;
                if (dto.area_tematica_id !== undefined)
                    updateData.area_tematica = { connect: { id: dto.area_tematica_id } };

                // If versioning, increment version and change status to Validacao
                if (requiresSnapshot) {
                    updateData.versao = { increment: 1 };
                    updateData.status = DemandaStatus.Validacao;
                    updateData.data_status_atual = new Date();
                    updateData.data_validacao = new Date();

                    // Calculate days in previous status
                    const days = this.calculateDaysInStatus(existing.data_status_atual);
                    if (existing.status === DemandaStatus.Validacao) {
                        updateData.dias_em_validacao = { increment: days };
                    } else if (existing.status === DemandaStatus.Publicado) {
                        updateData.dias_em_publicado = { increment: days };
                    }
                }

                await prismaTxn.demanda.update({
                    where: { id },
                    data: updateData,
                });

                // Update nested entities (acao_ids)
                if (dto.acao_ids) {
                    // Soft delete all existing
                    await prismaTxn.demandaAcao.updateMany({
                        where: { demanda_id: id, removido_em: null },
                        data: { removido_por: user.id, removido_em: new Date() },
                    });

                    // Create new
                    for (const acaoId of dto.acao_ids) {
                        await prismaTxn.demandaAcao.create({
                            data: {
                                demanda_id: id,
                                acao_id: acaoId,
                                criado_por: user.id,
                            },
                        });
                    }
                }

                // Update nested entities (localizacoes) - via GeoLocService
                if (dto.localizacoes) {
                    const geoTokens = dto.localizacoes
                        .filter((l) => l.geolocalizacao_token)
                        .map((l) => l.geolocalizacao_token!);

                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.tokens = geoTokens.length > 0 ? geoTokens : undefined;
                    geoDto.tipo = 'Endereco';
                    geoDto.demanda_id = id;

                    await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTxn, new Date());
                }

                // Update nested entities (arquivos) - upsert logic
                if (dto.arquivos) {
                    const existingIds = existing.arquivos.map((a) => a.id);
                    const dtoIds = dto.arquivos.filter((a) => a.id).map((a) => a.id!);

                    // Soft delete removed
                    const toDelete = existingIds.filter((id) => !dtoIds.includes(id));
                    for (const arqId of toDelete) {
                        await prismaTxn.demandaArquivo.update({
                            where: { id: arqId },
                            data: { removido_por: user.id, removido_em: new Date() },
                        });
                    }

                    // Update or create
                    for (const arq of dto.arquivos) {
                        if (arq.id && existingIds.includes(arq.id)) {
                            // Update
                            await prismaTxn.demandaArquivo.update({
                                where: { id: arq.id },
                                data: {
                                    autoriza_divulgacao: arq.autoriza_divulgacao,
                                    descricao: arq.descricao,
                                    atualizado_por: user.id,
                                    atualizado_em: new Date(),
                                },
                            });
                        } else {
                            // Create
                            const arquivoId = this.uploadService.checkUploadOrDownloadToken(arq.upload_token);

                            await prismaTxn.demandaArquivo.create({
                                data: {
                                    demanda_id: id,
                                    arquivo_id: arquivoId,
                                    autoriza_divulgacao: arq.autoriza_divulgacao,
                                    descricao: arq.descricao,
                                    criado_por: user.id,
                                },
                            });
                        }
                    }
                }

                // Create historico entry if status changed
                if (requiresSnapshot) {
                    await prismaTxn.demandaHistorico.create({
                        data: {
                            demanda_id: id,
                            status_anterior: existing.status,
                            status_novo: DemandaStatus.Validacao,
                            motivo: 'Demanda atualizada - voltou para Validação',
                            criado_por: user.id,
                        },
                    });
                }

                return { id };
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                maxWait: 15000,
                timeout: 30000,
            }
        );

        return updated;
    }

    async findAll(filters: FilterDemandaDto, user: PessoaFromJwt): Promise<ListDemandaDto> {
        // Build permission set
        const permissionsSet = await DemandaGetPermissionSet(user);

        // Build where clause based on filters
        const where: Prisma.DemandaWhereInput = {
            removido_em: null,
        };

        // Apply permission filters
        if (permissionsSet.length > 0) {
            where.AND = permissionsSet;
        }

        // Apply additional filters
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.area_tematica_id) {
            where.area_tematica_id = filters.area_tematica_id;
        }
        if (filters.orgao_id) {
            // Validate if user can access this orgao filter
            if (!user.hasSomeRoles(['CadastroDemanda.validar']) && filters.orgao_id !== user.orgao_id) {
                throw new HttpException('Usuário não possui permissão para ver demandas de outro órgão', 403);
            }
            where.orgao_id = filters.orgao_id;
        }

        const demandas = await this.prisma.demanda.findMany({
            where,
            orderBy: [{ orgao: { sigla: 'asc' } }, { status: 'asc' }, { nome_projeto: 'asc' }],
            select: {
                id: true,
                versao: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                unidade_responsavel: true,
                nome_responsavel: true,
                cargo_responsavel: true,
                email_responsavel: true,
                telefone_responsavel: true,
                nome_projeto: true,
                descricao: true,
                justificativa: true,
                valor: true,
                finalidade: true,
                observacao: true,
                area_tematica: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
                status: true,
                data_status_atual: true,
                criado_em: true,
            },
        });

        return {
            linhas: await Promise.all(
                demandas.map(async (d) => {
                    const permissoes = this.buildPermissions(d.status, user, d.orgao.id);
                    return {
                        id: d.id,
                        versao: d.versao,
                        orgao: {
                            id: d.orgao.id,
                            nome_exibicao: `${d.orgao.sigla} - ${d.orgao.descricao}`,
                        },
                        unidade_responsavel: d.unidade_responsavel,
                        nome_responsavel: d.nome_responsavel,
                        cargo_responsavel: d.cargo_responsavel,
                        email_responsavel: d.email_responsavel,
                        telefone_responsavel: d.telefone_responsavel,
                        nome_projeto: d.nome_projeto,
                        descricao: d.descricao,
                        justificativa: d.justificativa,
                        valor: d.valor.toString(),
                        finalidade: d.finalidade,
                        observacao: d.observacao,
                        area_tematica: d.area_tematica,
                        status: d.status,
                        data_status_atual: Date2YMD.toString(d.data_status_atual),
                        criado_em: Date2YMD.toString(d.criado_em),
                        permissoes,
                    };
                })
            ),
        };
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DemandaDetailDto> {
        const demanda = await this.prisma.demanda.findUnique({
            where: { id, removido_em: null },
            select: {
                id: true,
                versao: true,
                orgao: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                unidade_responsavel: true,
                nome_responsavel: true,
                cargo_responsavel: true,
                email_responsavel: true,
                telefone_responsavel: true,
                nome_projeto: true,
                descricao: true,
                justificativa: true,
                valor: true,
                finalidade: true,
                observacao: true,
                area_tematica: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
                status: true,
                data_status_atual: true,
                criado_em: true,
                dias_em_registro: true,
                dias_em_validacao: true,
                dias_em_publicado: true,
                dias_em_encerrado: true,
                acoes: {
                    where: { removido_em: null },
                    select: {
                        acao: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },
                    },
                },
                arquivos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        autoriza_divulgacao: true,
                        descricao: true,
                        arquivo: { select: PrismaArquivoComPreviewSelect },
                    },
                    orderBy: [{ autoriza_divulgacao: 'desc' }, { descricao: 'asc' }],
                },
            },
        });

        if (!demanda) {
            throw new NotFoundException('Demanda não encontrada');
        }

        // Check permissions via permission set
        const permissionsSet = await DemandaGetPermissionSet(user);
        const canAccess = await this.prisma.demanda.count({
            where: {
                id,
                AND: permissionsSet,
            },
        });

        if (!canAccess) {
            throw new HttpException('Usuário não possui acesso a esta demanda', 403);
        }

        // Load geolocalizacao via GeoLocService
        const geoDto = new FindGeoEnderecoReferenciaDto();
        geoDto.demanda_id = id;
        const geoReferencias = await this.geolocService.carregaReferencias(geoDto);
        const geolocalizacao = geoReferencias.get(id) || [];

        const permissoes = this.buildPermissions(demanda.status, user, demanda.orgao.id);

        return {
            id: demanda.id,
            versao: demanda.versao,
            orgao: {
                id: demanda.orgao.id,
                nome_exibicao: `${demanda.orgao.sigla} - ${demanda.orgao.descricao}`,
            },
            unidade_responsavel: demanda.unidade_responsavel,
            nome_responsavel: demanda.nome_responsavel,
            cargo_responsavel: demanda.cargo_responsavel,
            email_responsavel: demanda.email_responsavel,
            telefone_responsavel: demanda.telefone_responsavel,
            nome_projeto: demanda.nome_projeto,
            descricao: demanda.descricao,
            justificativa: demanda.justificativa,
            valor: demanda.valor.toString(),
            finalidade: demanda.finalidade,
            observacao: demanda.observacao,
            area_tematica: demanda.area_tematica,
            status: demanda.status,
            data_status_atual: Date2YMD.toString(demanda.data_status_atual),
            criado_em: Date2YMD.toString(demanda.criado_em),
            dias_em_registro: demanda.dias_em_registro,
            dias_em_validacao: demanda.dias_em_validacao,
            dias_em_publicado: demanda.dias_em_publicado,
            dias_em_encerrado: demanda.dias_em_encerrado,
            acoes: demanda.acoes.map((a) => a.acao),
            geolocalizacao,
            arquivos: demanda.arquivos.map((a) => ({
                id: a.id,
                autoriza_divulgacao: a.autoriza_divulgacao,
                descricao: a.descricao,
                arquivo: BuildArquivoBaseDto(
                    a.arquivo,
                    (id, expiresIn) => this.uploadService.getDownloadToken(id, expiresIn).download_token
                ),
            })),
            permissoes,
        };
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<void> => {
            const demanda = await prismaTxn.demanda.findUnique({
                where: { id, removido_em: null },
            });

            if (!demanda) {
                throw new NotFoundException('Demanda não encontrada');
            }

            // Check permissions
            const permissoes = this.buildPermissions(demanda.status, user, demanda.orgao_id);
            if (!permissoes.pode_remover) {
                throw new HttpException('Usuário não possui permissão para remover esta demanda', 403);
            }

            // Soft delete main record
            await prismaTxn.demanda.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(),
                },
            });

            // Cascade soft delete
            await prismaTxn.demandaAcao.updateMany({
                where: { demanda_id: id, removido_em: null },
                data: { removido_por: user.id, removido_em: new Date() },
            });

            await prismaTxn.geoLocalizacaoReferencia.updateMany({
                where: { demanda_id: id, removido_em: null },
                data: { removido_por: user.id, removido_em: new Date() },
            });

            await prismaTxn.demandaArquivo.updateMany({
                where: { demanda_id: id, removido_em: null },
                data: { removido_por: user.id, removido_em: new Date() },
            });
        });
    }

    // Status transitions
    async enviar(id: number, user: PessoaFromJwt): Promise<RecordWithId> {
        return this.changeStatus(id, user, DemandaStatus.Registro, DemandaStatus.Validacao, null);
    }

    async validar(id: number, user: PessoaFromJwt): Promise<RecordWithId> {
        // Check permission
        if (!user.hasSomeRoles(['CadastroDemanda.validar'])) {
            throw new HttpException('Usuário não possui permissão para validar demandas', 403);
        }

        return this.changeStatus(id, user, DemandaStatus.Validacao, DemandaStatus.Publicado, null);
    }

    async devolver(id: number, dto: DevolverDemandaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        // Check permission
        if (!user.hasSomeRoles(['CadastroDemanda.validar'])) {
            throw new HttpException('Usuário não possui permissão para devolver demandas', 403);
        }

        const demanda = await this.prisma.demanda.findUnique({ where: { id, removido_em: null } });
        if (!demanda) {
            throw new NotFoundException('Demanda não encontrada');
        }

        if (demanda.status !== DemandaStatus.Validacao && demanda.status !== DemandaStatus.Publicado) {
            throw new BadRequestException('Só é possível devolver demandas em Validação ou Publicado');
        }

        return this.changeStatus(id, user, demanda.status, DemandaStatus.Registro, dto.motivo);
    }

    async cancelar(id: number, dto: CancelarDemandaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const demanda = await this.prisma.demanda.findUnique({ where: { id, removido_em: null } });
        if (!demanda) {
            throw new NotFoundException('Demanda não encontrada');
        }

        if (demanda.status === DemandaStatus.Encerrado) {
            throw new BadRequestException('Demanda já está encerrada');
        }

        // Check permission: SERI or owning Gestor Municipal
        const canCancel = user.hasSomeRoles(['CadastroDemanda.validar']) || demanda.orgao_id === user.orgao_id;

        if (!canCancel) {
            throw new HttpException('Usuário não possui permissão para cancelar esta demanda', 403);
        }

        return this.changeStatus(id, user, demanda.status, DemandaStatus.Encerrado, dto.motivo);
    }

    // Historico
    async getHistorico(id: number, user: PessoaFromJwt): Promise<DemandaHistoricoDto[]> {
        const demanda = await this.prisma.demanda.findUnique({ where: { id, removido_em: null } });
        if (!demanda) {
            throw new NotFoundException('Demanda não encontrada');
        }

        // Check permissions via permission set
        const permissionsSet = await DemandaGetPermissionSet(user);
        const canAccess = await this.prisma.demanda.count({
            where: {
                id,
                AND: permissionsSet,
            },
        });

        if (!canAccess) {
            throw new HttpException('Usuário não possui acesso a esta demanda', 403);
        }

        const historico = await this.prisma.demandaHistorico.findMany({
            where: { demanda_id: id },
            orderBy: { criado_em: 'desc' },
            select: {
                id: true,
                status_anterior: true,
                status_novo: true,
                motivo: true,
                criado_em: true,
                criador: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },
            },
        });

        return historico.map((h) => ({
            id: h.id,
            status_anterior: h.status_anterior,
            status_novo: h.status_novo,
            motivo: h.motivo,
            criado_por: h.criador,
            criado_em: Date2YMD.toString(h.criado_em),
        }));
    }

    /**
     * Build permissions based on workflow state and user role
     */
    private buildPermissions(status: DemandaStatus, user: PessoaFromJwt, demandaOrgaoId: number): DemandaPermissoesDto {
        const isSeri = user.hasSomeRoles(['CadastroDemanda.validar']);
        const isOwnerOrgao = demandaOrgaoId === user.orgao_id;

        // Default: no permissions
        const permissoes: DemandaPermissoesDto = {
            pode_editar: false,
            pode_enviar: false,
            pode_validar: false,
            pode_devolver: false,
            pode_cancelar: false,
            pode_remover: false,
        };

        // LUCAS: conferir se essa lógica está correta pra todas as situaçẽos com a Josi
        switch (status) {
            case DemandaStatus.Registro:
                // dono pode editar, enviar, remover
                if (isOwnerOrgao) {
                    permissoes.pode_editar = true;
                    permissoes.pode_enviar = true;
                    permissoes.pode_remover = true;
                }
                // SERI pode cancelar, remover
                if (isSeri) {
                    permissoes.pode_cancelar = true;
                    permissoes.pode_remover = true;
                }
                break;

            case DemandaStatus.Validacao:
                // SERI pode validar, devolver, cancelar
                if (isSeri) {
                    permissoes.pode_validar = true;
                    permissoes.pode_devolver = true;
                    permissoes.pode_cancelar = true;
                }
                break;

            case DemandaStatus.Publicado:
                // SERI pode editar, devolver, cancelar
                if (isSeri) {
                    permissoes.pode_editar = true;
                    permissoes.pode_devolver = true;
                    permissoes.pode_cancelar = true;
                }
                break;

            case DemandaStatus.Encerrado:
                // principalmente aqui, provavelmente a SERI pode voltar?
                break;
        }

        return permissoes;
    }

    private async validateUpdatePermission(
        demanda: { id: number; status: DemandaStatus; orgao_id: number },
        user: PessoaFromJwt
    ): Promise<void> {
        const permissoes = this.buildPermissions(demanda.status, user, demanda.orgao_id);

        if (!permissoes.pode_editar) {
            throw new HttpException('Usuário não possui permissão para editar esta demanda', 403);
        }
    }

    private async changeStatus(
        id: number,
        user: PessoaFromJwt,
        fromStatus: DemandaStatus,
        toStatus: DemandaStatus,
        motivo: string | null
    ): Promise<RecordWithId> {
        return this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
            const demanda = await prismaTxn.demanda.findUnique({ where: { id, removido_em: null } });
            if (!demanda) {
                throw new NotFoundException('Demanda não encontrada');
            }

            if (demanda.status !== fromStatus) {
                throw new BadRequestException(`Demanda não está no status esperado: ${fromStatus}`);
            }

            // Calculate days in current status
            const days = this.calculateDaysInStatus(demanda.data_status_atual);

            // Build update data
            const updateData: Prisma.DemandaUpdateInput = {
                status: toStatus,
                data_status_atual: new Date(),
                atualizador: { connect: { id: user.id } },
                atualizado_em: new Date(),
            };

            // Increment days counter for previous status
            if (fromStatus === DemandaStatus.Registro) {
                updateData.dias_em_registro = { increment: days };
            } else if (fromStatus === DemandaStatus.Validacao) {
                updateData.dias_em_validacao = { increment: days };
            } else if (fromStatus === DemandaStatus.Publicado) {
                updateData.dias_em_publicado = { increment: days };
            }

            // Set timestamp for new status if first time
            if (toStatus === DemandaStatus.Validacao && !demanda.data_validacao) {
                updateData.data_validacao = new Date();
            } else if (toStatus === DemandaStatus.Publicado && !demanda.data_publicado) {
                updateData.data_publicado = new Date();
            } else if (toStatus === DemandaStatus.Encerrado && !demanda.data_encerrado) {
                updateData.data_encerrado = new Date();
            }

            await prismaTxn.demanda.update({ where: { id }, data: updateData });

            // Create historico entry
            await prismaTxn.demandaHistorico.create({
                data: {
                    demanda_id: id,
                    status_anterior: fromStatus,
                    status_novo: toStatus,
                    motivo,
                    criado_por: user.id,
                },
            });

            return { id };
        });
    }

    private calculateDaysInStatus(dataStatusAtual: Date): number {
        const now = new Date();
        const diff = now.getTime() - dataStatusAtual.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    private async createSnapshot(
        prismaTxn: Prisma.TransactionClient,
        demanda: any,
        user: PessoaFromJwt
    ): Promise<void> {
        // Create snapshot with current data
        const dadosOriginais = {
            orgao_id: demanda.orgao_id,
            unidade_responsavel: demanda.unidade_responsavel,
            nome_responsavel: demanda.nome_responsavel,
            cargo_responsavel: demanda.cargo_responsavel,
            email_responsavel: demanda.email_responsavel,
            telefone_responsavel: demanda.telefone_responsavel,
            nome_projeto: demanda.nome_projeto,
            descricao: demanda.descricao,
            justificativa: demanda.justificativa,
            valor: demanda.valor.toString(),
            finalidade: demanda.finalidade,
            observacao: demanda.observacao,
            area_tematica_id: demanda.area_tematica_id,
            status: demanda.status,
        };

        await prismaTxn.demandaSnapshot.create({
            data: {
                demanda_id: demanda.id,
                versao: demanda.versao,
                dados_originais: dadosOriginais,
                criado_por: user.id,
            },
        });
    }

    private async validateOrgaoAccess(
        prisma: Prisma.TransactionClient | PrismaService,
        orgaoId: number,
        user: PessoaFromJwt
    ): Promise<void> {
        // If user has validar permission, they can access any orgao
        if (user.hasSomeRoles(['CadastroDemanda.validar'])) {
            return;
        }

        // Otherwise, user can only access their own orgao
        if (orgaoId !== user.orgao_id) {
            throw new HttpException('Usuário não possui acesso a este órgão', 403);
        }
    }

    private async validateValor(prisma: Prisma.TransactionClient, valor: string): Promise<void> {
        const config = await prisma.demandaConfig.findFirst({
            where: {
                ativo: true,
                removido_em: null,
            },
        });

        if (!config) {
            return; // No active config, skip validation
        }

        const valorNum = parseFloat(valor);

        if (config.bloqueio_valor_min && valorNum < parseFloat(config.valor_minimo.toString())) {
            throw new BadRequestException(
                `Valor não pode ser menor que o mínimo configurado: R$ ${config.valor_minimo}`
            );
        }

        if (config.bloqueio_valor_max && valorNum > parseFloat(config.valor_maximo.toString())) {
            throw new BadRequestException(
                `Valor não pode ser maior que o máximo configurado: R$ ${config.valor_maximo}`
            );
        }
    }

    private async validateAreaTematica(prisma: Prisma.TransactionClient, areaTematicaId: number): Promise<void> {
        const area = await prisma.areaTematica.findUnique({
            where: { id: areaTematicaId, removido_em: null },
        });

        if (!area) {
            throw new NotFoundException('Área Temática não encontrada');
        }

        if (!area.ativo) {
            throw new BadRequestException('Área Temática não está ativa');
        }
    }

    private async validateAcoes(
        prisma: Prisma.TransactionClient,
        acaoIds: number[],
        areaTematicaId: number
    ): Promise<void> {
        const acoes = await prisma.acao.findMany({
            where: {
                id: { in: acaoIds },
                removido_em: null,
            },
        });

        if (acoes.length !== acaoIds.length) {
            throw new NotFoundException('Uma ou mais ações não foram encontradas');
        }

        for (const acao of acoes) {
            if (!acao.ativo) {
                throw new BadRequestException(`Ação ${acao.nome} não está ativa`);
            }

            if (acao.area_tematica_id !== areaTematicaId) {
                throw new BadRequestException(`Ação ${acao.nome} não pertence à área temática selecionada`);
            }
        }
    }

    private async validateArquivos(arquivos: any[]): Promise<void> {
        const autorizados = arquivos.filter((a) => a.autoriza_divulgacao);
        if (autorizados.length > 3) {
            throw new BadRequestException('Máximo de 3 arquivos com autorização de divulgação permitidos');
        }
    }
}
