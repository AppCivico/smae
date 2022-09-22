import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIniciativaDto } from './dto/create-iniciativa.dto';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { IdNomeExibicao, Iniciativa, MetaOrgao } from './entities/iniciativa.entity';

@Injectable()
export class IniciativaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createIniciativaDto: CreateIniciativaDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP
        // e se os *tema_id são do mesmo PDM
        // se existe pelo menos 1 responsável=true no op

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let op = createIniciativaDto.orgaos_participantes!;
            let cp = createIniciativaDto.coordenadores_cp!;
            delete createIniciativaDto.orgaos_participantes;
            delete createIniciativaDto.coordenadores_cp;


            const iniciativa = await prisma.iniciativa.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createIniciativaDto,
                },
                select: { id: true }
            });

            await prisma.metaOrgao.createMany({
                data: await this.buildOrgaosParticipantes(createIniciativaDto.meta_id, op),
            });

            await prisma.metaResponsavel.createMany({
                data: await this.buildMetaResponsaveis(createIniciativaDto.meta_id, op, cp),
            });

            return iniciativa;
        });

        return created;
    }

    async buildOrgaosParticipantes(metaId: number, orgaos_participantes: MetaOrgaoParticipante[]): Promise<Prisma.MetaOrgaoCreateManyInput[]> {
        const arr: Prisma.MetaOrgaoCreateManyInput[] = [];

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
                    meta_id: metaId
                });
            }
        }

        return arr;
    }

    async buildMetaResponsaveis(metaId: number, orgaos_participantes: MetaOrgaoParticipante[], coordenadores_cp: number[]): Promise<Prisma.MetaResponsavelCreateManyInput[]> {
        const arr: Prisma.MetaResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participanteId of orgao.participantes) {
                arr.push({
                    meta_id: metaId,
                    pessoa_id: participanteId,
                    orgao_id: orgao.orgao_id,
                    coorderandor_responsavel_cp: false,
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
                    meta_id: metaId,
                    pessoa_id: CoordenadoriaParticipanteId,
                    orgao_id: orgaoId,
                    coorderandor_responsavel_cp: true,
                });

            }

        }

        return arr;
    }

    async findAll(filters: FilterIniciativaDto | undefined = undefined) {
        // let meta_id = filters?.meta_id | undefined;

        let listActive = await this.prisma.iniciativa.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [
                { codigo: 'asc' },
            ],
            select: {
                id: true,
                titulo: true,
                codigo: true,
                descricao: true,
                meta_id: true,
                status: true,
                meta: {
                    select: {
                        meta_orgao: {
                            select: {
                                orgao: { select: { id: true, descricao: true } },
                                responsavel: true
                            }
                        },
                        meta_responsavel: {
                            select: {
                                orgao: { select: { id: true, descricao: true } },
                                pessoa: { select: { id: true, nome_exibicao: true } },
                                coorderandor_responsavel_cp: true,
                            }
                        }
                    }
                }
            }
        });

        let ret: Iniciativa[] = [];
        for (const dbIniciativa of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, MetaOrgao> = {};

            for (const orgao of dbIniciativa.meta.meta_orgao) {
                orgaos[orgao.orgao.id] = {
                    orgao: orgao.orgao,
                    responsavel: orgao.responsavel,
                    participantes: []
                };
            }

            for (const responsavel of dbIniciativa.meta.meta_responsavel) {
                if (responsavel.coorderandor_responsavel_cp) {
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
                id: dbIniciativa.id,
                titulo: dbIniciativa.titulo,
                codigo: dbIniciativa.codigo,
                descricao: dbIniciativa.descricao,
                meta_id: dbIniciativa.meta_id,
                status: dbIniciativa.status,
                coordenadores_cp: coordenadores_cp,
                orgaos_participantes: Object.values(orgaos),
            })
        }

        return ret;
    }

}
