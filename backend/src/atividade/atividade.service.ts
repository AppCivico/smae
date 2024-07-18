import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TipoPdm } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { AtividadeOrgaoParticipante, CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { Atividade, AtividadeOrgao } from './entities/atividade.entity';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { IdNomeExibicaoDto } from '../common/dto/IdNomeExibicao.dto';
import { GeoLocService } from '../geo-loc/geo-loc.service';
import { CreateGeoEnderecoReferenciaDto, ReferenciasValidasBase } from '../geo-loc/entities/geo-loc.entity';
import { MetaService } from '../meta/meta.service';

@Injectable()
export class AtividadeService {
    private readonly logger = new Logger(AtividadeService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly metaService: MetaService,
        private readonly variavelService: VariavelService,
        private readonly cronogramaEtapaService: CronogramaEtapaService,
        private readonly geolocService: GeoLocService
    ) {}

    async create(tipo: TipoPdm, dto: CreateAtividadeDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP
        // e se os *tema_id são do mesmo PDM
        // se existe pelo menos 1 responsável=true no op

        const iniciativa = await this.prisma.iniciativa.findFirstOrThrow({
            where: { id: dto.iniciativa_id, removido_em: null },
            select: { meta_id: true },
        });
        await this.loadMetaOrThrow(tipo, iniciativa.meta_id, user);

        if (!user.hasSomeRoles([tipo == 'PDM' ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
            const metas = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            const filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
            if (filterIdIn.includes(dto.iniciativa_id) === false)
                throw new HttpException(
                    'Sem permissão para criar atividade nesta iniciativa (por não ter também permissão da meta)',
                    400
                );
        }

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const orgaos_participantes = dto.orgaos_participantes;
                const coordenadores_cp = dto.coordenadores_cp;
                const tags = dto.tags;

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

                await prismaTx.atividadeOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(atividade.id, orgaos_participantes),
                });

                await prismaTx.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, orgaos_participantes, coordenadores_cp),
                });

                await prismaTx.atividadeTag.createMany({
                    data: await this.buildAtividadeTags(atividade.id, tags),
                });

                const geoDto = new CreateGeoEnderecoReferenciaDto();
                geoDto.atividade_id = atividade.id;
                geoDto.tokens = dto.geolocalizacao;
                geoDto.tipo = 'Endereco';

                await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);

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

        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles([tipo == 'PDM' ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
            let metas: number[];
            if (user.hasSomeRoles([tipo == 'PDM' ? 'PDM.ponto_focal' : 'PS.ponto_focal'])) {
                metas = await user.getMetaIdsFromAnyModel(this.prisma.view_atividade_pessoa_responsavel);
            } else {
                metas = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
                // Maybe TODO: assim como na atividade, conferir se não era melhor verificar era responsavel na iniciativa
                // aqui em teoria são os acessos dos técnicos
            }

            filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
        }

        const listActive = await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                iniciativa: { meta: { pdm: { tipo } } },
                AND: [{ iniciativa_id: iniciativa_id }, { iniciativa_id: filterIdIn ? { in: filterIdIn } : undefined }],
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
            },
        });

        const geoDto = new ReferenciasValidasBase();
        geoDto.iniciativa_id = listActive.map((r) => r.id);
        const geolocalizacao = await this.geolocService.carregaReferencias(geoDto);

        const ret: Atividade[] = [];
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

                const cronogramaEtapaRet = await this.cronogramaEtapaService.findAll({ cronograma_id: cronogramaId });
                cronogramaAtraso = {
                    id: cronogramaId,
                    atraso_grau: await this.cronogramaEtapaService.getAtrasoMaisSevero(cronogramaEtapaRet),
                };
            }

            ret.push({
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

        await this.loadMetaOrThrow(tipo, self.iniciativa.meta_id, user);
        if (!user.hasSomeRoles([tipo == 'PDM' ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
            const metas = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            const filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
            if (filterIdIn.includes(self.iniciativa_id) === false)
                throw new HttpException(
                    'Sem permissão para editar atividade nesta iniciativa (por não ter também permissão da meta)',
                    400
                );
        }
        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const orgaos_participantes = dto.orgaos_participantes;
            const coordenadores_cp = dto.coordenadores_cp;
            const tags = dto.tags;

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

            if (dto.ativo) {
                const atividade = await prismaTx.atividade.findFirst({
                    where: {
                        id: id,
                    },
                    select: {
                        iniciativa: {
                            select: { ativo: true },
                        },
                    },
                });

                if (!atividade?.iniciativa.ativo)
                    throw new BadRequestException('Iniciativa está desativada, ative-a antes de ativar a Atividade');
            }

            const atividade = await prismaTx.atividade.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    status: '',
                    ativo: true,
                    codigo: dto.codigo,
                    titulo: dto.titulo,
                    contexto: dto.contexto,
                    complemento: dto.complemento,
                    compoe_indicador_iniciativa: dto.compoe_indicador_iniciativa,
                },
                select: { id: true },
            });
            await Promise.all([
                prismaTx.atividadeOrgao.deleteMany({ where: { atividade_id: id } }),
                prismaTx.atividadeResponsavel.deleteMany({ where: { atividade_id: id } }),
                prismaTx.atividadeTag.deleteMany({ where: { atividade_id: id } }),
            ]);

            await Promise.all([
                prismaTx.atividadeOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(atividade.id, orgaos_participantes),
                }),
                prismaTx.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, orgaos_participantes, coordenadores_cp),
                }),
                prismaTx.atividadeTag.createMany({
                    data: await this.buildAtividadeTags(atividade.id, tags),
                }),
            ]);

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

                await this.geolocService.upsertGeolocalizacao(geoDto, user, prismaTx, now);
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
                        meta_id: true,
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

        await this.loadMetaOrThrow(tipo, self.iniciativa.meta_id, user);

        if (!user.hasSomeRoles([tipo == 'PDM' ? 'CadastroMeta.inserir' : 'CadastroMetaPS.inserir'])) {
            const metas = await user.getMetaIdsFromAnyModel(this.prisma.view_meta_pessoa_responsavel_na_cp);
            const filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
            if (filterIdIn.includes(self.iniciativa_id) === false)
                throw new HttpException(
                    'Sem permissão para remover atividade nesta iniciativa (por não ter também permissão da meta)',
                    400
                );
        }

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

    private async loadMetaOrThrow(tipo: TipoPdm, meta_id: number, user: PessoaFromJwt) {
        const meta = await this.metaService.findAll(tipo, { id: meta_id }, user);
        if (!meta) {
            throw new HttpException('meta_id| Meta não encontrada', 400);
        }
        return meta;
    }
}
