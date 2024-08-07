import { HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Prisma, TipoPdm } from '@prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UploadService } from 'src/upload/upload.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { MIN_DB_SAFE_INT32 } from '../common/dto/consts';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { GeoLocService } from '../geo-loc/geo-loc.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateMetaDto,
    DadosCodTituloIniciativaDto,
    DadosCodTituloMetaDto,
    MetaOrgaoParticipante,
} from './dto/create-meta.dto';
import { FilterMetaDto, FilterRelacionadosDTO } from './dto/filter-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import {
    IdNomeExibicao,
    IdObrasDto,
    IdProjetoDto,
    MetaIniAtvTag,
    MetaItemDto,
    MetaOrgao,
    MetaPdmDto,
    RelacionadosDTO,
} from './entities/meta.entity';
import { IdDescRegiaoComParent } from '../pp/projeto/entities/projeto.entity';

type DadosMetaIniciativaAtividadesDto = {
    tipo: string;
    meta_id: number;
    iniciativa_id: number | null;
    atividade_id: number | null;
    codigo: string;
    titulo: string;
};

@Injectable()
export class MetaService {
    private readonly logger = new Logger(MetaService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => CronogramaEtapaService))
        public readonly cronogramaEtapaService: CronogramaEtapaService,
        public readonly uploadService: UploadService,
        public readonly geolocService: GeoLocService
    ) {}

    async create(tipo: TipoPdm, dto: CreateMetaDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP
        // e se os *tema_id são do mesmo PDM
        // se existe pelo menos 1 responsável=true no op
        const now = new Date(Date.now());
        const geolocalizacao = dto.geolocalizacao;
        delete dto.geolocalizacao;

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const op = dto.orgaos_participantes!;
                const cp = dto.coordenadores_cp!;
                delete dto.orgaos_participantes;
                delete dto.coordenadores_cp;

                const tags = dto.tags!;
                delete dto.tags;

                // Verificação de código da Meta.
                const codigoJaEmUso = await prismaTx.meta.count({
                    where: {
                        removido_em: null,
                        pdm_id: dto.pdm_id,
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                    },
                });
                if (codigoJaEmUso > 0) throw new HttpException('codigo| Já existe meta com este código', 400);

                const tituloJaEmUso = await prismaTx.meta.count({
                    where: {
                        removido_em: null,
                        pdm_id: dto.pdm_id,
                        titulo: { equals: dto.titulo, mode: 'insensitive' },
                    },
                });
                if (tituloJaEmUso > 0) throw new HttpException('titulo| Já existe meta com este título', 400);

                const meta = await prismaTx.meta.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        status: '',
                        ativo: true,
                        ...dto,
                    },
                    select: { id: true },
                });

                await prismaTx.metaOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(meta.id, op),
                });

                await prismaTx.metaResponsavel.createMany({
                    data: await this.buildMetaResponsaveis(meta.id, op, cp),
                });

                if (Array.isArray(tags) && tags.length)
                    await prismaTx.metaTag.createMany({
                        data: await this.buildTags(meta.id, tags),
                    });

                // reagenda o PDM para recalcular as fases (e status)
                await prismaTx.cicloFisico.updateMany({
                    where: {
                        ativo: true,
                    },
                    data: {
                        acordar_ciclo_em: now,
                        acordar_ciclo_executou_em: null,
                    },
                });

                if (geolocalizacao) {
                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.meta_id = meta.id;
                    geoDto.tokens = geolocalizacao;
                    geoDto.tipo = 'Endereco';

                    await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
                }

                return meta;
            },
            {
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return created;
    }

    async buildTags(metaId: number, tags: number[] | undefined): Promise<Prisma.MetaTagCreateManyInput[]> {
        if (typeof tags === 'undefined') tags = [];
        const arr: Prisma.MetaTagCreateManyInput[] = [];

        for (const tag of tags) {
            arr.push({
                meta_id: metaId,
                tag_id: tag,
            });
        }

        return arr;
    }

    async buildMetaResponsaveis(
        metaId: number,
        orgaos_participantes: MetaOrgaoParticipante[],
        coordenadores_cp: number[]
    ): Promise<Prisma.MetaResponsavelCreateManyInput[]> {
        const arr: Prisma.MetaResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participanteId of orgao.participantes) {
                arr.push({
                    meta_id: metaId,
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
                    meta_id: metaId,
                    pessoa_id: CoordenadoriaParticipanteId,
                    orgao_id: orgaoId,
                    coordenador_responsavel_cp: true,
                });
            }
        }

        return arr;
    }

    async buildOrgaosParticipantes(
        metaId: number,
        orgaos_participantes: MetaOrgaoParticipante[]
    ): Promise<Prisma.MetaOrgaoCreateManyInput[]> {
        const arr: Prisma.MetaOrgaoCreateManyInput[] = [];

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
                    meta_id: metaId,
                });
            }
        }

        return arr;
    }

    private async getMetasPermissionSet(tipo: TipoPdm, user: PessoaFromJwt | undefined, isBi: boolean) {
        console.trace(`meta-service: getMetasPermissionSet ${tipo} ${isBi}`);
        const permissionsSet: Prisma.Enumerable<Prisma.MetaWhereInput> = [
            {
                removido_em: null,
                pdm: { tipo },
            },
        ];
        if (!user) return permissionsSet;
        if (isBi && user.hasSomeRoles(['SMAE.acesso_bi'])) return permissionsSet;

        const orgaoId = user.orgao_id;
        if (!orgaoId) throw new HttpException('Usuário sem órgão', 400);

        // TODO filtrar painéis que o usuário pode visualizar, caso não tenha nenhuma das permissões
        // 'CadastroMeta.inserir'
        // atualmente nesse serviço não tem nada de painel, então acho que precisa rever esse TODO
        // pra outro lugar (o frontend da um get em /painel sem informar qual meta
        // lá no front que está fazendo o filtro pra descobrir os painel que tme a meta e
        // depois o busca a serie do painel-conteúdo correspondente

        if (tipo == 'PDM') {
            if (user.hasSomeRoles(['CadastroMeta.administrador_no_pdm_admin_cp'])) {
                this.logger.verbose(
                    'Usuário tem CadastroMeta.administrador_no_pdm_admin_cp, liberando todas metas do PDM.'
                );
                return permissionsSet;
            }
            const orSet: Prisma.Enumerable<Prisma.MetaWhereInput> = [];

            if (user.hasSomeRoles(['PDM.ponto_focal'])) {
                this.logger.verbose('Usuário tem PDM.ponto_focal, liberando metas onde é responsável');
                orSet.push({
                    ViewMetaPessoaResponsavel: {
                        some: {
                            pessoa_id: user.id,
                        },
                    },
                });
            }

            if (user.hasSomeRoles(['PDM.tecnico_cp'])) {
                this.logger.verbose('Usuário tem PDM.tecnico_cp, liberando metas onde é responsável na CP');
                orSet.push({
                    ViewMetaPessoaResponsavelNaCp: {
                        some: {
                            pessoa_id: user.id,
                        },
                    },
                });
            }

            if (orSet.length == 0) {
                this.logger.verbose('Usuário não tem permissão para nenhuma meta');
                orSet.push({ id: MIN_DB_SAFE_INT32 });
            }

            permissionsSet.push({ OR: orSet });
        } else {
            if (user.hasSomeRoles(['CadastroPS.administrador'])) {
                this.logger.verbose('Usuário tem CadastroPS.administrador, liberando toda as metas de todos os PDMs.');
                return permissionsSet;
            }

            const orSet: Prisma.Enumerable<Prisma.MetaWhereInput> = [];

            if (user.hasSomeRoles(['CadastroPS.administrador_no_orgao'])) {
                this.logger.verbose(
                    `Usuário tem CadastroPS.administrador_no_orgao, liberando todas as metas do órgão ${orgaoId} + responsavel=true e ps.orgao_admin_id=${orgaoId}.`
                );
                orSet.push({
                    pdm: {
                        orgao_admin_id: orgaoId,
                    },
                });
            }

            if (user.hasSomeRoles(['PS.admin_cp'])) {
                this.logger.verbose(`Usuário tem PS.admin_cp, filtrando PS onde é admin_cp`);
                orSet.push({
                    pdm: {
                        PdmPerfil: {
                            some: {
                                pessoa_id: user.id,
                                removido_em: null,
                                tipo: 'ADMIN',
                            },
                        },
                    },
                });
            }

            if (user.hasSomeRoles(['PS.tecnico_cp'])) {
                this.logger.verbose(`Usuário tem PS.tecnico_cp, filtrando PS onde é tecnico_cp`);
                orSet.push({
                    pdm: {
                        PdmPerfil: {
                            some: {
                                pessoa_id: user.id,
                                removido_em: null,
                                tipo: 'CP',
                            },
                        },
                    },
                    ViewMetaPessoaResponsavelNaCp: {
                        some: {
                            pessoa_id: user.id,
                        },
                    },
                    // TODO ? filtrar as metas tbm, como se fosse o caso do PDM
                });
            }

            if (user.hasSomeRoles(['PS.ponto_focal'])) {
                this.logger.verbose(`Usuário tem PS.ponto_focal, filtrando PS onde é ponto_focal`);
                orSet.push({
                    pdm: {
                        PdmPerfil: {
                            some: {
                                pessoa_id: user.id,
                                removido_em: null,
                                tipo: 'PONTO_FOCAL',
                            },
                        },
                    },
                    ViewMetaPessoaResponsavel: {
                        some: {
                            pessoa_id: user.id,
                        },
                    },
                    // TODO ? filtrar as metas tbm, como se fosse o caso do PDM
                });
            }

            if (orSet.length == 0) {
                this.logger.verbose('Usuário não tem permissão para nenhuma meta');
                orSet.push({ id: MIN_DB_SAFE_INT32 });
            }

            permissionsSet.push({ OR: orSet });
        }

        return permissionsSet;
    }

    async findAllIds(
        tipo: TipoPdm,
        user: PessoaFromJwt | undefined,
        pdm_id: number | undefined = undefined
    ): Promise<{ id: number }[]> {
        const permissionsSet = await this.getMetasPermissionSet(tipo, user, true);

        return await this.prisma.meta.findMany({
            where: {
                pdm_id,
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
            },
            select: { id: true },
        });
    }

    async getMetaFilterSet(tipo: TipoPdm, user: PessoaFromJwt) {
        return await this.getMetasPermissionSet(tipo, user, false);
    }

    async assertMetaWriteOrThrow(
        tipo: TipoPdm,
        meta_id: number,
        user: PessoaFromJwt,
        context?: string,
        readonly: 'readonly' | 'readwrite' = 'readwrite'
    ): Promise<void> {
        console.trace(`meta-service: assertMetaWriteOrThrow ${meta_id} ${context} ${readonly}`);

        const meta = await this.findAll(tipo, { id: meta_id }, user, true);
        if (!meta || meta.length == 0) {
            throw new HttpException(
                context ? `Meta não pode ser encontrada para ${context}` : 'Meta não encontrada',
                400
            );
        }

        if (readonly == 'readwrite' && !meta[0].pode_editar)
            throw new HttpException(
                `Usuário não tem permissão para editar ${context ? `${context} da meta` : 'meta'}`,
                400
            );

        return;
    }

    async findAll(
        tipo: TipoPdm,
        filters: FilterMetaDto | undefined = undefined,
        user: PessoaFromJwt,
        skipObjects: boolean = false
    ): Promise<MetaItemDto[]> {
        const permissionsSet = await this.getMetasPermissionSet(tipo, user, false);

        const listActive = await this.prisma.meta.findMany({
            where: {
                AND:
                    permissionsSet.length > 0
                        ? [
                              {
                                  AND: permissionsSet,
                              },
                          ]
                        : undefined,
                pdm_id: filters?.pdm_id,
                pdm: { tipo, id: filters?.pdm_id },
                id: filters?.id,
            },
            orderBy: [{ codigo: 'asc' }],
            select: {
                id: true,
                titulo: true,
                contexto: true,
                codigo: true,
                complemento: true,
                macro_tema: { select: { descricao: true, id: true } },
                tema: { select: { descricao: true, id: true } },
                sub_tema: { select: { descricao: true, id: true } },
                pdm_id: true,
                status: true,
                ativo: true,
                meta_orgao: {
                    select: {
                        orgao: { select: { id: true, descricao: true, sigla: true } },
                        responsavel: true,
                    },
                },
                meta_responsavel: {
                    select: {
                        orgao: { select: { id: true, descricao: true } },
                        pessoa: { select: { id: true, nome_exibicao: true } },
                        coordenador_responsavel_cp: true,
                    },
                },
                meta_tag: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                descricao: true,
                                arquivo_icone_id: true,
                            },
                        },
                    },
                    orderBy: {
                        tag: { descricao: 'asc' },
                    },
                },
                cronograma:
                    filters?.id !== undefined
                        ? {
                              where: {
                                  removido_em: null,
                              },
                              take: 1,
                              orderBy: { criado_em: 'asc' },
                              select: {
                                  id: true,
                                  inicio_previsto: true,
                                  inicio_real: true,
                                  termino_previsto: true,
                                  termino_real: true,
                              },
                          }
                        : undefined,
            },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.meta_id = listActive.map((r) => r.id);
        const geolocalizacao = skipObjects ? [] : await this.geolocService.carregaReferencias(geoDto);

        const ret: MetaItemDto[] = [];
        for (const dbMeta of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, MetaOrgao> = {};
            const tags: MetaIniAtvTag[] = [];
            let metaCronograma: CronogramaAtrasoGrau | null = null;

            // usando skipObjects para não carregar os objetos,
            // pois quando a chamada for apenas para verificar a permissão de acesso essas informações
            // não são necessárias
            if (!skipObjects) {
                for (const orgao of dbMeta.meta_orgao) {
                    orgaos[orgao.orgao.id] = {
                        orgao: orgao.orgao,
                        responsavel: orgao.responsavel,
                        participantes: [],
                    };
                }

                for (const responsavel of dbMeta.meta_responsavel) {
                    if (responsavel.coordenador_responsavel_cp) {
                        // só coloca a pessoa 1x
                        if (coordenadores_cp.filter((r) => r.id == responsavel.pessoa.id).length == 0)
                            coordenadores_cp.push({
                                id: responsavel.pessoa.id,
                                nome_exibicao: responsavel.pessoa.nome_exibicao,
                            });
                    } else {
                        const orgao = orgaos[responsavel.orgao.id];
                        if (!orgao) {
                            this.logger.error(
                                `Faltando órgão ${responsavel.orgao.id} na meta ID ${dbMeta.id} - ${dbMeta.titulo}, participante ${responsavel.pessoa.id} não pode ser mais responsável`
                            );
                            continue;
                        }

                        if (orgao.participantes.filter((r) => r.id == responsavel.pessoa.id).length == 0)
                            orgao.participantes.push(responsavel.pessoa);
                    }
                }

                for (const metaTag of dbMeta.meta_tag) {
                    tags.push({
                        id: metaTag.tag.id,
                        descricao: metaTag.tag.descricao,
                        download_token: this.uploadService.getPersistentDownloadToken(metaTag.tag.arquivo_icone_id),
                    });
                }

                // TODO: revisar isso aqui pra virar uma trigger, fazer um findAll no cronograma durante
                // a listagem de metas é muito custoso, por isso foi desligado, mas mesmo em findById é custoso
                // pois a parte de cronograma é muito grande, cheia de join's
                if (dbMeta.cronograma && filters?.id !== undefined) {
                    const cronograma = dbMeta.cronograma[0];

                    let cronogramaAtraso: string | null = null;
                    if (cronograma) {
                        const cronogramaEtapaRet = await this.cronogramaEtapaService.findAll(
                            tipo,
                            {
                                cronograma_id: cronograma.id,
                            },
                            user,
                            true
                        );
                        cronogramaAtraso = await this.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet);
                    }
                    metaCronograma = {
                        id: cronograma ? cronograma.id : null,
                        atraso_grau: cronogramaAtraso,
                    };
                }
            }

            ret.push({
                id: dbMeta.id,
                titulo: dbMeta.titulo,
                contexto: dbMeta.contexto,
                codigo: dbMeta.codigo,
                complemento: dbMeta.complemento,
                macro_tema: dbMeta.macro_tema,
                tema: dbMeta.tema,
                sub_tema: dbMeta.sub_tema,
                pdm_id: dbMeta.pdm_id,
                status: dbMeta.status,
                ativo: dbMeta.ativo,
                coordenadores_cp: coordenadores_cp,
                orgaos_participantes: Object.values(orgaos),
                tags: tags,
                cronograma: metaCronograma,
                geolocalizacao: 'get' in geolocalizacao ? geolocalizacao.get(dbMeta.id) || [] : [],
                pode_editar: false, // TODO
            });
        }

        return ret;
    }

    async update(tipo: TipoPdm, id: number, updateMetaDto: UpdateMetaDto, user: PessoaFromJwt) {
        //        if (!user.hasSomeRoles([tipo ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
        //            // TODO: ver comentário no método remove
        //            await user.assertHasMetaRespAccessNaCp(id, this.prisma);
        //        }

        const loadMeta = await this.loadMetaOrThrow(id, tipo, user);

        const op = updateMetaDto.orgaos_participantes;
        const cp = updateMetaDto.coordenadores_cp;
        const tags = updateMetaDto.tags;
        const geolocalizacao = updateMetaDto.geolocalizacao;
        delete updateMetaDto.orgaos_participantes;
        delete updateMetaDto.coordenadores_cp;
        delete updateMetaDto.tags;
        delete updateMetaDto.geolocalizacao;
        const now = new Date(Date.now());
        if (cp && !op)
            throw new HttpException('é necessário enviar orgaos_participantes para alterar coordenadores_cp', 400);

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Verificação de código da Meta.
                if (updateMetaDto.codigo) {
                    const codigoJaEmUso = await prismaTx.meta.count({
                        where: {
                            removido_em: null,
                            pdm_id: loadMeta.pdm_id,
                            codigo: updateMetaDto.codigo,
                            id: { not: id },
                        },
                    });
                    if (codigoJaEmUso) throw new HttpException('codigo| Já existe outra meta com este código', 400);
                }

                if (updateMetaDto.titulo) {
                    const tituloJaEmUso = await prismaTx.meta.count({
                        where: {
                            removido_em: null,
                            pdm_id: loadMeta.pdm_id,
                            titulo: { equals: updateMetaDto.titulo, mode: 'insensitive' },
                            id: { not: id },
                        },
                    });
                    if (tituloJaEmUso > 0) throw new HttpException('titulo| Já existe outra meta com este título', 400);
                }

                const meta = await prismaTx.meta.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        status: '',
                        ativo: true,
                        ...updateMetaDto,
                    },
                    select: { id: true },
                });

                if (op) {
                    // Caso os orgaos_participantes estejam atrelados a Iniciativa ou Atividade
                    // Não podem ser excluídos
                    await this.checkHasOrgaosParticipantesChildren(meta.id, op);

                    await prismaTx.metaOrgao.deleteMany({ where: { meta_id: id } });
                    await prismaTx.metaOrgao.createMany({
                        data: await this.buildOrgaosParticipantes(meta.id, op),
                    });

                    if (cp) {
                        // await this.checkHasResponsaveisChildren(meta.id, cp);

                        await prismaTx.metaResponsavel.deleteMany({
                            where: {
                                meta_id: id,
                            },
                        });
                        await prismaTx.metaResponsavel.createMany({
                            data: await this.buildMetaResponsaveis(meta.id, op, cp),
                        });
                    }
                }

                if (tags == null || tags) {
                    await prismaTx.metaTag.deleteMany({ where: { meta_id: id } });
                    if (Array.isArray(tags) && tags.length)
                        await prismaTx.metaTag.createMany({ data: await this.buildTags(meta.id, tags) });
                }
                if (geolocalizacao) {
                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.meta_id = meta.id;
                    geoDto.tokens = geolocalizacao;
                    geoDto.tipo = 'Endereco';

                    await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
                }

                return meta;
            },
            {
                maxWait: 5000,
                timeout: 100000,
            }
        );

        return { id };
    }

    private async loadMetaOrThrow(id: number, tipo: TipoPdm, user: PessoaFromJwt) {
        const perms = await this.getMetaFilterSet(tipo, user);
        const r = await this.prisma.meta.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                AND: perms,
            },
            select: { pdm_id: true, id: true },
        });
        if (r.pdm_id == null) throw new HttpException('Meta não encontrada', 400);
        return r;
    }

    private async checkHasOrgaosParticipantesChildren(meta_id: number, orgaos_participantes: MetaOrgaoParticipante[]) {
        const orgaos_to_be_created = orgaos_participantes.map((x) => x.orgao_id);

        const currentOrgaos = await this.prisma.metaOrgao.findMany({
            where: { meta_id },
            select: {
                orgao_id: true,
            },
        });

        const deletedOrgaos = currentOrgaos
            .map((o) => o.orgao_id)
            .filter((x) => orgaos_to_be_created.indexOf(x) === -1);

        for (const orgao_id of deletedOrgaos) {
            const atividadeOrgaoCount = await this.prisma.atividadeOrgao.count({
                where: {
                    orgao_id: orgao_id,
                    atividade: {
                        iniciativa: {
                            meta_id: meta_id,
                        },
                    },
                },
            });
            if (atividadeOrgaoCount > 0)
                throw new HttpException(
                    'Existe órgão em uso em Atividade, remova-o primeiro no nível de Atividade.',
                    400
                );

            const iniciativaOrgaoCount = await this.prisma.iniciativaOrgao.count({
                where: {
                    orgao_id: orgao_id,
                    iniciativa: {
                        meta_id: meta_id,
                    },
                },
            });
            if (iniciativaOrgaoCount > 0)
                throw new HttpException(
                    'Existe órgão em uso em Iniciativa, remova-o primeiro no nível de Iniciativa.',
                    400
                );
        }
    }

    private async checkHasResponsaveisChildren(meta_id: number, coordenadores_cp: number[]) {
        const currentCoordenadores = await this.prisma.metaResponsavel.findMany({
            where: { meta_id },
            select: {
                pessoa_id: true,
            },
        });
        const deletedPessoas = currentCoordenadores
            .map((c) => c.pessoa_id)
            .filter((x) => coordenadores_cp.indexOf(x) === -1);

        for (const resp of deletedPessoas) {
            const atividadePessoaCount = await this.prisma.atividadeResponsavel.count({
                where: {
                    pessoa_id: resp,
                    atividade: {
                        iniciativa: {
                            meta_id: meta_id,
                        },
                    },
                },
            });
            if (atividadePessoaCount > 0)
                throw new HttpException(
                    'Coordenador em uso em Atividade, remova-o primeiro no nível de Atividade.',
                    400
                );

            const iniciativaPessoaCount = await this.prisma.iniciativaResponsavel.count({
                where: {
                    pessoa_id: resp,
                    iniciativa: {
                        meta_id: meta_id,
                    },
                },
            });
            if (iniciativaPessoaCount > 0)
                throw new HttpException(
                    'Coordenador em uso em Iniciativa, remova-o primeiro no nível de Iniciativa.',
                    400
                );
        }
    }

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        // if (!user.hasSomeRoles([tipo == 'PDM' ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
        //  // logo, só pode editar se for responsável
        //   // TODO: no Plano Setorial, isso aqui provavelmente ta erradíssimo ou faltando algo
        //    await user.assertHasMetaRespAccessNaCp(id, this.prisma);
        // }

        const meta = await this.loadMetaOrThrow(id, tipo, user);

        const now = new Date(Date.now());
        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<Prisma.BatchPayload> => {
                const removed = await prismaTx.meta.updateMany({
                    where: { id: meta.id, removido_em: null },
                    data: {
                        removido_por: user.id,
                        removido_em: now,
                    },
                });

                // Caso a Meta seja removida, é necessário remover relacionamentos com Painel
                // public.painel_conteudo e public.painel_conteudo_detalhe
                await prismaTx.painelConteudo.deleteMany({ where: { meta_id: id } });

                return removed;
            }
        );
    }

    async buscaMetasIniciativaAtividades(tipo: TipoPdm, metas: number[]): Promise<DadosCodTituloMetaDto[]> {
        const list: DadosCodTituloMetaDto[] = [];

        for (const meta_id of metas) {
            const rows: DadosMetaIniciativaAtividadesDto[] = await this.prisma.$queryRaw`
            (
                select 'meta' as tipo, m.id as meta_id, null::int as iniciativa_id, null::int as atividade_id, m.codigo, m.titulo
                from meta m
                join pdm p on p.id = m.pdm_id and p.removido_em is null and p.tipo = ${tipo}::"TipoPdm"
                where m.id = ${meta_id}
                and m.removido_em is null
                order by m.codigo
            )
            union all
            (
                select 'iniciativa' as tipo, m.id as meta_id, i.id , null, i.codigo, i.titulo
                from meta m
                join pdm p on p.id = m.pdm_id and p.removido_em is null and p.tipo = ${tipo}::"TipoPdm"
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                where m.id = ${meta_id}
                and m.removido_em is null
                order by i.codigo
            )
            union all
            (
                select 'atividade' as tipo, m.id as meta_id, i.id as iniciativa_id, a.id as atividade_id, a.codigo, a.titulo
                from meta m
                join pdm p on p.id = m.pdm_id and p.removido_em is null and p.tipo = ${tipo}::"TipoPdm"
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                join atividade a on a.iniciativa_id = i.id and a.removido_em is null
                where m.id = ${meta_id}
                and m.removido_em is null
                order by a.codigo
            )
            `;

            if (rows.length == 0) throw new HttpException(`Meta ${meta_id} não encontrada`, 404);

            const meta: DadosCodTituloMetaDto = {
                id: rows[0].meta_id,
                codigo: rows[0].codigo,
                titulo: rows[0].titulo,
                iniciativas: [],
            };
            for (const r of rows) {
                if (r.tipo == 'iniciativa') {
                    const iniciativa: DadosCodTituloIniciativaDto = {
                        id: r.iniciativa_id!,
                        codigo: r.codigo,
                        titulo: r.titulo,
                        atividades: [],
                    };

                    for (const r2 of rows) {
                        if (r2.tipo === 'atividade' && r2.iniciativa_id == r.iniciativa_id) {
                            iniciativa.atividades.push({
                                id: r2.atividade_id!,
                                codigo: r2.codigo,
                                titulo: r2.titulo,
                            });
                        }
                    }
                    meta.iniciativas.push(iniciativa);
                }
            }

            list.push(meta);
        }

        return list;
    }

    async buscaRelacionados(tipo: TipoPdm, dto: FilterRelacionadosDTO, user: PessoaFromJwt): Promise<RelacionadosDTO> {
        if (!dto.meta_id && !dto.iniciativa_id && !dto.atividade_id) {
            throw new HttpException('É necessário informar ao menos um dos parâmetros', 400);
        }

        const pdm_id = dto.pdm_id
            ? dto.pdm_id
            : (
                  await this.prisma.pdm.findFirstOrThrow({
                      where: { ativo: true, tipo: 'PDM', removido_em: null },
                      select: { id: true },
                  })
              ).id;
        const meta = await this.prisma.meta.findFirst({
            where: {
                pdm_id: pdm_id,
                OR: [
                    {
                        id: dto.meta_id,
                    },
                    {
                        iniciativa: dto.iniciativa_id ? { some: { id: dto.iniciativa_id } } : undefined,
                    },
                    {
                        iniciativa: dto.atividade_id
                            ? {
                                  some: {
                                      atividade: { some: { id: dto.atividade_id } },
                                  },
                              }
                            : undefined,
                    },
                ],
            },
            select: {
                id: true,
            },
        });

        if (!meta) throw new HttpException('Meta não encontrada.', 404);
        const r = await this.findAll(tipo, { id: meta.id }, user); // check permissão
        if (!r.length) throw new HttpException('Meta não encontrada.', 404);

        const pdm = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
                NOT: { id: pdm_id },
                OR: [
                    {
                        Meta: { some: { id: dto.meta_id } },
                    },
                    {
                        Meta: dto.iniciativa_id
                            ? {
                                  some: {
                                      iniciativa: { some: { id: dto.iniciativa_id } },
                                  },
                              }
                            : undefined,
                    },
                    {
                        Meta: dto.atividade_id
                            ? {
                                  some: {
                                      iniciativa: {
                                          some: {
                                              atividade: { some: { id: dto.atividade_id } },
                                          },
                                      },
                                  },
                              }
                            : undefined,
                    },
                ],
            },
            select: {
                id: true,
                nome: true,
                tipo: true,
                Meta: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        iniciativa: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                                atividade: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        const MetaPdmDto: MetaPdmDto[] = [];
        for (const p of pdm) {
            for (const m of p.Meta) {
                const metaPdm: MetaPdmDto = {
                    tipo: p.tipo,
                    meta_id: m.id,
                    meta_codigo: m.codigo,
                    meta_titulo: m.titulo,
                    pdm_id: p.id,
                    pdm_descricao: p.nome,
                };

                if (m.iniciativa && m.iniciativa.length > 0) {
                    metaPdm.iniciativa_id = m.iniciativa[0].id;
                    metaPdm.iniciativa_codigo = m.iniciativa[0].codigo;
                    metaPdm.iniciativa_descricao = m.iniciativa[0].titulo;

                    if (m.iniciativa[0].atividade && m.iniciativa[0].atividade.length > 0) {
                        metaPdm.atividade_id = m.iniciativa[0].atividade[0].id;
                        metaPdm.atividade_codigo = m.iniciativa[0].atividade[0].codigo;
                        metaPdm.atividade_descricao = m.iniciativa[0].atividade[0].titulo;
                    }
                }

                MetaPdmDto.push(metaPdm);
            }
        }

        const projetos = await this.prisma.projeto.findMany({
            where: {
                removido_em: null,

                AND: [
                    dto.meta_id
                        ? {
                              meta_id: dto.meta_id,
                              iniciativa_id: null,
                              atividade_id: null,
                          }
                        : {},
                    dto.iniciativa_id
                        ? {
                              iniciativa_id: dto.iniciativa_id,
                              atividade_id: null,
                          }
                        : {},
                    dto.atividade_id
                        ? {
                              atividade_id: dto.atividade_id,
                          }
                        : {},
                ],
            },
            select: {
                id: true,
                tipo: true,
                codigo: true,
                nome: true,
                portfolio: { select: { id: true, titulo: true } },
                projeto_etapa: {
                    select: { id: true, descricao: true },
                },
                tipo_intervencao: {
                    select: { id: true, nome: true },
                },
                ProjetoRegiao: {
                    where: { removido_em: null, regiao: { nivel: 3 } },
                    select: { regiao: { select: { id: true, nivel: true, parente_id: true, descricao: true } } },
                },
                equipamento: { select: { id: true, nome: true } },
                status: true,
                TarefaCronograma: {
                    where: { removido_em: null },
                    take: 1,
                    select: {
                        id: true,
                        percentual_concluido: true,
                    },
                },
            },
        });

        return {
            pdm_metas: MetaPdmDto.filter((p) => p.tipo === 'PDM'),
            ps_metas: MetaPdmDto.filter((p) => p.tipo === 'PS'),
            obras: projetos
                .filter((p) => p.tipo === 'MDO')
                .map((r) => {
                    return {
                        codigo: r.codigo,
                        equipamento: r.equipamento ? { id: r.equipamento.id, nome: r.equipamento.nome } : null,
                        id: r.id,
                        nome: r.nome,
                        status: r.status,
                        tipo_intervencao: r.tipo_intervencao
                            ? { id: r.tipo_intervencao.id, nome: r.tipo_intervencao.nome }
                            : null,
                        subprefeituras: r.ProjetoRegiao.map((r) => {
                            return {
                                id: r.regiao.id,
                                descricao: r.regiao.descricao,
                                nivel: r.regiao.nivel,
                                parente_id: r.regiao.parente_id,
                            } satisfies IdDescRegiaoComParent;
                        }),
                        percentual_concluido:
                            r.TarefaCronograma.length > 0 ? r.TarefaCronograma[0].percentual_concluido : null,
                    } satisfies IdObrasDto;
                }),
            projetos: projetos
                .filter((p) => p.tipo === 'PP')
                .map((r) => {
                    return {
                        codigo: r.codigo,
                        id: r.id,
                        nome: r.nome,
                        portfolio: { id: r.portfolio.id, titulo: r.portfolio.titulo },
                        projeto_etapa: r.projeto_etapa
                            ? { id: r.projeto_etapa.id, descricao: r.projeto_etapa.descricao }
                            : null,
                    } satisfies IdProjetoDto;
                }),
        };
    }
}
