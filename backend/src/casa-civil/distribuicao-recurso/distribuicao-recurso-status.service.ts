import { HttpException, Injectable } from '@nestjs/common';
import { DistribuicaoStatusTipo, Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateDistribuicaoRecursoStatusDto } from './dto/create-distribuicao-recurso-status.dto';
import { UpdateDistribuicaoRecursoStatusDto } from './dto/update-distribuicao-recurso-status.dto';
import { DateTime } from 'luxon';
import { DistribuicaoHistoricoStatusDto } from './entities/distribuicao-recurso.entity';
import { WorkflowService } from '../workflow/configuracao/workflow.service';
import { Date2YMD } from '../../common/date2ymd';

@Injectable()
export class DistribuicaoRecursoStatusService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async findAll(distribuicao_id: number, user: PessoaFromJwt): Promise<DistribuicaoHistoricoStatusDto[]> {
        const rows = await this.prisma.distribuicaoRecursoStatus.findMany({
            where: {
                distribuicao_id: distribuicao_id,
                removido_em: null,
            },
            orderBy: { data_troca: 'desc' },
            select: {
                id: true,
                data_troca: true,
                motivo: true,
                nome_responsavel: true,
                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
                status: {
                    select: {
                        id: true,
                        nome: true,
                        tipo: true,
                        permite_novos_registros: true,
                    },
                },
                status_base: {
                    select: {
                        id: true,
                        nome: true,
                        tipo: true,
                        permite_novos_registros: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                data_troca: Date2YMD.toString(r.data_troca),
                dias_no_status: Math.abs(Math.round(DateTime.fromJSDate(r.data_troca).diffNow('days').days)),
                motivo: r.motivo,
                nome_responsavel: r.nome_responsavel,
                orgao_responsavel: r.orgao_responsavel
                    ? {
                          id: r.orgao_responsavel.id,
                          sigla: r.orgao_responsavel.sigla,
                      }
                    : null,
                status_customizado: r.status
                    ? {
                          id: r.status.id,
                          nome: r.status.nome,
                          tipo: r.status.tipo,
                          status_base: false,
                      }
                    : null,
                status_base: r.status_base
                    ? {
                          id: r.status_base.id,
                          nome: r.status_base.nome,
                          tipo: r.status_base.tipo,
                          status_base: true,
                      }
                    : null,
            };
        });
    }

    async create(
        distribuicao_id: number,
        dto: CreateDistribuicaoRecursoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        if (dto.status_base_id == undefined && dto.status_id == undefined)
            throw new HttpException('É necessário enviar um ID de status.', 400);

        if (dto.status_base_id != undefined && dto.status_id != undefined)
            throw new HttpException('É permitido apenas um ID de status.', 400);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Verificando se tem status anterior e status anterior permite novas entradas.
                const statusAnterior = await prismaTx.distribuicaoRecursoStatus.findFirst({
                    where: {
                        removido_em: null,
                        distribuicao_id: distribuicao_id,
                    },
                    orderBy: { data_troca: 'desc' },
                    select: {
                        status_base: true,
                        status: true,
                    },
                });
                if (statusAnterior) {
                    const status_config = statusAnterior.status_base ?? statusAnterior.status;

                    if (!status_config!.permite_novos_registros)
                        throw new HttpException('Status atual não permite novos registros.', 400);
                }

                const distribuicaoRecursoStatus = await prismaTx.distribuicaoRecursoStatus.create({
                    data: {
                        distribuicao_id: distribuicao_id,
                        status_base_id: dto.status_base_id,
                        status_id: dto.status_id,
                        motivo: dto.motivo,
                        data_troca: dto.data_troca,
                        orgao_responsavel_id: dto.orgao_responsavel_id,
                        nome_responsavel: dto.nome_responsavel,
                        criado_por: user.id,
                    },
                    select: {
                        id: true,
                        distribuicao: {
                            select: {
                                transferencia_id: true,
                                transferencia: {
                                    select: {
                                        workflow_id: true,
                                    },
                                },
                                tarefas: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                });

                // Caso o status seja do tipo "ConcluidoComSucesso"
                // Então é necessário atualizar a tarefa no cronograma.
                if (distribuicaoRecursoStatus.distribuicao.transferencia.workflow_id) {
                    const workflowValido = await this.workflowService.configValida(
                        distribuicaoRecursoStatus.distribuicao.transferencia.workflow_id,
                        prismaTx
                    );

                    if (workflowValido) {
                        let statusNovo;
                        if (dto.status_id) {
                            statusNovo = await prismaTx.distribuicaoStatus.findFirstOrThrow({
                                where: { id: dto.status_id },
                                select: { tipo: true },
                            });
                        } else {
                            statusNovo = await prismaTx.distribuicaoStatusBase.findFirstOrThrow({
                                where: { id: dto.status_base_id },
                                select: { tipo: true },
                            });
                        }

                        if (statusNovo.tipo == DistribuicaoStatusTipo.ConcluidoComSucesso) {
                            await prismaTx.tarefa.updateMany({
                                where: { distribuicao_recurso_id: distribuicao_id },
                                data: {
                                    termino_real: new Date(Date.now()),
                                    atualizado_em: new Date(Date.now()),
                                },
                            });
                        }

                        if (statusNovo.tipo == DistribuicaoStatusTipo.Terminal) {
                            await prismaTx.tarefa.updateMany({
                                where: { distribuicao_recurso_id: distribuicao_id },
                                data: {
                                    removido_em: new Date(Date.now()),
                                    removido_por: user.id,
                                },
                            });
                        }
                    }
                }

                return { id: distribuicaoRecursoStatus.id };
            }
        );

        return { id: created.id };
    }

    async update(
        distribuicao_id: number,
        id: number,
        dto: UpdateDistribuicaoRecursoStatusDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            // Verificando se existe status mais novo. Ou seja, não pode editar.
            const self = await prismaTx.distribuicaoRecursoStatus.findFirstOrThrow({
                where: {
                    id: id,
                    distribuicao_id: distribuicao_id,
                    removido_em: null,
                },
                select: {
                    data_troca: true,
                },
            });

            const maisNovoExiste = await prismaTx.distribuicaoRecursoStatus.count({
                where: {
                    removido_em: null,
                    distribuicao_id: distribuicao_id,
                    data_troca: { gt: self.data_troca },
                },
            });
            if (maisNovoExiste)
                throw new HttpException('Status não pode ser atualizado, pois não é o status atual.', 400);

            await prismaTx.distribuicaoRecursoStatus.update({
                where: { id },
                data: {
                    motivo: dto.motivo,
                    data_troca: dto.data_troca,
                    orgao_responsavel_id: dto.orgao_responsavel_id,
                    nome_responsavel: dto.nome_responsavel,
                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                },
                select: {
                    id: true,
                },
            });

            return { id };
        });

        return { id };
    }

    async remove(distribuicao_id: number, id: number, user: PessoaFromJwt) {
        const exists = await this.prisma.distribuicaoRecursoStatus.findFirst({
            where: {
                id,
                distribuicao_id,
                removido_em: null,
            },
            select: { id: true },
        });
        if (!exists) return;

        await this.prisma.distribuicaoRecursoStatus.updateMany({
            where: {
                id,
                distribuicao_id,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }
}
