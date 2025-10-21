import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';
import { CampoVinculo, Prisma } from '@prisma/client';
import { FilterVinculoDto } from './dto/filter-vinculo.dto';
import { VinculoDto } from './entities/vinculo.entity';
import { uuidv7 } from 'uuidv7';

@Injectable()
export class VinculoService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: CreateVinculoDto | UpdateVinculoDto, user: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        if (id) {
            const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
                where: { id, removido_em: null },
                select: { id: true },
            });
            if (!self) throw new HttpException('Vínculo não encontrado', 404);
        } else {
            // Verificações de criação
            const createDto = dto as CreateVinculoDto;

            // Precisa ter projeto ou meta/iniciativa/atividade.
            if (!createDto.meta_id && !createDto.projeto_id && !createDto.iniciativa_id && !createDto.atividade_id)
                throw new HttpException('É necessário informar uma meta, projeto, iniciativa ou atividade', 400);

            // TODO: verificar se existe mais de uma col definida (meta/projeto/iniciativa/atividade) e bloquear.
        }

        const created = await this.prisma.distribuicaoRecursoVinculo.upsert({
            where: { id: id || 0 },
            create: {
                // Estes placeholders nunca serão utilizados, mas o Prisma obriga a definir valores para os campos (no caso de update, mesmo que aqui seja create)
                // Isso ocorre pois o DTO de update não tem todos os campos obrigatórios do create.
                // Mas como no DTO de criação, estes campos são obrigatórios, eles sempre estarão presentes.
                tipo_vinculo_id: (dto as CreateVinculoDto).tipo_vinculo_id ?? 0,
                distribuicao_id: (dto as CreateVinculoDto).distribuicao_id ?? 0,
                meta_id: (dto as CreateVinculoDto).meta_id ?? undefined,
                iniciativa_id: (dto as CreateVinculoDto).iniciativa_id ?? undefined,
                atividade_id: (dto as CreateVinculoDto).atividade_id ?? undefined,
                projeto_id: (dto as CreateVinculoDto).projeto_id ?? undefined,
                campo_vinculo: (dto as CreateVinculoDto).campo_vinculo ?? CampoVinculo.Endereco,
                valor_vinculo: (dto as CreateVinculoDto).valor_vinculo ?? '',
                observacao: (dto as CreateVinculoDto).observacao,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
            },
            update: {
                tipo_vinculo_id: (dto as UpdateVinculoDto).tipo_vinculo_id,
                observacao: (dto as UpdateVinculoDto).observacao,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterVinculoDto): Promise<VinculoDto[]> {
        const vinculos = await this.prisma.distribuicaoRecursoVinculo.findMany({
            where: {
                removido_em: null,
                tipo_vinculo_id: filters.tipo_vinculo_id,
                meta_id: filters.meta_id,
                projeto_id: filters.projeto_id,
                campo_vinculo: filters.campo_vinculo,
                distribuicao: {
                    id: filters.distribuicao_id,
                    transferencia_id: filters.transferencia_id,
                },
            },
            select: {
                id: true,
                tipo_vinculo: true,
                campo_vinculo: true,
                valor_vinculo: true,
                observacao: true,
                invalidado_em: true,
                motivo_invalido: true,

                distribuicao: {
                    select: {
                        id: true,
                        nome: true,
                        valor: true,
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                    },
                },

                meta: {
                    select: {
                        id: true,
                        titulo: true,
                        status: true,

                        meta_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },
                    },
                },

                iniciativa: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        status: true,
                        iniciativa_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },
                    },
                },

                atividade: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        status: true,
                        atividade_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },
                    },
                },

                projeto: {
                    select: {
                        id: true,
                        tipo: true,
                        nome: true,
                        status: true,
                        portfolio: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                        grupo_tematico: {
                            select: {
                                nome: true,
                            },
                        },
                        equipamento: {
                            select: {
                                nome: true,
                            },
                        },
                        tipo_intervencao: {
                            select: {
                                nome: true,
                            },
                        },
                        GeoEnderecoReferencia: {},
                    },
                },
            },
        });

        return vinculos.map((v) => ({
            id: v.id,
            distribuicao_recurso: {
                id: v.distribuicao.id,
                nome: v.distribuicao.nome,
                valor: v.distribuicao.valor,
                orgao: {
                    id: v.distribuicao.orgao_gestor.id,
                    sigla: v.distribuicao.orgao_gestor.sigla,
                    descricao: v.distribuicao.orgao_gestor.descricao,
                },
            },
            tipo_vinculo: {
                id: v.tipo_vinculo.id,
                nome: v.tipo_vinculo.nome,
            },
            campo_vinculo: v.campo_vinculo,
            valor_vinculo: v.valor_vinculo,
            observacao: v.observacao,
            meta: v.meta
                ? {
                      id: v.meta.id,
                      nome: v.meta.titulo,
                      status: v.meta.status,
                      orgao: {
                          id: v.meta.meta_orgao[0].orgao.id,
                          sigla: v.meta.meta_orgao[0].orgao.sigla,
                          descricao: v.meta.meta_orgao[0].orgao.descricao,
                      },
                  }
                : null,
            iniciativa: v.iniciativa
                ? {
                      id: v.iniciativa.id,
                      nome: v.iniciativa.titulo,
                      status: v.iniciativa.status,
                      orgao: {
                          id: v.iniciativa.iniciativa_orgao[0].orgao.id,
                          sigla: v.iniciativa.iniciativa_orgao[0].orgao.sigla,
                          descricao: v.iniciativa.iniciativa_orgao[0].orgao.descricao,
                      },
                  }
                : null,
            atividade: v.atividade
                ? {
                      id: v.atividade.id,
                      nome: v.atividade.titulo,
                      status: v.atividade.status,
                      orgao: {
                          id: v.atividade.atividade_orgao[0].orgao.id,
                          sigla: v.atividade.atividade_orgao[0].orgao.sigla,
                          descricao: v.atividade.atividade_orgao[0].orgao.descricao,
                      },
                  }
                : null,
            projeto: v.projeto
                ? {
                      id: v.projeto.id,
                      tipo: v.projeto.tipo,
                      nome: v.projeto.nome,
                      portfolio: {
                          id: v.projeto.portfolio.id,
                          nome: v.projeto.portfolio.titulo,
                      },
                      orgao: {
                          id: v.projeto.orgao_gestor.id,
                          sigla: v.projeto.orgao_gestor.sigla,
                          descricao: v.projeto.orgao_gestor.descricao,
                      },
                      status: v.projeto.status,
                  }
                : null,
            invalidado_em: v.invalidado_em,
            motivo_invalido: v.motivo_invalido,
            detalhes: {
                grupo_tematico_nome: v.projeto?.grupo_tematico?.nome ?? null,
                equipamento_nome: v.projeto?.equipamento?.nome ?? null,
                subprefeitura_nome: null,
                tipo_intervencao_nome: v.projeto?.tipo_intervencao?.nome ?? null,
            },
        }));
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
            where: { id, removido_em: null },
            select: { id: true },
        });
        if (!self) throw new HttpException('Vínculo não encontrado', 404);

        await this.prisma.distribuicaoRecursoVinculo.update({
            where: { id },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }

    async invalidarVinculo(
        {
            id,
            projeto_id,
            meta_id,
            atividade_id,
            iniciativa_id,
        }: { id?: number; projeto_id?: number; meta_id?: number; atividade_id?: number; iniciativa_id?: number },
        motivo_invalido: string,
        prismaTx?: Prisma.TransactionClient
    ): Promise<void> {
        const executarInvalidacao = async (prismaTx: Prisma.TransactionClient) => {
            // Permite apenas um dos filtros.
            const filtrosUsados = [id, projeto_id, meta_id, atividade_id, iniciativa_id].filter((f) => f !== undefined);
            if (filtrosUsados.length === 0)
                throw new InternalServerErrorException('É necessário informar ao menos um filtro para invalidação');
            if (filtrosUsados.length > 1)
                throw new InternalServerErrorException('Apenas um filtro deve ser informado para invalidação');

            await prismaTx.distribuicaoRecursoVinculo.updateMany({
                where: {
                    id,
                    projeto_id,
                    meta_id,
                    atividade_id,
                    iniciativa_id,
                },
                data: {
                    invalidado_em: new Date(Date.now()),
                    motivo_invalido,
                },
            });

            // Envio de e-mail notificando invalidação.
            /* await prismaTx.emaildbQueue.create({
                data: {
                    id: uuidv7(),
                    config_id: 1,
                    subject: ``,
                    template: '',
                    to: '',
                    variables: {
                        resposta: '',
                    },
                },
            }); */
        };

        if (prismaTx) {
            await executarInvalidacao(prismaTx);
        } else {
            await this.prisma.$transaction(executarInvalidacao);
        }
    }
}
