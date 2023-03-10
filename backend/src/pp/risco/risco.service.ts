import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CreateProjetoRiscoPlanoAcaoDto, CreateProjetoRiscoTarefaDto, CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { PlanoAcao } from './entities/plano-acao.entity';
import { ProjetoRisco, ProjetoRiscoDetailDto } from './entities/risco.entity';

@Injectable()
export class RiscoService {
    private readonly logger = new Logger(RiscoService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreateRiscoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const risco = await this.prisma.projetoRisco.create({
            data: {
                projeto_id: projetoId,

                // TODO: calc do numero
                numero: 0,
                ...dto
            },
            select: {id: true}
        })

        return {id: risco.id}
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<ProjetoRisco[]> {
        return await this.prisma.projetoRisco.findMany({
            where: {projeto_id: projetoId},
            orderBy: [{codigo: 'asc'}],
            select: {
                id: true,
                codigo: true,
                numero: true,
                criado_em: true,
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
                id: riscoId
            },
            select: {
                id: true,
                codigo: true,
                numero: true,
                criado_em: true,
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
                        medidas_contrapartida: true,
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

    async update(projeto_id: number, dto: UpdateRiscoDto, user: PessoaFromJwt) {
        return await this.prisma.projetoRisco.update({
            where: {id: projeto_id},
            data: {
                ...dto
            },
            select: {id: true}
        });
    }

    async upsertProjetoRiscoTarefa(projeto_id: number, risco_id: number, dto: CreateProjetoRiscoTarefaDto, user: PessoaFromJwt) {
        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id,
                id: risco_id
            }
        });
        if (!projeto_risco) throw new HttpException('Risco| inválido', 400);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.riscoTarefa.deleteMany({ where: { projeto_risco_id: risco_id } });

            return await prismaTx.riscoTarefa.createMany({
                data: dto.tarefa_id.map(r => {
                    return {
                        projeto_risco_id: risco_id,
                        tarefa_id: r
                    }
                })
            })
        });

        return created.count;
    }

    async createProjetoRiscoPlanoAcao(projeto_id: number, risco_id: number, dto: CreateProjetoRiscoPlanoAcaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id,
                id: risco_id
            }
        });
        if (!projeto_risco) throw new HttpException('Risco| inválido', 400);

        return await this.prisma.planoAcao.create({
            data: {
                ...dto,
                status_risco: 'SemInformacao',
                risco_id: risco_id
            }
        });
    }

    async listProjetoRiscoPlanoAcao(projeto_id: number, risco_id: number, user: PessoaFromJwt): Promise<PlanoAcao[]> {
        return await this.prisma.planoAcao.findMany({
            where: {
                risco_id: risco_id
            },
            select: {
                id: true,
                contramedida: true,
                prazo_contramedida: true,
                custo: true,
                custo_percentual: true,
                medidas_contrapartida: true,
                status_risco: true,
            }
        });
    }
}
