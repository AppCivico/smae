import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UploadService } from 'src/upload/upload.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
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
import { IdNomeExibicao, Meta, MetaOrgao, MetaPdmDto, MetaTag, RelacionadosDTO } from './entities/meta.entity';

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
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly uploadService: UploadService,
        private readonly geolocService: GeoLocService
    ) {}

    async create(dto: CreateMetaDto, user: PessoaFromJwt) {
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

    private async getMetasPermissionSet(user: PessoaFromJwt | undefined, isBi: boolean) {
        const permissionsSet: Prisma.Enumerable<Prisma.MetaWhereInput> = [
            {
                removido_em: null,
            },
        ];
        if (!user) return permissionsSet;
        if (isBi && user.hasSomeRoles(['SMAE.acesso_bi'])) return permissionsSet;

        // TODO filtrar painéis que o usuário pode visualizar, caso não tenha nenhuma das permissões
        // 'CadastroMeta.inserir'
        // atualmente nesse serviço não tem nada de painel, então acho que precisa rever esse TODO
        // pra outro lugar (o frontend da um get em /painel sem informar qual meta
        // lá no front que está fazendo o filtro pra descobrir os painel que tme a meta e
        // depois o busca a serie do painel-conteúdo correspondente

        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            if (user.hasSomeRoles(['PDM.tecnico_cp'])) {
                // logo, é um tecnico_cp
                filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            } else if (user.hasSomeRoles(['PDM.ponto_focal'])) {
                filterIdIn = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel);
            }
        }

        if (filterIdIn) {
            this.logger.debug('Filtrando apenas getMetasOndeSouResponsavel');
            permissionsSet.push({
                id: { in: filterIdIn },
            });
        }

        return permissionsSet;
    }

    async findAllIds(
        user: PessoaFromJwt | undefined,
        pdm_id: number | undefined = undefined
    ): Promise<{ id: number }[]> {
        const permissionsSet = await this.getMetasPermissionSet(user, true);

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

    async findAll(filters: FilterMetaDto | undefined = undefined, user: PessoaFromJwt) {
        const permissionsSet = await this.getMetasPermissionSet(user, false);

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
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        const ret: Meta[] = [];
        for (const dbMeta of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, MetaOrgao> = {};
            const tags: MetaTag[] = [];

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

            let metaCronograma: CronogramaAtrasoGrau | null = null;
            if (dbMeta.cronograma && filters?.id !== undefined) {
                const cronograma = dbMeta.cronograma[0];

                let cronogramaAtraso: string | null = null;
                if (cronograma) {
                    const cronogramaEtapaRet = await this.cronogramaEtapaService.findAll({
                        cronograma_id: cronograma.id,
                    });
                    cronogramaAtraso = await this.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet);
                }
                metaCronograma = {
                    id: cronograma ? cronograma.id : null,
                    atraso_grau: cronogramaAtraso,
                };
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
                geolocalizacao: geolocalizacao.get(dbMeta.id) || [],
            });
        }

        return ret;
    }

    async update(id: number, updateMetaDto: UpdateMetaDto, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            await user.assertHasMetaRespAccessNaCp(id, this.prisma);
        }

        const loadMeta = await this.prisma.meta.findFirstOrThrow({
            where: { id, removido_em: null },
            select: { pdm_id: true },
        });

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

    async remove(id: number, user: PessoaFromJwt) {
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            // logo, só pode editar se for responsável
            await user.assertHasMetaRespAccessNaCp(id, this.prisma);
        }

        return await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<Prisma.BatchPayload> => {
                const removed = await prisma.meta.updateMany({
                    where: { id: id, removido_em: null },
                    data: {
                        removido_por: user.id,
                        removido_em: new Date(Date.now()),
                    },
                });

                // Caso a Meta seja removida, é necessário remover relacionamentos com Painel
                // public.painel_conteudo e public.painel_conteudo_detalhe
                await prisma.painelConteudo.deleteMany({ where: { meta_id: id } });

                return removed;
            }
        );
    }

    async buscaMetasIniciativaAtividades(metas: number[]): Promise<DadosCodTituloMetaDto[]> {
        const list: DadosCodTituloMetaDto[] = [];

        for (const meta_id of metas) {
            const rows: DadosMetaIniciativaAtividadesDto[] = await this.prisma.$queryRaw`
            (
                select 'meta' as tipo, m.id as meta_id, null::int as iniciativa_id, null::int as atividade_id, m.codigo, m.titulo
                from meta m
                where m.id = ${meta_id}
                order by m.codigo
            )
            union all
            (
                select 'iniciativa' as tipo, m.id as meta_id, i.id , null, i.codigo, i.titulo
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                where m.id = ${meta_id}
                order by i.codigo
            )
            union all
            (
                select 'atividade' as tipo, m.id as meta_id, i.id as iniciativa_id, a.id as atividade_id, a.codigo, a.titulo
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                join atividade a on a.iniciativa_id = i.id and a.removido_em is null
                where m.id = ${meta_id}
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

    async buscaRelacionados(dto: FilterRelacionadosDTO, user: PessoaFromJwt): Promise<RelacionadosDTO> {
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
        const r = await this.findAll({ id: meta.id }, user); // check permissão
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
                OR: [
                    {
                        meta_id: dto.meta_id,
                    },
                    {
                        iniciativa_id: dto.iniciativa_id,
                    },
                    {
                        atividade_id: dto.atividade_id,
                    },
                ],
            },
            select: {
                id: true,
                tipo: true,
                codigo: true,
                nome: true,
            },
        });

        return {
            metas: MetaPdmDto,
            obras: projetos.filter((p) => p.tipo === 'MDO'),
            projetos: projetos.filter((p) => p.tipo === 'PP'),
        };
    }
}
