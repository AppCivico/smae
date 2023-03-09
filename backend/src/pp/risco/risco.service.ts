import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, ProjetoFase, ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { CreateProjetoRiscoTarefaDto, CreateProjetoRiscoTarefaPlanoAcaoDto, CreateRiscoDto } from './dto/create-risco.dto';
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
                        },

                        PlanoAcao: {
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
                },
            }
        });
        if (!projetoRisco) throw new HttpException('Não foi possível encontrar o Risco', 400);

        return {
            ...projetoRisco,
            etapas_afetadas: projetoRisco?.RiscoTarefa.map(r => {
                return {
                    tarefa_id: r.tarefa.id,
                    tarefa: r.tarefa.tarefa,

                    planos_de_acao: r.PlanoAcao.map(pa => {
                        return {
                            ...pa
                        }
                    })
                }
            })
        }
    }

    async createProjetoRiscoTarefa(projeto_id: number, risco_id: number, dto: CreateProjetoRiscoTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id,
                id: risco_id
            }
        });
        if (!projeto_risco) throw new HttpException('Risco| inválido', 400);
        
        return await this.prisma.riscoTarefa.create({
            data: {
                projeto_risco_id: risco_id,
                tarefa_id: dto.tarefa_id
            },
            select: {id: true}
        });
    }

    async createProjetoRiscoTarefaPlanoAcao(projeto_id: number, risco_id: number, projeto_risco_tarefa_id: number, dto: CreateProjetoRiscoTarefaPlanoAcaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto_risco = await this.prisma.projetoRisco.findFirst({
            where: {
                projeto_id,
                id: risco_id
            }
        });
        if (!projeto_risco) throw new HttpException('Risco| inválido', 400);
        
        const projeto_risco_tarefa = await this.prisma.riscoTarefa.findFirst({
            where: {
                projeto_risco_id: risco_id,
                id: projeto_risco_tarefa_id
            }
        });
        if (!projeto_risco_tarefa) throw new HttpException('Risco Tarefa| inválida', 400);

        return await this.prisma.planoAcao.create({
            data: {
                ...dto,
                risco_tarefa_id: projeto_risco_tarefa_id
            }
        })

    }
}
