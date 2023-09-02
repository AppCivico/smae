import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { PrismaService } from '../prisma/prisma.service';
import { VariavelService } from '../variavel/variavel.service';
import { AtividadeOrgaoParticipante, CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { Atividade, AtividadeOrgao, IdNomeExibicao } from './entities/atividade.entity';
import { CronogramaAtrasoGrau } from 'src/common/dto/CronogramaAtrasoGrau.dto';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';

@Injectable()
export class AtividadeService {
    private readonly logger = new Logger(AtividadeService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly variavelService: VariavelService,
        private readonly cronogramaEtapaService: CronogramaEtapaService
    ) {}

    async create(createAtividadeDto: CreateAtividadeDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP
        // e se os *tema_id são do mesmo PDM
        // se existe pelo menos 1 responsável=true no op

        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            const metas = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            const filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
            if (filterIdIn.includes(createAtividadeDto.iniciativa_id) === false)
                throw new HttpException(
                    'Sem permissão para criar atividade nesta iniciativa (por não ter também permissão da meta)',
                    400
                );
        }

        const created = await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
                const op = createAtividadeDto.orgaos_participantes!;
                const cp = createAtividadeDto.coordenadores_cp!;
                delete createAtividadeDto.orgaos_participantes;
                delete createAtividadeDto.coordenadores_cp;

                const tags = createAtividadeDto.tags || [];
                delete createAtividadeDto.tags;

                const codigoJaEmUso = await prisma.atividade.count({
                    where: {
                        removido_em: null,
                        codigo: { equals: createAtividadeDto.codigo, mode: 'insensitive' },
                        iniciativa_id: createAtividadeDto.iniciativa_id,
                    },
                });
                if (codigoJaEmUso > 0)
                    throw new HttpException('codigo| Já existe atividade com este código nesta iniciativa', 400);

                const tituloJaEmUso = await prisma.atividade.count({
                    where: {
                        removido_em: null,
                        titulo: { equals: createAtividadeDto.titulo, mode: 'insensitive' },
                        iniciativa_id: createAtividadeDto.iniciativa_id,
                    },
                });
                if (tituloJaEmUso > 0)
                    throw new HttpException('titulo| Já existe atividade com este título nesta iniciativa', 400);

                if (createAtividadeDto.ativo) {
                    const iniciativaAtivaCount = await prisma.iniciativa.count({
                        where: {
                            id: createAtividadeDto.iniciativa_id,
                            ativo: true,
                        },
                    });

                    if (iniciativaAtivaCount === 0)
                        throw new Error('Iniciativa está desativada, ative-a antes de criar uma Atividade ativa');
                }

                const atividade = await prisma.atividade.create({
                    data: {
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        ...createAtividadeDto,
                    },
                    select: { id: true },
                });

                await prisma.atividadeOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(atividade.id, op),
                });

                await prisma.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, op, cp),
                });

                await prisma.atividadeTag.createMany({
                    data: await this.buildAtividadeTags(atividade.id, tags),
                });

                return atividade;
            }
        );

        return created;
    }

    async buildAtividadeTags(atividadeId: number, tags: number[]): Promise<Prisma.AtividadeTagCreateManyInput[]> {
        const arr: Prisma.AtividadeTagCreateManyInput[] = [];

        if (typeof tags !== 'object') {
            tags = [];
        }

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
        orgaos_participantes: MetaOrgaoParticipante[]
    ): Promise<Prisma.AtividadeOrgaoCreateManyInput[]> {
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
        orgaos_participantes: AtividadeOrgaoParticipante[],
        coordenadores_cp: number[]
    ): Promise<Prisma.AtividadeResponsavelCreateManyInput[]> {
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

    async findAll(filters: FilterAtividadeDto | undefined = undefined, user: PessoaFromJwt) {
        const iniciativa_id = filters?.iniciativa_id;

        let filterIdIn: undefined | number[] = undefined;
        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            const metas = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
            filterIdIn = (
                await this.prisma.iniciativa.findMany({
                    where: { removido_em: null, meta_id: { in: metas } },
                })
            ).map((r) => r.id);
        }

        const listActive = await this.prisma.atividade.findMany({
            where: {
                removido_em: null,
                AND: [
                    { iniciativa_id: iniciativa_id ? iniciativa_id : undefined },
                    { iniciativa_id: filterIdIn ? { in: filterIdIn } : undefined },
                ],
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

        const ret: Atividade[] = [];
        for (const dbAtividade of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
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
            });
        }

        return ret;
    }

    async update(id: number, updateAtividadeDto: UpdateAtividadeDto, user: PessoaFromJwt) {
        const self = await this.prisma.atividade.findFirstOrThrow({ where: { id }, select: { iniciativa_id: true } });

        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            const metas = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
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

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const op = updateAtividadeDto.orgaos_participantes!;
            const cp = updateAtividadeDto.coordenadores_cp!;
            delete updateAtividadeDto.orgaos_participantes;
            delete updateAtividadeDto.coordenadores_cp;

            const tags = updateAtividadeDto.tags!;
            delete updateAtividadeDto.tags;

            if (updateAtividadeDto.codigo) {
                const codigoJaEmUso = await prismaTx.atividade.count({
                    where: {
                        codigo: { equals: updateAtividadeDto.codigo, mode: 'insensitive' },
                        id: { not: id },
                        removido_em: null,
                        iniciativa_id: self.iniciativa_id,
                    },
                });
                if (codigoJaEmUso)
                    throw new HttpException('codigo| Já existe outra atividade com este código nesta iniciativa', 400);
            }

            if (updateAtividadeDto.titulo) {
                const tituloJaEmUso = await prismaTx.atividade.count({
                    where: {
                        id: { not: id },
                        removido_em: null,
                        titulo: { equals: updateAtividadeDto.titulo, mode: 'insensitive' },
                        iniciativa_id: self.iniciativa_id,
                    },
                });
                if (tituloJaEmUso > 0)
                    throw new HttpException('titulo| Já existe outra atividade com este título nesta iniciativa', 400);
            }

            if (updateAtividadeDto.ativo) {
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
                    throw new Error('Iniciativa está desativada, ative-a antes de ativar a Atividade');
            }

            const atividade = await prismaTx.atividade.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    status: '',
                    ativo: true,
                    ...updateAtividadeDto,
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
                    data: await this.buildOrgaosParticipantes(atividade.id, op),
                }),
                prismaTx.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, op, cp),
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
                    iniciativa_id: true,
                    atividade_id: true,
                    meta_id: true,
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
                    await this.variavelService.resyncIndicadorVariavel(indicador, variavel.variavel_id, prismaTx);
                }
            }

            return atividade;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const self = await this.prisma.atividade.findFirstOrThrow({
            where: { id },
            select: {
                iniciativa_id: true,
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

        if (!user.hasSomeRoles(['CadastroMeta.inserir'])) {
            const metas = await user.getMetasOndeSouResponsavel(this.prisma.metaResponsavel);
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
            let has_vars_in_use: boolean = false;

            for (const indicador of self.Indicador) {
                if (indicador.IndicadorVariavel.length > 0) has_vars_in_use = true;

                if (has_vars_in_use == true)
                    throw new HttpException(
                        'Atividade possui variáveis em uso pela Iniciativa e Meta, desative o campo de "Compõe indicador da Iniciativa" para remover a Atividade',
                        400
                    );
            }
        }

        return await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient): Promise<Prisma.BatchPayload> => {
                const removed = await prisma.atividade.updateMany({
                    where: { id: id },
                    data: {
                        removido_por: user.id,
                        removido_em: new Date(Date.now()),
                    },
                });

                // Caso a Atividade seja removida, é necessário remover relacionamentos com PainelConteudoDetalhe
                // public.painel_conteudo_detalhe
                await prisma.painelConteudoDetalhe.deleteMany({ where: { atividade_id: id } });

                return removed;
            }
        );
    }
}
