import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { DateTime } from 'luxon';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { FilterWorkflowDto } from './dto/filter-workflow.dto';
import { WorkflowDto } from './entities/workflow.entity';

@Injectable()
export class WorkflowService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: {
                        id: dto.transferencia_tipo_id,
                        removido_em: null,
                    },
                });
                if (!transferenciaTipoExiste)
                    throw new HttpException('transferencia_tipo_id| Tipo de transferência não existe.', 400);

                // Tratando boolean de ativo.
                let ativo: boolean = false;
                const now = DateTime.now().startOf('day');

                // Se o início for =< now, ele é elegível para ser o ativo, mas deve ser verificado.
                if (DateTime.fromJSDate(dto.inicio) <= now) {
                    // Verificando se já existe um ativo.
                    const workflowAtivo = await prismaTxn.workflow.count({
                        where: {
                            ativo: true,
                            inicio: { lte: now.toJSDate() },
                            removido_em: null,
                            OR: [{ termino: { gt: now.toJSDate() } }, { termino: null }],
                        },
                    });

                    ativo = !workflowAtivo ?? true;
                }

                const workflow = await prismaTxn.workflow.create({
                    data: {
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        ativo: ativo,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await this.prisma.workflow.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        ativo: true,
                        inicio: true,
                        termino: true,
                        transferencia_tipo_id: true,
                    },
                });
                if (!self) throw new NotFoundException('Workflow não encontrado');

                if (dto.ativo != undefined && dto.ativo != self.ativo && dto.ativo == true) {
                    // Verificando se já não existe workflow ativo.
                    // É necessário verificar se está mudando o início e término ao mesmo tempo
                    // if (dto.inicio != undefined && DateTime.fromJSDate(dto.inicio) != DateTime.fromJSDate(self.inicio) )
                }

                const workflow = await prismaTxn.workflow.update({
                    where: { id },
                    data: {
                        transferencia_tipo_id: dto.transferencia_tipo_id,
                        ativo: dto.ativo,
                        inicio: dto.inicio,
                        termino: dto.termino,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflow;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowDto, user: PessoaFromJwt): Promise<WorkflowDto[]> {
        const rows = await this.prisma.workflow.findMany({
            where: {
                ativo: filters.ativo,
                transferencia_tipo_id: filters.transferencia_tipo_id,
                removido_em: null,
            },
            select: {
                id: true,
                ativo: true,
                inicio: true,
                termino: true,
                transferencia_tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.workflow.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
