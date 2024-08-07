import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoPdm } from '@prisma/client';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { MetaIniAtvTag } from '../meta/entities/meta.entity';
import { MetaService } from '../meta/meta.service';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { CreateIniciativaDto, IniciativaOrgaoParticipante } from './dto/create-iniciativa.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { UpdateIniciativaDto } from './dto/update-iniciativa.dto';
import { IdNomeExibicao, Iniciativa, IniciativaOrgao } from './entities/iniciativa.entity';

@Injectable()
export class IniciativaService {
    private readonly logger = new Logger(IniciativaService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly variavelService: VariavelService
    ) {}

    async create(tipo: TipoPdm, dto: CreateIniciativaDto, user: PessoaFromJwt) {
        await this.metaService.assertMetaWriteOrThrow(tipo, dto.meta_id, user, 'iniciativa');

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const op = dto.orgaos_participantes!;
                const cp = dto.coordenadores_cp!;
                const tags = dto.tags || [];
                const geolocalizacao = dto.geolocalizacao;
                delete dto.orgaos_participantes;
                delete dto.coordenadores_cp;
                delete dto.tags;
                delete dto.geolocalizacao;

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

                const iniciativa = await prismaTx.iniciativa.create({
                    data: {
                        criado_por: user.id,
                        criado_em: now,
                        ...dto,
                    },
                    select: { id: true },
                });

                await prismaTx.iniciativaOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(iniciativa.id, op),
                });

                await prismaTx.iniciativaResponsavel.createMany({
                    data: await this.buildIniciativaResponsaveis(iniciativa.id, op, cp),
                });

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

    private async loadMetaOrThrow(tipo: TipoPdm, meta_id: number, user: PessoaFromJwt) {
        const meta = await this.metaService.findAll(tipo, { id: meta_id }, user);
        if (!meta) {
            throw new HttpException('meta_id| Meta não encontrada', 400);
        }
        return meta;
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

    async findAll(tipo: TipoPdm, filters: FilterIniciativaDto | undefined = undefined, user: PessoaFromJwt) {
        const meta_id = filters?.meta_id;

        const metaFilterSet = await this.metaService.getMetaFilterSet(tipo, user);

        const listActive = await this.prisma.iniciativa.findMany({
            where: {
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
            },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.iniciativa_id = listActive.map((r) => r.id);
        const geolocalizacao = await this.metaService.geolocService.carregaReferencias(geoDto);

        const tags: MetaIniAtvTag[] = [];
        const ret: Iniciativa[] = [];
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

            ret.push({
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
            });
        }

        return ret;
    }

    async update(tipo: TipoPdm, id: number, dto: UpdateIniciativaDto, user: PessoaFromJwt) {
        const self = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id, meta: { pdm: { tipo } }, removido_em: null },
            select: { meta_id: true },
        });

        await this.metaService.assertMetaWriteOrThrow(tipo, self.meta_id, user, 'iniciativa');

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const op = dto.orgaos_participantes!;
            const cp = dto.coordenadores_cp!;
            const tags = dto.tags!;
            const geolocalizacao = dto.geolocalizacao;
            delete dto.orgaos_participantes;
            delete dto.coordenadores_cp;
            delete dto.tags;
            delete dto.geolocalizacao;

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

            const iniciativa = await prismaTx.iniciativa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    status: '',
                    ativo: true,
                    ...dto,
                },
                select: { id: true },
            });
            await Promise.all([
                prismaTx.iniciativaOrgao.deleteMany({ where: { iniciativa_id: id } }),
                prismaTx.iniciativaResponsavel.deleteMany({ where: { iniciativa_id: id } }),
                prismaTx.iniciativaTag.deleteMany({ where: { iniciativa_id: id } }),
            ]);

            await Promise.all([
                prismaTx.iniciativaOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(iniciativa.id, op),
                }),
                prismaTx.iniciativaResponsavel.createMany({
                    data: await this.buildIniciativaResponsaveis(iniciativa.id, op, cp),
                }),
                prismaTx.iniciativaTag.createMany({
                    data: await this.buildIniciativaTags(iniciativa.id, tags),
                }),
            ]);

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

    async remove(tipo: TipoPdm, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id, removido_em: null },
            select: {
                meta_id: true,
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
