import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus, StatusRisco } from '@prisma/client';
import { DateTime } from 'luxon';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CreateProjetoRiscoTarefaDto, CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { PlanoAcao } from '../plano-de-acao/entities/plano-acao.entity';
import { ProjetoRisco, ProjetoRiscoDetailDto } from './entities/risco.entity';

@Injectable()
export class RiscoService {
    private readonly logger = new Logger(RiscoService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreateRiscoDto, user: PessoaFromJwt): Promise<RecordWithId> {


        const risco = await this.prisma.projetoRisco.create({
            data: {
                projeto_id: projetoId,
                status_risco: StatusRisco.SemInformacao,

                codigo: dto.codigo,
                registrado_em: dto.registrado_em,
                probabilidade: dto.probabilidade,
                impacto: dto.impacto,
                descricao: dto.descricao,
                causa: dto.causa,
                consequencia: dto.consequencia,
                risco_tarefa_outros: dto.risco_tarefa_outros,

                criado_em: new Date(Date.now()),
                criado_por: user.id
            },
            select: {id: true}
        });

        if (dto.tarefa_id) {
            await this.prisma.riscoTarefa.createMany({
                data: dto.tarefa_id.map(t => {
                    return {
                        projeto_risco_id: risco.id,
                        tarefa_id: t
                    }
                })
            })
        }

        return {id: risco.id}
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<ProjetoRisco[]> {
        return await this.prisma.projetoRisco.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null
            },
            orderBy: [{codigo: 'asc'}],
            select: {
                id: true,
                codigo: true,
                registrado_em: true,
                descricao: true,
                causa: true,
                consequencia: true,
                probabilidade: true,
                impacto: true,
                nivel: true,
                grau: true,
                resposta: true,
            }
        })
    }

    async findOne(projetoId: number, riscoId: number, user: PessoaFromJwt): Promise<ProjetoRiscoDetailDto> {
        const projetoRisco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id: projetoId,
                id: riscoId,
                removido_em: null
            },
            select: {
                id: true,
                codigo: true,
                registrado_em: true,
                descricao: true,
                causa: true,
                consequencia: true,
                probabilidade: true,
                impacto: true,
                nivel: true,
                grau: true,
                resposta: true,

                RiscoTarefa: {
                    select: {
                        tarefa: {
                            select: {
                                id: true,
                                tarefa: true
                            }
                        }
                    }
                },

                planos_de_acao: {
                    select: {
                        id: true,
                        contramedida: true,
                        prazo_contramedida: true,
                        custo: true,
                        custo_percentual: true,
                        medidas_de_contingencia: true,
                        responsavel: true,

                        orgao: {
                            select: {
                                id: true,
                                sigla: true
                            }
                        }
                    }
                }
            }
        });
        if (!projetoRisco) throw new HttpException('Não foi possível encontrar o Risco', 400);

        return {
            ...projetoRisco,
            etapas_afetadas: projetoRisco?.RiscoTarefa.map(r => {
                return {
                    tarefa_id: r.tarefa.id,
                    tarefa: r.tarefa.tarefa,
                }
            }),

            planos_de_acao: projetoRisco.planos_de_acao.map(pa => {
                return {
                    ...pa
                }
            })
        }
    }

    async update(projeto_risco_id: number, dto: UpdateRiscoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            if (dto.tarefa_id) {
                const tarefa_id = dto.tarefa_id;
                delete dto.tarefa_id;

                await prismaTx.riscoTarefa.deleteMany({where: {projeto_risco_id: projeto_risco_id } });
                await prismaTx.riscoTarefa.createMany({
                    data: tarefa_id.map(r => {
                        return {
                            projeto_risco_id: projeto_risco_id,
                            tarefa_id: r
                        }
                    })
                });
            }
            
            return await this.prisma.projetoRisco.update({
                where: {id: projeto_risco_id},
                data: {
                    codigo: dto.codigo,
                    registrado_em: dto.registrado_em,
                    probabilidade: dto.probabilidade,
                    impacto: dto.impacto,
                    descricao: dto.descricao,
                    causa: dto.causa,
                    consequencia: dto.consequencia,
                    risco_tarefa_outros: dto.risco_tarefa_outros,
                    status_risco: dto.status,

                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id
                },
                select: {id: true}
            });
        });

        return updated;
    }

    async remove(projeto_id: number, projeto_risco_id: number, user: PessoaFromJwt) {
        return await this.prisma.projetoRisco.updateMany({
            where: {
                id: projeto_risco_id,
                projeto_id: projeto_id
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id
            }
        })
    }

}
