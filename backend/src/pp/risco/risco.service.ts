import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, StatusRisco } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { RiscoCalc } from 'src/common/RiscoCalc';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRiscoDto } from './dto/create-risco.dto';
import { UpdateRiscoDto } from './dto/update-risco.dto';
import { ProjetoRisco, ProjetoRiscoDetailDto } from './entities/risco.entity';

@Injectable()
export class RiscoService {
    private readonly logger = new Logger(RiscoService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreateRiscoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const calcResult = RiscoCalc.getResult(dto.probabilidade, dto.impacto);

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
                titulo: dto.titulo,
                consequencia: dto.consequencia,
                risco_tarefa_outros: dto.risco_tarefa_outros,

                nivel: calcResult.nivel,
                grau: calcResult.grau_valor,
                resposta: calcResult.resposta_descricao,

                criado_em: new Date(Date.now()),
                criado_por: user.id
            },
            select: { id: true }
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

        return { id: risco.id }
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<ProjetoRisco[]> {
        const projetoRisco = await this.prisma.projetoRisco.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null
            },
            orderBy: [{ codigo: 'asc' }],
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
                risco_tarefa_outros: true,
                status_risco: true,
                titulo: true,
            }
        });


        return projetoRisco.map(r => {
            let calcResult;
            if (r.probabilidade && r.impacto) calcResult = RiscoCalc.getResult(r.probabilidade, r.impacto);

            return {
                ...r,

                nivel: calcResult ? calcResult.nivel : null,
                grau: calcResult ? calcResult.grau_valor : null,
                resposta: calcResult ? calcResult.resposta_descricao : null
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
                titulo: true,
                risco_tarefa_outros: true,
                status_risco: true,
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
                        contato_do_responsavel: true,
                        data_termino: true,

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

        let calcResult;
        if (projetoRisco.probabilidade && projetoRisco.impacto) calcResult = RiscoCalc.getResult(projetoRisco.probabilidade, projetoRisco.impacto);

        return {
            ...projetoRisco,
            nivel: calcResult ? calcResult.nivel : null,
            grau: calcResult ? calcResult.grau_valor : null,
            resposta: calcResult ? calcResult.resposta_descricao : null,

            tarefas_afetadas: projetoRisco?.RiscoTarefa.map(r => {
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

                await prismaTx.riscoTarefa.deleteMany({ where: { projeto_risco_id: projeto_risco_id } });
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
                where: { id: projeto_risco_id },
                data: {
                    codigo: dto.codigo,
                    registrado_em: dto.registrado_em,
                    probabilidade: dto.probabilidade,
                    impacto: dto.impacto,
                    descricao: dto.descricao,
                    causa: dto.causa,
                    titulo: dto.titulo,
                    consequencia: dto.consequencia,
                    risco_tarefa_outros: dto.risco_tarefa_outros,
                    status_risco: dto.status,

                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id
                },
                select: { id: true }
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
