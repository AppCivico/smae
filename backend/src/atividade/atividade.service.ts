import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { VariavelService } from 'src/variavel/variavel.service';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { AtividadeOrgaoParticipante, CreateAtividadeDto } from './dto/create-atividade.dto';
import { FilterAtividadeDto } from './dto/filter-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';
import { Atividade, AtividadeOrgao, IdNomeExibicao } from './entities/atividade.entity';

@Injectable()
export class AtividadeService {
    private readonly logger = new Logger(AtividadeService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly variavelService: VariavelService
    ) { }

    async create(createAtividadeDto: CreateAtividadeDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP
        // e se os *tema_id são do mesmo PDM
        // se existe pelo menos 1 responsável=true no op

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let op = createAtividadeDto.orgaos_participantes!;
            let cp = createAtividadeDto.coordenadores_cp!;
            delete createAtividadeDto.orgaos_participantes;
            delete createAtividadeDto.coordenadores_cp;

            let tags = createAtividadeDto.tags || [];
            delete createAtividadeDto.tags;

            if (createAtividadeDto.ativo) {
                const iniciativaAtivaCount = await prisma.iniciativa.count({
                    where: {
                        id: createAtividadeDto.iniciativa_id,
                        ativo: true
                    }
                });

                if (iniciativaAtivaCount === 0)
                    throw new Error('Iniciativa está desativada, ative-a antes de criar uma Atividade ativa')
            }

            const atividade = await prisma.atividade.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createAtividadeDto,
                },
                select: { id: true }
            });

            await prisma.atividadeOrgao.createMany({
                data: await this.buildOrgaosParticipantes(atividade.id, op),
            });

            await prisma.atividadeResponsavel.createMany({
                data: await this.buildAtividadeResponsaveis(atividade.id, op, cp),
            });

            await prisma.atividadeTag.createMany({
                data: await this.buildAtividadeTags(atividade.id, tags)
            });

            return atividade;
        });

        return created;
    }

    async buildAtividadeTags(atividadeId: number, tags: number[]): Promise<Prisma.AtividadeTagCreateManyInput[]> {
        const arr: Prisma.AtividadeTagCreateManyInput[] = [];

        if (typeof tags !== 'object') {
            tags = []
        }

        for (const tag of tags) {
            arr.push({
                atividade_id: atividadeId,
                tag_id: tag
            })
        }

        return arr;
    }

    async buildOrgaosParticipantes(atividadeId: number, orgaos_participantes: MetaOrgaoParticipante[]): Promise<Prisma.AtividadeOrgaoCreateManyInput[]> {
        const arr: Prisma.AtividadeOrgaoCreateManyInput[] = [];

        let orgaoVisto: Record<number, boolean> = {};
        // ordena por responsáveis primeiro
        orgaos_participantes.sort((a, b) => {
            return a.responsavel && !b.responsavel ? -1 :
                a.responsavel && !b.responsavel ? 0 : 1;
        });

        for (const orgao of orgaos_participantes) {
            if (!orgaoVisto[orgao.orgao_id]) {
                orgaoVisto[orgao.orgao_id] = true;

                arr.push({
                    orgao_id: orgao.orgao_id,
                    responsavel: orgao.responsavel,
                    atividade_id: atividadeId
                });
            }
        }

        return arr;
    }
    async buildAtividadeResponsaveis(atividadeId: number, orgaos_participantes: AtividadeOrgaoParticipante[], coordenadores_cp: number[]): Promise<Prisma.AtividadeResponsavelCreateManyInput[]> {
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
                    id: CoordenadoriaParticipanteId
                },
                select: {
                    pessoa_fisica: { select: { orgao_id: true } }
                }
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

    async findAll(filters: FilterAtividadeDto | undefined = undefined) {
        let iniciativa_id = filters?.iniciativa_id;

        let cond;
        if (iniciativa_id) {
            cond = {
                removido_em: null,
                iniciativa_id: iniciativa_id
            }
        } else {
            cond = { removido_em: null }
        }

        let listActive = await this.prisma.atividade.findMany({
            where: cond,
            orderBy: [
                { codigo: 'asc' },
            ],
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
                        orgao: { select: { id: true, descricao: true } },
                        responsavel: true
                    }
                },
                atividade_responsavel: {
                    select: {
                        orgao: { select: { id: true, descricao: true } },
                        pessoa: { select: { id: true, nome_exibicao: true } },
                        coordenador_responsavel_cp: true,
                    }
                }
            }
        });

        let ret: Atividade[] = [];
        for (const dbAtividade of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, AtividadeOrgao> = {};

            for (const orgao of dbAtividade.atividade_orgao) {
                orgaos[orgao.orgao.id] = {
                    orgao: orgao.orgao,
                    responsavel: orgao.responsavel,
                    participantes: []
                };
            }

            for (const responsavel of dbAtividade.atividade_responsavel) {
                if (responsavel.coordenador_responsavel_cp) {
                    coordenadores_cp.push({
                        id: responsavel.pessoa.id,
                        nome_exibicao: responsavel.pessoa.nome_exibicao,
                    })
                } else {
                    let orgao = orgaos[responsavel.orgao.id];
                    orgao.participantes.push(responsavel.pessoa);
                }
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
                ativo: dbAtividade.ativo
            })
        }

        return ret;
    }

    async update(id: number, updateAtividadeDto: UpdateAtividadeDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let op = updateAtividadeDto.orgaos_participantes!;
            let cp = updateAtividadeDto.coordenadores_cp!;
            delete updateAtividadeDto.orgaos_participantes;
            delete updateAtividadeDto.coordenadores_cp;

            let tags = updateAtividadeDto.tags!;
            delete updateAtividadeDto.tags;

            if (updateAtividadeDto.ativo) {
                const atividade = await prisma.atividade.findFirst({
                    where: {
                        id: id
                    },
                    select: {
                        iniciativa: {
                            select: { ativo: true }
                        }
                    }
                })

                if (!atividade?.iniciativa.ativo)
                    throw new Error('Iniciativa está desativada, ative-a antes de ativar a Atividade')
            }

            const atividade = await prisma.atividade.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    status: '',
                    ativo: true,
                    ...updateAtividadeDto,
                },
                select: { id: true }
            });
            await Promise.all([
                prisma.atividadeOrgao.deleteMany({ where: { atividade_id: id } }),
                prisma.atividadeResponsavel.deleteMany({ where: { atividade_id: id } }),
                prisma.atividadeTag.deleteMany({ where: { atividade_id: id } }),

            ]);

            await Promise.all([
                prisma.atividadeOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(atividade.id, op),
                }),
                prisma.atividadeResponsavel.createMany({
                    data: await this.buildAtividadeResponsaveis(atividade.id, op, cp),
                }),
                prisma.atividadeTag.createMany({
                    data: await this.buildAtividadeTags(atividade.id, tags)
                })
            ]);

            const indicador = await prisma.indicador.findFirst({
                where: {
                    removido_em: null,
                    atividade_id: atividade.id
                },
                select: {
                    id: true,
                    iniciativa_id: true,
                    atividade_id: true,
                    meta_id: true,
                    IndicadorVariavel: {
                        where: { desativado: false },
                        select: { variavel_id: true }
                    }
                }
            });

            if (!indicador) {
                this.logger.log('não há indicador para a atividade')
            } else {
                for (const variavel of indicador.IndicadorVariavel) {
                    await this.variavelService.resyncIndicadorVariavel(indicador, variavel.variavel_id, prisma)
                }
            }

            return atividade;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.atividade.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

}
