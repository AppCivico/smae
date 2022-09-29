import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIniciativaDto } from './dto/create-iniciativa.dto';
import { MetaOrgaoParticipante } from '../meta/dto/create-meta.dto';
import { FilterIniciativaDto } from './dto/filter-iniciativa.dto';
import { IdNomeExibicao, Iniciativa, IniciativaOrgao } from './entities/iniciativa.entity';
import { UpdateIniciativaDto } from './dto/update-iniciativa.dto';

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
            let tags = createIniciativaDto.tags!;
            delete createIniciativaDto.orgaos_participantes;
            delete createIniciativaDto.coordenadores_cp;
            delete createIniciativaDto.tags;


            const iniciativa = await prisma.iniciativa.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createIniciativaDto,
                },
                select: { id: true }
            });

            await prisma.iniciativaOrgao.createMany({
                data: await this.buildOrgaosParticipantes(iniciativa.id, op),
            });

            await prisma.iniciativaResponsavel.createMany({
                data: await this.buildIniciativaResponsaveis(iniciativa.id, op, cp),
            });

            await prisma.iniciativaTag.createMany({
                data: await this.buildIniciativaTags(iniciativa.id, tags)
            });

            return iniciativa;
        });

        return created;
    }

    async buildIniciativaTags(iniciativaId: number, tags: number[]): Promise<Prisma.IniciativaTagCreateManyInput[]> {
        const arr: Prisma.IniciativaTagCreateManyInput[] = [];

        for (const tag of tags) {
            arr.push({
                iniciativa_id: iniciativaId,
                tag_id: tag
            })
        }

        return arr;
    }

    async buildOrgaosParticipantes(iniciativaId: number, orgaos_participantes: MetaOrgaoParticipante[]): Promise<Prisma.IniciativaOrgaoCreateManyInput[]> {
        const arr: Prisma.IniciativaOrgaoCreateManyInput[] = [];

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
                    iniciativa_id: iniciativaId
                });
            }
        }

        return arr;
    }

    async buildIniciativaResponsaveis(iniciativaId: number, orgaos_participantes: MetaOrgaoParticipante[], coordenadores_cp: number[]): Promise<Prisma.IniciativaResponsavelCreateManyInput[]> {
        const arr: Prisma.IniciativaResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participanteId of orgao.participantes) {
                arr.push({
                    iniciativa_id: iniciativaId,
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
                    iniciativa_id: iniciativaId,
                    pessoa_id: CoordenadoriaParticipanteId,
                    orgao_id: orgaoId,
                    coordenador_responsavel_cp: true,
                });

            }

        }

        return arr;
    }

    async findAll(filters: FilterIniciativaDto | undefined = undefined) {
        let meta_id = filters?.meta_id;

        let cond;
        if (meta_id) {
            cond = {
                removido_em: null,
                meta_id: meta_id
            }
        } else {
            cond = { removido_em: null }
        }

        let listActive = await this.prisma.iniciativa.findMany({
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
                meta_id: true,
                status: true,
                iniciativa_orgao: {
                    select: {
                        orgao: { select: { id: true, descricao: true } },
                        responsavel: true
                    }
                },
                iniciativa_responsavel: {
                    select: {
                        orgao: { select: { id: true, descricao: true } },
                        pessoa: { select: { id: true, nome_exibicao: true } },
                        coordenador_responsavel_cp: true,
                    }
                }
            }
        });

        let ret: Iniciativa[] = [];
        for (const dbIniciativa of listActive) {
            const coordenadores_cp: IdNomeExibicao[] = [];
            const orgaos: Record<number, IniciativaOrgao> = {};

            for (const orgao of dbIniciativa.iniciativa_orgao) {
                orgaos[orgao.orgao.id] = {
                    orgao: orgao.orgao,
                    responsavel: orgao.responsavel,
                    participantes: []
                };
            }

            for (const responsavel of dbIniciativa.iniciativa_responsavel) {
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
                id: dbIniciativa.id,
                titulo: dbIniciativa.titulo,
                codigo: dbIniciativa.codigo,
                contexto: dbIniciativa.contexto,
                complemento: dbIniciativa.complemento,
                meta_id: dbIniciativa.meta_id,
                status: dbIniciativa.status,
                coordenadores_cp: coordenadores_cp,
                orgaos_participantes: Object.values(orgaos),
            })
        }

        return ret;
    }

    async update(id: number, updateIniciativaDto: UpdateIniciativaDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let op = updateIniciativaDto.orgaos_participantes!;
            let cp = updateIniciativaDto.coordenadores_cp!;
            let tags = updateIniciativaDto.tags!;
            delete updateIniciativaDto.orgaos_participantes;
            delete updateIniciativaDto.coordenadores_cp;
            delete updateIniciativaDto.tags;

            const iniciativa = await prisma.iniciativa.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    status: '',
                    ativo: true,
                    ...updateIniciativaDto,
                },
                select: { id: true }
            });
            await Promise.all([
                prisma.iniciativaOrgao.deleteMany({ where: { iniciativa_id: id } }),
                prisma.iniciativaResponsavel.deleteMany({ where: { iniciativa_id: id } }),
                prisma.iniciativaTag.deleteMany({ where: { iniciativa_id: id } })
            ]);

            await Promise.all([
                await prisma.iniciativaOrgao.createMany({
                    data: await this.buildOrgaosParticipantes(iniciativa.id, op),
                }),
                await prisma.iniciativaResponsavel.createMany({
                    data: await this.buildIniciativaResponsaveis(iniciativa.id, op, cp),
                }),
                await prisma.iniciativaTag.createMany({
                    data: await this.buildIniciativaTags(iniciativa.id, tags)
                })
            ]);

            return iniciativa;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.iniciativa.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

}
