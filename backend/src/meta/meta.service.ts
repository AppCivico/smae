import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMetaDto, MetaOrgaoParticipante, MetaParticipanteOuResp } from './dto/create-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';

@Injectable()
export class MetaService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createMetaDto: CreateMetaDto, user: PessoaFromJwt) {
        // TODO: verificar se todos os membros de createMetaDto.coordenadores_cp estão ativos
        // e se tem o privilegios de CP

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            const meta = await prisma.meta.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    status: '',
                    ativo: true,
                    ...createMetaDto,
                },
                select: { id: true }
            });

            await prisma.metaOrgao.createMany({
                data: await this.buildOrgaosParticipantes(meta.id, createMetaDto.orgaos_participantes, createMetaDto.coordenadores_cp),
            });

            await prisma.metaResponsavel.createMany({
                data: await this.buildMetaResponsaveis(meta.id, createMetaDto.orgaos_participantes, createMetaDto.coordenadores_cp),
            });

            return meta;
        });

        return created;
    }

    async buildMetaResponsaveis(metaId: number, orgaos_participantes: MetaOrgaoParticipante[], coordenadores_cp: MetaParticipanteOuResp[]): Promise<Prisma.MetaResponsavelCreateManyInput[]> {
        const arr: Prisma.MetaResponsavelCreateManyInput[] = [];

        for (const orgao of orgaos_participantes) {
            for (const participante of orgao.participantes) {
                arr.push({
                    meta_id: metaId,
                    pessoa_id: participante.pessoa_id,
                    orgao_id: orgao.orgao_id,
                    coorderandor_responsavel_cp: false,
                });
            }
        }

        for (const participanteCoordenadoria of coordenadores_cp) {
            const pessoaFisicaOrgao = await this.prisma.pessoa.findFirst({
                where: {
                    id: participanteCoordenadoria.pessoa_id
                },
                select: {
                    pessoa_fisica: { select: { orgao_id: true } }
                }
            });

            const orgaoId = pessoaFisicaOrgao?.pessoa_fisica?.orgao_id;
            if (orgaoId) {
                arr.push({
                    meta_id: metaId,
                    pessoa_id: participanteCoordenadoria.pessoa_id,
                    orgao_id: orgaoId,
                    coorderandor_responsavel_cp: true,
                });

            }

        }

        return arr;
    }

    async buildOrgaosParticipantes(metaId: number, orgaos_participantes: MetaOrgaoParticipante[], coordenadores_cp: MetaParticipanteOuResp[]): Promise<Prisma.MetaOrgaoCreateManyInput[]> {
        const arr: Prisma.MetaOrgaoCreateManyInput[] = [];

        let orgaoVisto: Record<number, boolean> = {};
        // ordena por responsáveis primeiro
        orgaos_participantes.sort((a, b) => {
            return a.responsavel === 'true' && b.responsavel === 'false' ? -1 :
                a.responsavel === 'true' && b.responsavel === 'true' ? 0 : 1;
        });

        for (const orgao of orgaos_participantes) {
            if (!orgaoVisto[orgao.orgao_id]) {
                orgaoVisto[orgao.orgao_id] = true;

                arr.push({
                    orgao_id: orgao.orgao_id,
                    responsavel: orgao.responsavel === 'true',
                    meta_id: metaId
                });
            }
        }

        // buscar pelo orgão "implicito" via membros dos coordenadores_cp
        for (const coordenador of coordenadores_cp) {
            const pessoaFisicaOrgao = await this.prisma.pessoa.findFirst({
                where: {
                    id: coordenador.pessoa_id
                },
                select: {
                    pessoa_fisica: { select: { orgao_id: true } }
                }
            });

            const orgaoId = pessoaFisicaOrgao?.pessoa_fisica?.orgao_id;
            if (orgaoId) {
                if (!orgaoVisto[orgaoId]) {
                    orgaoVisto[orgaoId] = true;
                    arr.push({
                        orgao_id: orgaoId,
                        responsavel: false,// o coordenador nunca é o responśavel da meta
                        meta_id: metaId
                    });
                }
            }
        }

        return arr;
    }

    async findAll() {
        let listActive = await this.prisma.meta.findMany({
            where: {
                removido_em: null,
            },
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
        });
        return listActive;
    }

    async update(id: number, updateMetaDto: UpdateMetaDto, user: PessoaFromJwt) {

        await this.prisma.meta.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateMetaDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.meta.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return created;
    }
}
