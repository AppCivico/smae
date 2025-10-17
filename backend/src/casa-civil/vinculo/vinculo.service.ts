import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';
import { CampoVinculo } from '@prisma/client';
import { FilterVinculoDto } from './dto/filter-vinculo.dto';
import { VinculoDto } from './entities/vinculo.entity';

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

            // Precisa ter meta ou projeto.
            if (!createDto.meta_id && !createDto.projeto_id)
                throw new HttpException('É necessário informar uma meta ou um projeto', 400);

            // Ao mesmo tempo, só pode ter um dos dois.
            if (createDto.meta_id && createDto.projeto_id)
                throw new HttpException('Só é possível informar uma meta ou um projeto, não ambos', 400);
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
            detalhes: {},
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
}
