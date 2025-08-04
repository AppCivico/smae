import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { UniqueNumbers } from '../common/UniqueNumbers';
import { PdmModoParaTipo, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { DetalheOrigensDto, ResumoOrigensMetasItemDto } from '../common/dto/origem-pdm.dto';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CompromissoOrigemHelper } from '../common/helpers/CompromissoOrigem';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { MetaIniAtvTag } from '../meta/entities/meta.entity';
import { MetaService } from '../meta/meta.service';
import { upsertPSPerfisMetaIniAtv, validatePSEquipes } from '../meta/ps-perfil.util';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { CreateIniciativaDto, IniciativaOrgaoParticipante } from './dto/create-iniciativa.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { UpdateIniciativaDto } from './dto/update-iniciativa.dto';
import { IdNomeExibicao, IniciativaDto, IniciativaOrgao } from './entities/iniciativa.entity';

interface IniciativaResponsavelChanges {
    added: {
        pessoa_id: number;
        coordenador_cp: boolean;
    }[];
    removed: {
        pessoa_id: number;
        coordenador_cp: boolean;
    }[];
}

@Injectable()
export class IniciativaService {
    private readonly logger = new Logger(IniciativaService.name);
    constructor(
        private readonly prisma: PrismaService,
        readonly metaService: MetaService,
        private readonly variavelService: VariavelService
    ) {}

    async create(tipo: TipoPdmType, dto: CreateIniciativaDto, user: PessoaFromJwt) {
        await this.metaService.assertMetaWriteOrThrow(tipo, dto.meta_id, user, 'iniciativa');

        const meta = await this.prisma.meta.findFirstOrThrow({
            where: { id: dto.meta_id, removido_em: null },
            select: { ativo: true },
        });
        if (!meta.ativo) throw new HttpException('Meta desativada, ative a meta para criar iniciativas', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const op = dto.orgaos_participantes;
                const cp = dto.coordenadores_cp;
                const tags = UniqueNumbers(dto.tags) || [];
                const geolocalizacao = dto.geolocalizacao;
                const ps_tecnico_cp = dto.ps_tecnico_cp;
                const ps_ponto_focal = dto.ps_ponto_focal;
                const origens_extra = dto.origens_extra;
                delete dto.orgaos_participantes;
                delete dto.coordenadores_cp;
                delete dto.tags;
                delete dto.geolocalizacao;
                delete dto.ps_ponto_focal;
                delete dto.ps_tecnico_cp;
                delete dto.origens_extra;

                const codigoJaEmUso = await prismaTx.iniciativa.count({
                    where: {
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                        meta_id: dto.meta_id,
                        removido_em: null,
                    },
                });
                if (codigoJaEmUso > 0)
                    throw new HttpException('codigo| Já existe iniciativa com este código nesta meta', 400);

                const tituloJaEmUso = await prismaTx.iniciativa.count({
                    where: {
                        titulo: { equals: dto.titulo, mode: 'insensitive' },
                        meta_id: dto.meta_id,
                        removido_em: null,
                    },
                });
                if (tituloJaEmUso > 0)
                    throw new HttpException('codigo| Já existe iniciativa com este título nesta meta', 400);

                const origem_cache = await CompromissoOrigemHelper.processaOrigens(origens_extra, this.prisma);
                const iniciativa = await prismaTx.iniciativa.create({
                    data: {
                        origem_cache: origem_cache as any,
                        criado_por: user.id,
                        criado_em: now,
                        ...dto,
                    },
                    select: { id: true },
                });

                if (Array.isArray(origens_extra)) {
                    await CompromissoOrigemHelper.upsert(
                        iniciativa.id,
                        'iniciativa',
                        origens_extra,
                        prismaTx,
                        user,
                        now
                    );
                }

                if (tipo === '_PDM') {
                    if (!op) throw new HttpException('orgaos_participantes é obrigatório para PDM', 400);

                    await prismaTx.iniciativaOrgao.createMany({
                        data: await this.buildOrgaosParticipantes(iniciativa.id, op),
                    });

                    if (!cp) throw new HttpException('coordenadores_cp é obrigatório para PDM', 400);
                    await prismaTx.iniciativaResponsavel.createMany({
                        data: await this.buildIniciativaResponsaveis(iniciativa.id, op, cp),
                    });
                } else {
                    const pdm = await this.prisma.pdm.findFirstOrThrow({
                        where: { Meta: { some: { removido_em: null, id: dto.meta_id } } },
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
                        await upsertPSPerfisMetaIniAtv(
                            iniciativa.id,
                            'iniciativa',
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
                        await upsertPSPerfisMetaIniAtv(
                            iniciativa.id,
                            'iniciativa',
                            ps_ponto_focal,
                            'PONTO_FOCAL',
                            [],
                            user,
                            prismaTx,
                            pdm.id
                        );
                    }
                }

                await prismaTx.iniciativaTag.createMany({
                    data: await this.buildIniciativaTags(iniciativa.id, tags),
                });

                if (geolocalizacao) {
                    const geoDto = new CreateGeoEnderecoReferenciaDto();
                    geoDto.iniciativa_id = iniciativa.id;
                    geoDto.tokens = geolocalizacao;
                    geoDto.tipo = 'Endereco';

                    await this.metaService.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
                }

                return iniciativa;
            }
        );

        return created;
    }

    async buildIniciativaTags(iniciativaId: number, tags: number[]): Promise<Prisma.IniciativaTagCreateManyInput[]> {
        const arr: Prisma.IniciativaTagCreateManyInput[] = [];

        if (typeof tags !== 'object') {
            tags = [];
        }

        for (const tag of tags) {
            arr.push({
                iniciativa_id: iniciativaId,
                tag_id: tag,
            });
        }

        return arr;
    }

    async buildOrgaosParticipantes(
        iniciativaId: number,
        orgaos_participantes: MetaOrgaoParticipante[]
    ): Promise<Prisma.IniciativaOrgaoCreateManyInput[]> {
        const arr: Prisma.IniciativaOrgaoCreateManyInput[] = [];

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
                    iniciativa_id: iniciativaId,
                });
            }
        }

        return arr;
    }

    async buildIniciativaResponsaveis(
        iniciativaId: number,
        orgaos_participantes: IniciativaOrgaoParticipante[],
        coordenadores_cp: number[]
    ): Promise<Prisma.IniciativaResponsavelCreateManyInput[]> {
        const arr: Prisma.IniciativaResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participanteId of orgao.participantes) {
                if (!participanteId) {
                    console.log(orgao);
                    continue;
                }

                arr.push({
                    iniciativa_id: iniciativaId,
                    pessoa_id: participanteId,
                    orgao_id: orgao.orgao_id,
                    coordenador_responsavel_cp: false,
                });
            }
        }

        for (const CoordenadoriaParticipanteId of coordenadores_cp) {
            if (!CoordenadoriaParticipanteId) {
                console.log(coordenadores_cp);
                continue;
            }

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
                    iniciativa_id: iniciativaId,
                    pessoa_id: CoordenadoriaParticipanteId,
                    orgao_id: orgaoId,
                    coordenador_responsavel_cp: true,
                });
            }
        }

        return arr;
    }

    async findAll(tipo: TipoPdmType, filters: FilterIniciativaDto, user: PessoaFromJwt) {
        const meta_id = filters?.meta_id;

        const metaFilterSet = await this.metaService.getMetaFilterSet(tipo, user);

        const listActive = await this.prisma.iniciativa.findMany({
            where: {
                id: filters.id,
                removido_em: null,
                meta_id: meta_id ? meta_id : undefined,
                meta: { AND: metaFilterSet },
            },
            orderBy: [{ codigo: 'asc' }],
            select: {
                id: true,
                titulo: true,
                codigo: true,
                contexto: true,
                complemento: true,
                meta_id: true,
                status: true,
                compoe_indicador_meta: true,
                ativo: true,
                iniciativa_orgao: {
                    select: {
                        orgao: { select: { id: true, descricao: true, sigla: true } },
                        responsavel: true,
                    },
                },
                iniciativa_responsavel: {
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
                iniciativa_tag: {
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
                PdmPerfil: {
                    where: {
                        removido_em: null,
                        etapa_id: null,
                    },
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
        const ret: IniciativaDto[] = [];
        for (const dbIniciativa of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, IniciativaOrgao> = {};

            for (const orgao of dbIniciativa.iniciativa_orgao) {
                orgaos[orgao.orgao.id] = {
                    orgao: orgao.orgao,
                    responsavel: orgao.responsavel,
                    participantes: [],
                };
            }

            for (const responsavel of dbIniciativa.iniciativa_responsavel) {
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
            if (dbIniciativa.Cronograma && dbIniciativa.Cronograma.length > 0) {
                const cronogramaId: number = dbIniciativa.Cronograma[0].id;

                const cronogramaEtapaRet = await this.metaService.cronogramaEtapaService.findAll(
                    tipo,
                    { cronograma_id: cronogramaId },
                    user,
                    true
                );
                cronogramaAtraso = {
                    id: cronogramaId,
                    atraso_grau: await this.metaService.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet),
                };
            }

            for (const metaTag of dbIniciativa.iniciativa_tag) {
                tags.push({
                    id: metaTag.tag.id,
                    descricao: metaTag.tag.descricao,
                    download_token: this.metaService.uploadService.getPersistentDownloadToken(
                        metaTag.tag.arquivo_icone_id
                    ),
                });
            }

            let origens_extra: DetalheOrigensDto[] | ResumoOrigensMetasItemDto =
                dbIniciativa.origem_cache?.valueOf() as ResumoOrigensMetasItemDto;

            if (filters?.id) {
                origens_extra = await CompromissoOrigemHelper.buscaOrigensComDetalhes(
                    'iniciativa',
                    dbIniciativa.id,
                    this.prisma
                );
            }

            ret.push({
                origens_extra: origens_extra,
                tags,
                id: dbIniciativa.id,
                titulo: dbIniciativa.titulo,
                codigo: dbIniciativa.codigo,
                contexto: dbIniciativa.contexto,
                complemento: dbIniciativa.complemento,
                meta_id: dbIniciativa.meta_id,
                status: dbIniciativa.status,
                coordenadores_cp: coordenadores_cp,
                orgaos_participantes: Object.values(orgaos),
                compoe_indicador_meta: dbIniciativa.compoe_indicador_meta,
                ativo: dbIniciativa.ativo,
                cronograma: cronogramaAtraso,
                geolocalizacao: geolocalizacao.get(dbIniciativa.id) || [],
                ps_tecnico_cp: {
                    equipes: dbIniciativa.PdmPerfil.filter((r) => r.tipo == 'CP').map((r) => r.equipe_id),
                },
                ps_ponto_focal: {
                    equipes: dbIniciativa.PdmPerfil.filter((r) => r.tipo == 'PONTO_FOCAL').map((r) => r.equipe_id),
                },
            });
        }

        return ret;
    }

    async update(tipo: TipoPdmType, id: number, dto: UpdateIniciativaDto, user: PessoaFromJwt) {
        const self = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id, meta: { pdm: { tipo: PdmModoParaTipo(tipo) } }, removido_em: null },
            select: { meta_id: true, meta: { select: { ativo: true } } },
        });

        await this.metaService.assertMetaWriteOrThrow(tipo, self.meta_id, user, 'iniciativa');
        if (!self.meta.ativo) throw new HttpException('Meta desativada, ative a meta para editar iniciativas', 400);

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const op = dto.orgaos_participantes;
            const cp = dto.coordenadores_cp;
            const tags = UniqueNumbers(dto.tags);
            const geolocalizacao = dto.geolocalizacao;
            const ps_tecnico_cp = dto.ps_tecnico_cp;
            const ps_ponto_focal = dto.ps_ponto_focal;
            const origens_extra = dto.origens_extra;
            delete dto.orgaos_participantes;
            delete dto.coordenadores_cp;
            delete dto.tags;
            delete dto.geolocalizacao;
            delete dto.ps_tecnico_cp;
            delete dto.ps_ponto_focal;
            delete dto.origens_extra;

            if (tipo === '_PDM' && cp && !op)
                throw new HttpException('é necessário enviar orgaos_participantes para alterar coordenadores_cp', 400);

            if (dto.codigo) {
                const codigoJaEmUso = await prismaTx.iniciativa.count({
                    where: {
                        id: { not: id },
                        removido_em: null,
                        codigo: { equals: dto.codigo, mode: 'insensitive' },
                        meta_id: self.meta_id,
                    },
                });
                if (codigoJaEmUso)
                    throw new HttpException('codigo| Já existe iniciativa com este código nesta meta', 400);
            }

            if (dto.titulo) {
                const codigoJaEmUso = await prismaTx.iniciativa.count({
                    where: {
                        id: { not: id },
                        removido_em: null,
                        titulo: { equals: dto.titulo, mode: 'insensitive' },
                        meta_id: self.meta_id,
                    },
                });
                if (codigoJaEmUso)
                    throw new HttpException('codigo| Já existe iniciativa com este título nesta meta', 400);
            }

            let origem_cache: object | undefined = undefined;
            if (Array.isArray(origens_extra)) {
                origem_cache = await CompromissoOrigemHelper.processaOrigens(origens_extra, this.prisma);
            }

            const iniciativa = await prismaTx.iniciativa.update({
                where: { id: id },
                data: {
                    origem_cache,
                    atualizado_por: user.id,
                    atualizado_em: now,
                    status: '',
                    ...dto,
                },
                select: { id: true },
            });
            if (Array.isArray(origens_extra)) {
                await CompromissoOrigemHelper.upsert(id, 'iniciativa', origens_extra, prismaTx, user, now);
            }

            if (tipo === '_PDM') {
                if (op) {
                    if (op.length == 0) throw new HttpException('orgaos_participantes é obrigatório para PDM', 400);

                    await prismaTx.iniciativaOrgao.deleteMany({ where: { iniciativa_id: id } });
                    await prismaTx.iniciativaOrgao.createMany({
                        data: await this.buildOrgaosParticipantes(iniciativa.id, op),
                    });

                    if (cp) {
                        if (cp.length == 0) throw new HttpException('coordenadores_cp é obrigatório para PDM', 400);

                        await this.upsertIniciativaResponsaveis(prismaTx, iniciativa.id, op, cp);
                    }
                }
            } else {
                const pdm = await prismaTx.pdm.findFirstOrThrow({
                    where: { Meta: { some: { removido_em: null, iniciativa: { some: { id, removido_em: null } } } } },
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
                        iniciativa_id: id,
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
                    await upsertPSPerfisMetaIniAtv(
                        id,
                        'iniciativa',
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
                    await upsertPSPerfisMetaIniAtv(
                        id,
                        'iniciativa',
                        ps_ponto_focal,
                        'PONTO_FOCAL',
                        currentPdmPerfis,
                        user,
                        prismaTx,
                        pdm.id
                    );
                }
            }

            if (Array.isArray(tags)) {
                await prismaTx.iniciativaTag.deleteMany({ where: { iniciativa_id: id } });
                await Promise.all([
                    prismaTx.iniciativaTag.createMany({
                        data: await this.buildIniciativaTags(iniciativa.id, tags),
                    }),
                ]);
            }

            const indicador = await prismaTx.indicador.findFirst({
                where: {
                    removido_em: null,
                    iniciativa_id: iniciativa.id,
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
                this.logger.log('não há indicador para a iniciativa');
            } else {
                for (const variavel of indicador.IndicadorVariavel) {
                    const info = await this.variavelService.buscaIndicadorParaVariavel(indicador.id);
                    await this.variavelService.resyncIndicadorVariavel(info, variavel.variavel_id, prismaTx);
                }
            }

            if (geolocalizacao) {
                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.iniciativa_id = iniciativa.id;
                geoDto.tokens = geolocalizacao;
                geoDto.tipo = 'Endereco';

                await this.metaService.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
            }

            return iniciativa;
        });

        return { id };
    }

    private async upsertIniciativaResponsaveis(
        prismaTx: Prisma.TransactionClient,
        iniciativaId: number,
        orgaosParticipantes: IniciativaOrgaoParticipante[],
        coordenadoresCP: number[]
    ): Promise<IniciativaResponsavelChanges> {
        // atual
        const currentResponsaveis = await prismaTx.iniciativaResponsavel.findMany({
            where: { iniciativa_id: iniciativaId },
            select: {
                pessoa_id: true,
                coordenador_responsavel_cp: true,
            },
        });

        const newResponsaveis: Prisma.IniciativaResponsavelCreateManyInput[] = [];

        // Adiciona como se fosse todos novos
        for (const orgao of orgaosParticipantes) {
            for (const participanteId of orgao.participantes) {
                newResponsaveis.push({
                    iniciativa_id: iniciativaId,
                    pessoa_id: participanteId,
                    orgao_id: orgao.orgao_id,
                    coordenador_responsavel_cp: false,
                });
            }
        }

        // Mesma coisa pro cp
        for (const coordenadorId of coordenadoresCP) {
            const pessoaFisicaOrgao = await prismaTx.pessoa.findFirst({
                where: { id: coordenadorId },
                select: { pessoa_fisica: { select: { orgao_id: true } } },
            });

            const orgaoId = pessoaFisicaOrgao?.pessoa_fisica?.orgao_id;
            if (!orgaoId) {
                throw new BadRequestException(
                    `Coordenador CP ${coordenadorId} não está associado a uma Pessoa Física com Órgão.`
                );
            }

            newResponsaveis.push({
                iniciativa_id: iniciativaId,
                pessoa_id: coordenadorId,
                orgao_id: orgaoId,
                coordenador_responsavel_cp: true,
            });
        }

        // agora busca de fato as mudanças
        const changes: IniciativaResponsavelChanges = {
            added: [],
            removed: [],
        };

        // quem saiu
        for (const current of currentResponsaveis) {
            const stillExists = newResponsaveis.some(
                (nr) =>
                    nr.pessoa_id === current.pessoa_id &&
                    nr.coordenador_responsavel_cp === current.coordenador_responsavel_cp
            );

            if (!stillExists) {
                changes.removed.push({
                    pessoa_id: current.pessoa_id,
                    coordenador_cp: current.coordenador_responsavel_cp,
                });
            }
        }

        // quem entrou
        for (const newResp of newResponsaveis) {
            const exists = currentResponsaveis.some(
                (cr) =>
                    cr.pessoa_id === newResp.pessoa_id &&
                    cr.coordenador_responsavel_cp === newResp.coordenador_responsavel_cp
            );

            if (!exists) {
                changes.added.push({
                    pessoa_id: newResp.pessoa_id,
                    coordenador_cp: newResp.coordenador_responsavel_cp,
                });
            }
        }

        // quem saiu precisa verificar as responsabilidades
        await this.verificaRemocaoResponsaveis(prismaTx, iniciativaId, changes.removed);

        // apaga quem saiu
        if (changes.removed.length > 0) {
            const removeIds = changes.removed.map((r) => r.pessoa_id);
            await prismaTx.iniciativaResponsavel.deleteMany({
                where: {
                    iniciativa_id: iniciativaId,
                    pessoa_id: { in: removeIds },
                },
            });
        }

        // salva os novos, se alguem saiu de pf pra cp, vai gerar saida+entrada
        for (const newResp of newResponsaveis) {
            const exists = currentResponsaveis.some(
                (cr) =>
                    cr.pessoa_id === newResp.pessoa_id &&
                    cr.coordenador_responsavel_cp === newResp.coordenador_responsavel_cp
            );

            if (!exists) {
                await prismaTx.iniciativaResponsavel.create({
                    data: newResp,
                });
            }
        }

        return changes;
    }

    private async verificaRemocaoResponsaveis(
        prismaTx: Prisma.TransactionClient,
        iniciativaId: number,
        responsaveisRemovidos: { pessoa_id: number; coordenador_cp: boolean }[]
    ): Promise<void> {
        for (const resp of responsaveisRemovidos) {
            // Check if participant is used in Atividade
            const atividadeCount = await prismaTx.atividadeResponsavel.count({
                where: {
                    pessoa_id: resp.pessoa_id,
                    coordenador_responsavel_cp: resp.coordenador_cp,
                    atividade: {
                        removido_em: null,
                        iniciativa_id: iniciativaId,
                    },
                },
            });

            if (atividadeCount > 0) {
                const atividades = await prismaTx.atividadeResponsavel.findMany({
                    where: {
                        pessoa_id: resp.pessoa_id,
                        coordenador_responsavel_cp: resp.coordenador_cp,
                        atividade: {
                            removido_em: null,
                            iniciativa_id: iniciativaId,
                        },
                    },
                    select: {
                        atividade: {
                            select: { titulo: true },
                        },
                    },
                });
                const desc = atividades.map((a) => a.atividade.titulo).join(', ');
                throw new BadRequestException(
                    `${resp.coordenador_cp ? 'Coordenador' : 'Participante'} em uso em Atividade: ${desc}, remova-o primeiro no nível de Atividade.`
                );
            }

            // Check if participant is used in Variables
            const variavelCount = await prismaTx.variavelResponsavel.count({
                where: {
                    pessoa_id: resp.pessoa_id,
                    variavel: {
                        indicador_variavel: {
                            some: {
                                indicador: {
                                    removido_em: null,
                                    iniciativa_id: iniciativaId,
                                },
                            },
                        },
                    },
                },
            });

            if (variavelCount > 0) {
                const variaveis = await prismaTx.variavelResponsavel.findMany({
                    where: {
                        pessoa_id: resp.pessoa_id,
                        variavel: {
                            removido_em: null,
                            indicador_variavel: {
                                some: {
                                    indicador_origem: null,
                                    indicador: {
                                        removido_em: null,
                                        iniciativa_id: iniciativaId,
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        variavel: {
                            select: { titulo: true, codigo: true },
                        },
                    },
                });
                const desc = variaveis.map((v) => `${v.variavel.titulo} (${v.variavel.codigo})`).join(', ');

                throw new BadRequestException(
                    `${resp.coordenador_cp ? 'Coordenador' : 'Participante'} em uso em variaveis de indicadores: ${desc}, remova-o primeiro no nível de Variável.`
                );
            }

            // Check if participant is used in Cronograma Etapas
            const cronogramaEtapa = await prismaTx.etapaResponsavel.count({
                where: {
                    pessoa_id: resp.pessoa_id,
                    etapa: {
                        removido_em: null,
                        CronogramaEtapa: {
                            some: {
                                cronograma: {
                                    iniciativa_id: iniciativaId,
                                    removido_em: null,
                                },
                            },
                        },
                    },
                },
            });

            if (cronogramaEtapa > 0) {
                const etapas = await prismaTx.etapaResponsavel.findMany({
                    where: {
                        pessoa_id: resp.pessoa_id,
                        etapa: {
                            removido_em: null,
                            CronogramaEtapa: {
                                some: {
                                    cronograma: {
                                        iniciativa_id: iniciativaId,
                                        removido_em: null,
                                    },
                                },
                            },
                        },
                    },
                    select: {
                        etapa: {
                            select: { titulo: true },
                        },
                    },
                });
                const desc = etapas.map((v) => `${v.etapa.titulo}`).join(', ');
                throw new BadRequestException(
                    `${resp.coordenador_cp ? 'Coordenador' : 'Participante'} em uso em etapas de cronograma: ${desc}, remova-o primeiro no nível de Etapa.`
                );
            }
        }
    }

    async remove(tipo: TipoPdmType, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id, removido_em: null },
            select: {
                meta_id: true,
                meta: { select: { ativo: true } },
                compoe_indicador_meta: true,
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
        await this.metaService.assertMetaWriteOrThrow(tipo, self.meta_id, user, 'iniciativa');
        if (!self.meta.ativo) throw new HttpException('Meta desativada, ative a meta para remover iniciativas', 400);

        const projetosAtivos = await this.prisma.projeto.count({
            where: {
                iniciativa_id: id,
                removido_em: null,
            },
        });
        if (projetosAtivos > 0) {
            const projetos = await this.prisma.projeto.findMany({
                where: {
                    iniciativa_id: id,
                    removido_em: null,
                },
                select: {
                    id: true,
                    codigo: true,
                },
            });

            throw new BadRequestException(
                `Não é possível remover a iniciativa pois existem projetos ativos associados: ${projetos
                    .map((p) => `Projeto ${p.codigo}`)
                    .join(', ')}`
            );
        }

        const projetoOrigensAtivas = await this.prisma.compromissoOrigem.count({
            where: {
                removido_em: null,
                OR: [
                    {
                        // como fonte source
                        iniciativa_id: id,
                        removido_em: null,
                    },
                    {
                        rel_iniciativa_id: id,
                        removido_em: null,
                    },
                ],
            },
        });
        if (projetoOrigensAtivas > 0) {
            const origens = await this.prisma.compromissoOrigem.findMany({
                where: {
                    OR: [
                        {
                            iniciativa_id: id,
                            removido_em: null,
                        },
                        {
                            rel_iniciativa_id: id,
                            removido_em: null,
                        },
                    ],
                },
                select: {
                    projeto: { select: { id: true, codigo: true } },
                    atividade: { select: { id: true, codigo: true } },
                    iniciativa: { select: { id: true, codigo: true } },
                    meta: { select: { id: true, codigo: true } },
                },
            });

            throw new BadRequestException(
                'Não é possível remover a iniciativa pois existem relacionamentos ativos com projetos: ' +
                    origens
                        .map((o) => {
                            if (o.projeto) return `Projeto ${o.projeto.codigo}`;
                            if (o.atividade) return `Atividade ${o.atividade.codigo}`;
                            if (o.iniciativa) return `Iniciativa ${o.iniciativa.codigo}`;
                            if (o.meta) return `Meta ${o.meta.codigo}`;
                            return 'Desconhecido';
                        })
                        .join(', ')
            );
        }

        const indicadoresAtivos = await this.prisma.indicador.count({
            where: {
                iniciativa_id: id,
                removido_em: null,
            },
        });
        if (indicadoresAtivos > 0)
            throw new BadRequestException(
                'Não é possível remover a iniciativa pois existem indicadores ativos associados. Apague os indicadores antes de remover a meta.'
            );

        const cronogramasAtivos = await this.prisma.cronograma.count({
            where: {
                iniciativa_id: id,
                removido_em: null,
            },
        });
        if (cronogramasAtivos > 0)
            throw new BadRequestException(
                'Não é possível remover a iniciativa pois existem cronogramas ativos associados. Apague os cronogramas antes de remover a meta.'
            );

        const now = new Date(Date.now());
        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<Prisma.BatchPayload> => {
                // Antes de remover a Iniciativa, deve ser verificada a Meta para garantir de que não há variaveis em uso
                if (self.compoe_indicador_meta) {
                    let has_vars_in_use = false;

                    for (const indicador of self.Indicador) {
                        if (indicador.IndicadorVariavel.length > 0) has_vars_in_use = true;

                        if (has_vars_in_use == true)
                            throw new HttpException(
                                'Iniciativa possui variáveis em uso pela Meta, desative o campo de "Compõe indicador da Meta" para remover a Iniciativa',
                                400
                            );
                    }
                }

                const removed = await this.prisma.iniciativa.updateMany({
                    where: { id: id },
                    data: {
                        removido_por: user.id,
                        removido_em: now,
                    },
                });

                // Caso a Iniciativa seja removida, é necessário remover relacionamentos com PainelConteudoDetalhe
                // public.painel_conteudo_detalhe
                await prismaTx.painelConteudoDetalhe.deleteMany({ where: { iniciativa_id: id } });

                return removed;
            }
        );
    }
}
