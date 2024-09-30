import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoPdm } from '@prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { IdNomeExibicaoDto } from '../common/dto/IdNomeExibicao.dto';
import { DetalhesOrigensMetasItemDto, ResumoOrigensMetasItemDto } from '../common/dto/origem-pdm.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CompromissoOrigemHelper } from '../common/helpers/CompromissoOrigem';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { MetaIniAtvTag } from '../meta/entities/meta.entity';
import { MetaService } from '../meta/meta.service';
import { upsertPSPerfis, validatePSEquipes } from '../meta/ps-perfil.util';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { AtividadeOrgaoParticipante, CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { AtividadeDto, AtividadeOrgao } from './entities/atividade.entity';

@Injectable()
export class AtividadeService {
    private readonly logger = new Logger(AtividadeService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly variavelService: VariavelService
    ) {}

    async create(tipo: TipoPdm, dto: CreateAtividadeDto, user: PessoaFromJwt) {
        const iniciativa = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id: dto.iniciativa_id, removido_em: null },
            select: {
                ativo: true,
                meta_id: true,
                meta: {
                    select: {
                        ativo: true,
                    },
                },
            },
        });
        await this.metaService.assertMetaWriteOrThrow(tipo, iniciativa.meta_id, user, 'atividade');

        if (!iniciativa.ativo) throw new BadRequestException('Iniciativa está desativada, ative-a criar uma Atividade');
        if (!iniciativa.meta.ativo)
            throw new BadRequestException('Meta está desativada, ative-a antes criar uma Atividade');

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const orgaos_participantes = dto.orgaos_participantes;
                const coordenadores_cp = dto.coordenadores_cp;
                const tags = dto.tags;
                const ps_tecnico_cp = dto.ps_tecnico_cp;
                const ps_ponto_focal = dto.ps_ponto_focal;
                const origens_extra = dto.origens_extra;
                delete dto.orgaos_participantes;
                delete dto.coordenadores_cp;
                delete dto.tags;
                delete dto.ps_tecnico_cp;
                delete dto.ps_ponto_focal;
                delete dto.origens_extra;

                let origem_cache: object | undefined = undefined;
                if (Array.isArray(origens_extra)) {
                    origem_cache = await CompromissoOrigemHelper.processaOrigens(origens_extra, this.prisma);
                }

                const codigoJaEmUso = await prismaTx.atividade.count({
                    where: {
                        removido_em: null,
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                        iniciativa_id: dto.iniciativa_id,
                    },
                });
                if (codigoJaEmUso > 0)
                    throw new HttpException('codigo| Já existe atividade com este código nesta iniciativa', 400);

                const tituloJaEmUso = await prismaTx.atividade.count({
                    where: {
                        removido_em: null,
                        titulo: { equals: dto.titulo, mode: 'insensitive' },
                        iniciativa_id: dto.iniciativa_id,
                    },
                });
                if (tituloJaEmUso > 0)
                    throw new HttpException('titulo| Já existe atividade com este título nesta iniciativa', 400);

                if (dto.ativo) {
                    const iniciativaAtivaCount = await prismaTx.iniciativa.count({
                        where: {
                            id: dto.iniciativa_id,
                            ativo: true,
                        },
                    });

                    if (iniciativaAtivaCount === 0)
                        throw new BadRequestException(
                            'Iniciativa está desativada, ative-a antes de criar uma Atividade ativa'
                        );
                }

                const atividade = await prismaTx.atividade.create({
                    data: {
                        origem_cache: origem_cache as any,
                        criado_por: user.id,
                        criado_em: now,
                        iniciativa_id: dto.iniciativa_id,
                        codigo: dto.codigo,
                        titulo: dto.titulo,
                        contexto: dto.contexto,
                        complemento: dto.complemento,
                        compoe_indicador_iniciativa: dto.compoe_indicador_iniciativa,
                        status: '',
                        ativo: dto.ativo,
                    },
                    select: { id: true },
                });

                if (tipo == 'PDM') {
                    if (!orgaos_participantes || orgaos_participantes.length === 0)
                        throw new BadRequestException(
                            'orgaos_participantes| Precisa ter pelo menos um orgão participante'
                        );
                    if (!coordenadores_cp || coordenadores_cp.length === 0)
                        throw new BadRequestException(
                            'coordenadores_cp| Precisa ter pelo menos um coordenador responsável pela atividade'
                        );

                    await prismaTx.atividadeOrgao.createMany({
                        data: await this.buildOrgaosParticipantes(atividade.id, orgaos_participantes),
                    });

                    await prismaTx.atividadeResponsavel.createMany({
                        data: await this.buildAtividadeResponsaveis(
                            atividade.id,
                            orgaos_participantes,
                            coordenadores_cp
                        ),
                    });
                } else {
                    const pdm = await this.prisma.pdm.findFirstOrThrow({
                        where: {
                            Meta: {
                                some: {
                                    removido_em: null,
                                    iniciativa: { some: { removido_em: null, id: dto.iniciativa_id } },
                                },
                            },
                        },
                        select: {
                            id: true,
                            PdmPerfil: {
                                where: { removido_em: null, relacionamento: 'PDM' },
                                select: { equipe: { select: { id: true } }, tipo: true },
                            },
                        },
                    });

                    if (ps_tecnico_cp) {
                        validatePSEquipes(ps_tecnico_cp.equipes, pdm.PdmPerfil, 'CP', pdm.id);
                        await upsertPSPerfis(
                            atividade.id,
                            'atividade',
                            ps_tecnico_cp,
                            'CP',
                            [],
                            user,
                            prismaTx,
                            pdm.id
                        );
                    }

                    if (ps_ponto_focal) {
                        validatePSEquipes(ps_ponto_focal.equipes, pdm.PdmPerfil, 'PONTO_FOCAL', pdm.id);
                        await upsertPSPerfis(
                            atividade.id,
                            'atividade',
                            ps_ponto_focal,
                            'PONTO_FOCAL',
                            [],
                            user,
                            prismaTx,
                            pdm.id
                        );
                    }
                }

                if (Array.isArray(origens_extra)) {
                    await CompromissoOrigemHelper.upsert(atividade.id, 'atividade', origens_extra, prismaTx, user, now);
                }

                if (Array.isArray(tags))
                    await prismaTx.atividadeTag.createMany({
                        data: await this.buildAtividadeTags(atividade.id, tags),
                    });

                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.atividade_id = atividade.id;
                geoDto.tokens = dto.geolocalizacao;
                geoDto.tipo = 'Endereco';

                await this.metaService.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);

                return atividade;
            }
        );

        return created;
    }

    async buildAtividadeTags(atividadeId: number, tags?: number[]): Promise<Prisma.AtividadeTagCreateManyInput[]> {
        if (Array.isArray(tags) === false) return [];

        const arr: Prisma.AtividadeTagCreateManyInput[] = [];

        for (const tag of tags) {
            arr.push({
                atividade_id: atividadeId,
                tag_id: tag,
            });
        }

        return arr;
    }

    async buildOrgaosParticipantes(
        atividadeId: number,
        orgaos_participantes: MetaOrgaoParticipante[] | undefined
    ): Promise<Prisma.AtividadeOrgaoCreateManyInput[]> {
        if (Array.isArray(orgaos_participantes) === false) return [];
        const arr: Prisma.AtividadeOrgaoCreateManyInput[] = [];

        const orgaoVisto: Record<number, boolean> = {};
        // ordena por responsáveis primeiro
        orgaos_participantes.sort((a, b) => {
            return a.responsavel && !b.responsavel ? -1 : a.responsavel && !b.responsavel ? 0 : 1;
        });

        for (const orgao of orgaos_participantes) {
            if (!orgaoVisto[orgao.orgao_id]) {
                orgaoVisto[orgao.orgao_id] = true;

                arr.push({
                    orgao_id: orgao.orgao_id,
                    responsavel: orgao.responsavel,
                    atividade_id: atividadeId,
                });
            }
        }

        return arr;
    }
    async buildAtividadeResponsaveis(
        atividadeId: number,
        orgaos_participantes: AtividadeOrgaoParticipante[] | undefined,
        coordenadores_cp: number[] | undefined
    ): Promise<Prisma.AtividadeResponsavelCreateManyInput[]> {
        if (Array.isArray(orgaos_participantes) === false) return [];
        if (Array.isArray(coordenadores_cp) === false) return [];

        const arr: Prisma.AtividadeResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participanteId of orgao.participantes) {
                arr.push({
                    atividade_id: atividadeId,
                    pessoa_id: participanteId,
                    orgao_id: orgao.orgao_id,
                    coordenador_responsavel_cp: false,
                });
            }
        }

        for (const CoordenadoriaParticipanteId of coordenadores_cp) {
            const pessoaFisicaOrgao = await this.prisma.pessoa.findFirst({
                where: {
                    id: CoordenadoriaParticipanteId,
                },
                select: {
                    pessoa_fisica: { select: { orgao_id: true } },
                },
            });

            const orgaoId = pessoaFisicaOrgao?.pessoa_fisica?.orgao_id;
            if (orgaoId) {
                arr.push({
                    atividade_id: atividadeId,
                    pessoa_id: CoordenadoriaParticipanteId,
                    orgao_id: orgaoId,
                    coordenador_responsavel_cp: true,
                });
            }
        }

        return arr;
    }

    async findAll(tipo: TipoPdm, filters: FilterAtividadeDto | undefined = undefined, user: PessoaFromJwt) {
        const iniciativa_id = filters?.iniciativa_id;

        const metaFilterSet = await this.metaService.getMetaFilterSet(tipo, user);

        const listActive = await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                iniciativa_id: iniciativa_id,
                iniciativa: { meta: { AND: metaFilterSet } },
            },
            orderBy: [{ codigo: 'asc' }],
            select: {
                id: true,
                titulo: true,
                codigo: true,
                contexto: true,
                complemento: true,
                iniciativa_id: true,
                status: true,
                compoe_indicador_iniciativa: true,
                ativo: true,
                atividade_orgao: {
                    select: {
                        orgao: { select: { id: true, descricao: true, sigla: true } },
                        responsavel: true,
                    },
                },
                atividade_responsavel: {
                    select: {
                        orgao: { select: { id: true, descricao: true } },
                        pessoa: { select: { id: true, nome_exibicao: true } },
                        coordenador_responsavel_cp: true,
                    },
                },
                Cronograma: {
                    take: 1,
                    select: {
                        id: true,
                    },
                },
                atividade_tag: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                descricao: true,
                                arquivo_icone_id: true,
                            },
                        },
                    },
                },
                PdmPerfil: {
                    where: { removido_em: null },
                    select: {
                        equipe_id: true,
                        tipo: true,
                    },
                },
                origem_cache: true,
            },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.iniciativa_id = listActive.map((r) => r.id);
        const geolocalizacao = await this.metaService.geolocService.carregaReferencias(geoDto);

        const tags: MetaIniAtvTag[] = [];
        const ret: AtividadeDto[] = [];
        for (const dbAtividade of listActive) {
            const coordenadores_cp: IdNomeExibicaoDto[] = [];
            const orgaos: Record<number, AtividadeOrgao> = {};

            for (const orgao of dbAtividade.atividade_orgao) {
                orgaos[orgao.orgao.id] = {
                    orgao: orgao.orgao,
                    responsavel: orgao.responsavel,
                    participantes: [],
                };
            }

            for (const responsavel of dbAtividade.atividade_responsavel) {
                if (responsavel.coordenador_responsavel_cp) {
                    coordenadores_cp.push({
                        id: responsavel.pessoa.id,
                        nome_exibicao: responsavel.pessoa.nome_exibicao,
                    });
                } else {
                    const orgao = orgaos[responsavel.orgao.id];
                    orgao.participantes.push(responsavel.pessoa);
                }
            }

            let cronogramaAtraso: CronogramaAtrasoGrau | null = null;
            if (dbAtividade.Cronograma && dbAtividade.Cronograma.length > 0) {
                const cronogramaId = dbAtividade.Cronograma[0].id;

                const cronogramaEtapaRet = await this.metaService.cronogramaEtapaService.findAll(
                    tipo,
                    { cronograma_id: cronogramaId },
                    user,
                    true // já ta validado que tem acesso se chegou aqui
                );
                cronogramaAtraso = {
                    id: cronogramaId,
                    atraso_grau: await this.metaService.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet),
                };
            }

            for (const metaTag of dbAtividade.atividade_tag) {
                tags.push({
                    id: metaTag.tag.id,
                    descricao: metaTag.tag.descricao,
                    download_token: this.metaService.uploadService.getPersistentDownloadToken(
                        metaTag.tag.arquivo_icone_id
                    ),
                });
            }

            let origens_extra: DetalhesOrigensMetasItemDto | ResumoOrigensMetasItemDto =
                dbAtividade.origem_cache?.valueOf() as ResumoOrigensMetasItemDto;

            if (filters?.id)
                origens_extra = await CompromissoOrigemHelper.buscaOrigensComDetalhes(
                    'atividade',
                    dbAtividade.id,
                    this.prisma
                );

            ret.push({
                origens_extra: origens_extra,
                tags,
                id: dbAtividade.id,
                titulo: dbAtividade.titulo,
                codigo: dbAtividade.codigo,
                contexto: dbAtividade.contexto,
                complemento: dbAtividade.complemento,
                iniciativa_id: dbAtividade.iniciativa_id,
                status: dbAtividade.status,
                coordenadores_cp: coordenadores_cp,
                orgaos_participantes: Object.values(orgaos),
                compoe_indicador_iniciativa: dbAtividade.compoe_indicador_iniciativa,
                ativo: dbAtividade.ativo,
                cronograma: cronogramaAtraso,
                geolocalizacao: geolocalizacao.get(dbAtividade.id) || [],
                ps_tecnico_cp: {
                    equipes: dbAtividade.PdmPerfil.filter((r) => r.tipo == 'CP').map((r) => r.equipe_id),
                },
                ps_ponto_focal: {
                    equipes: dbAtividade.PdmPerfil.filter((r) => r.tipo == 'PONTO_FOCAL').map((r) => r.equipe_id),
                },
            });
        }

        return ret;
    }

    async update(tipo: TipoPdm, id: number, dto: UpdateAtividadeDto, user: PessoaFromJwt) {
        const self = await this.prisma.atividade.findFirstOrThrow({
            where: {
                id,
                iniciativa: { meta: { pdm: { tipo } } },
                removido_em: null,
            },
            select: { iniciativa_id: true, iniciativa: { select: { meta_id: true } } },
        });

        await this.metaService.assertMetaWriteOrThrow(tipo, self.iniciativa.meta_id, user, 'atividade');

        const atividade = await this.prisma.atividade.findFirstOrThrow({
            where: { id: id, removido_em: null },
            select: {
                iniciativa: {
                    select: {
                        ativo: true,
                        meta: {
                            select: {
                                ativo: true,
                            },
                        },
                    },
                },
            },
        });

        if (!atividade.iniciativa.ativo)
            throw new BadRequestException('Iniciativa está desativada, ative-a editar a Atividade');
        if (!atividade.iniciativa.meta.ativo)
            throw new BadRequestException('Meta está desativada, ative-a antes editar a Atividade');

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const op = dto.orgaos_participantes;
            const cp = dto.coordenadores_cp;
            const ps_tecnico_cp = dto.ps_tecnico_cp;
            const ps_ponto_focal = dto.ps_ponto_focal;
            const tags = dto.tags;
            const origens_extra = dto.origens_extra;
            delete dto.orgaos_participantes;
            delete dto.coordenadores_cp;
            delete dto.ps_tecnico_cp;
            delete dto.ps_ponto_focal;
            delete dto.origens_extra;

            if (tipo === 'PDM' && cp && !op)
                throw new HttpException('é necessário enviar orgaos_participantes para alterar coordenadores_cp', 400);

            if (dto.codigo) {
                const codigoJaEmUso = await prismaTx.atividade.count({
                    where: {
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                        id: { not: id },
                        removido_em: null,
                        iniciativa_id: self.iniciativa_id,
                    },
                });
                if (codigoJaEmUso)
                    throw new HttpException('codigo| Já existe outra atividade com este código nesta iniciativa', 400);
            }

            if (dto.titulo) {
                const tituloJaEmUso = await prismaTx.atividade.count({
                    where: {
                        id: { not: id },
                        removido_em: null,
                        titulo: { equals: dto.titulo, mode: 'insensitive' },
                        iniciativa_id: self.iniciativa_id,
                    },
                });
                if (tituloJaEmUso > 0)
                    throw new HttpException('titulo| Já existe outra atividade com este título nesta iniciativa', 400);
            }

            let origem_cache: object | undefined = undefined;
            if (Array.isArray(origens_extra)) {
                origem_cache = await CompromissoOrigemHelper.processaOrigens(origens_extra, this.prisma);
            }

            const atividade = await prismaTx.atividade.update({
                where: { id: id },
                data: {
                    origem_cache: origem_cache as any,
                    atualizado_por: user.id,
                    atualizado_em: now,
                    status: '',
                    ativo: dto.ativo,
                    codigo: dto.codigo,
                    titulo: dto.titulo,
                    contexto: dto.contexto,
                    complemento: dto.complemento,
                    compoe_indicador_iniciativa: dto.compoe_indicador_iniciativa,
                },
                select: { id: true },
            });
            if (Array.isArray(origens_extra)) {
                await CompromissoOrigemHelper.upsert(atividade.id, 'atividade', origens_extra, prismaTx, user, now);
            }
            if (Array.isArray(tags)) {
                await prismaTx.atividadeTag.deleteMany({ where: { atividade_id: id } });
                await prismaTx.atividadeTag.createMany({
                    data: await this.buildAtividadeTags(atividade.id, tags),
                });
            }

            if (tipo == 'PDM') {
                if (!op || op.length === 0)
                    throw new BadRequestException('orgaos_participantes| Precisa ter pelo menos um orgão participante');
                if (!cp || cp.length === 0)
                    throw new BadRequestException(
                        'coordenadores_cp| Precisa ter pelo menos um coordenador responsável pela atividade'
                    );

                await prismaTx.atividadeOrgao.deleteMany({ where: { atividade_id: id } });
                await prismaTx.atividadeResponsavel.deleteMany({ where: { atividade_id: id } });

                await prismaTx.atividadeOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(atividade.id, op),
                });
                await prismaTx.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, op, cp),
                });
            } else {
                const pdm = await prismaTx.pdm.findFirstOrThrow({
                    where: {
                        Meta: {
                            some: {
                                removido_em: null,
                                iniciativa: {
                                    some: { removido_em: null, atividade: { some: { removido_em: null, id } } },
                                },
                            },
                        },
                    },
                    select: {
                        id: true,
                        PdmPerfil: {
                            where: { removido_em: null, relacionamento: 'PDM' },
                            select: { equipe: { select: { id: true } }, tipo: true },
                        },
                    },
                });

                const currentPdmPerfis = await prismaTx.pdmPerfil.findMany({
                    where: {
                        atividade_id: id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        tipo: true,
                        equipe_id: true,
                    },
                });

                if (ps_tecnico_cp) {
                    validatePSEquipes(ps_tecnico_cp.equipes, pdm.PdmPerfil, 'CP', pdm.id);
                    await upsertPSPerfis(
                        id,
                        'atividade',
                        ps_tecnico_cp,
                        'CP',
                        currentPdmPerfis,
                        user,
                        prismaTx,
                        pdm.id
                    );
                }

                if (ps_ponto_focal) {
                    validatePSEquipes(ps_ponto_focal.equipes, pdm.PdmPerfil, 'PONTO_FOCAL', pdm.id);
                    await upsertPSPerfis(
                        id,
                        'atividade',
                        ps_ponto_focal,
                        'PONTO_FOCAL',
                        currentPdmPerfis,
                        user,
                        prismaTx,
                        pdm.id
                    );
                }
            }

            const indicador = await prismaTx.indicador.findFirst({
                where: {
                    removido_em: null,
                    atividade_id: atividade.id,
                },
                select: {
                    id: true,
                    IndicadorVariavel: {
                        where: { desativado: false },
                        select: { variavel_id: true },
                    },
                },
            });

            if (!indicador) {
                this.logger.log('não há indicador para a atividade');
            } else {
                for (const variavel of indicador.IndicadorVariavel) {
                    const info = await this.variavelService.buscaIndicadorParaVariavel(indicador.id);
                    await this.variavelService.resyncIndicadorVariavel(info, variavel.variavel_id, prismaTx);
                }
            }

            if (dto.geolocalizacao) {
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.atividade_id = atividade.id;
                geoDto.tokens = dto.geolocalizacao;
                geoDto.tipo = 'Endereco';

                await this.metaService.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
            }

            return atividade;
        });

        return { id };
    }

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.atividade.findFirstOrThrow({
            where: { id, iniciativa: { meta: { pdm: { tipo } } }, removido_em: null },
            select: {
                iniciativa_id: true,
                iniciativa: {
                    select: {
                        ativo: true,
                        meta_id: true,
                        meta: {
                            select: {
                                ativo: true,
                            },
                        },
                    },
                },
                compoe_indicador_iniciativa: true,
                Indicador: {
                    select: {
                        IndicadorVariavel: {
                            where: { desativado: false },
                            select: { id: true },
                        },
                    },
                },
            },
        });

        await this.metaService.assertMetaWriteOrThrow(tipo, self.iniciativa.meta_id, user, 'atividade');

        if (!self.iniciativa.ativo)
            throw new BadRequestException('Iniciativa está desativada, ative-a antes de remover a Atividade');
        if (!self.iniciativa.meta.ativo)
            throw new BadRequestException('Meta está desativada, ative-a antes de remover a Atividade');

        // Antes de remover a Atividade, deve ser verificada a Iniciativa para garantir de que não há variaveis em uso
        if (self.compoe_indicador_iniciativa) {
            let has_vars_in_use = false;

            for (const indicador of self.Indicador) {
                if (indicador.IndicadorVariavel.length > 0) has_vars_in_use = true;

                if (has_vars_in_use == true)
                    throw new HttpException(
                        'Atividade possui variáveis em uso pela Iniciativa e Meta, desative o campo de "Compõe indicador da Iniciativa" para remover a Atividade',
                        400
                    );
            }
        }

        const now = new Date(Date.now());
        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<Prisma.BatchPayload> => {
                const removed = await prismaTx.atividade.updateMany({
                    where: { id: id },
                    data: {
                        removido_por: user.id,
                        removido_em: now,
                    },
                });

                // Caso a Atividade seja removida, é necessário remover relacionamentos com PainelConteudoDetalhe
                // public.painel_conteudo_detalhe
                await prismaTx.painelConteudoDetalhe.deleteMany({ where: { atividade_id: id } });

                return removed;
            }
        );
    }
}
