import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { CreateWorkflowTarefaDto } from './dto/create-workflow-tarefa.dto';
import { UpdateWorkflowTarefaDto } from './dto/update-workflow-tarefa.dto';
import { WorkflowTarefaDto } from './entities/workflow-tarefa.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkflowTarefaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.workflowTarefa.count({
                    where: {
                        tarefa_fluxo: { endsWith: dto.descricao, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException(
                        'tarefa_fluxo| Nome igual ou semelhante já existe em outro registro ativo',
                        400
                    );

                const workflowTarefa = await prismaTxn.workflowTarefa.create({
                    data: {
                        tarefa_fluxo: dto.descricao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowTarefa;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.workflowTarefa.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        tarefa_fluxo: true,
                    },
                });
                if (!self) throw new NotFoundException('Tarefa não encontrada');

                if (dto.descricao != undefined && dto.descricao != self.tarefa_fluxo) {
                    const similarExists = await this.prisma.workflowTarefa.count({
                        where: {
                            tarefa_fluxo: { endsWith: dto.descricao, mode: 'insensitive' },
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'tarefa_fluxo| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                const workflowTarefa = await prismaTxn.workflowTarefa.update({
                    where: { id },
                    data: {
                        tarefa_fluxo: dto.descricao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowTarefa;
            }
        );

        return updated;
    }

    async findAll(user: PessoaFromJwt): Promise<WorkflowTarefaDto[]> {
        const rows = await this.prisma.workflowTarefa.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                tarefa_fluxo: true,
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                // Modificando de "tarefa_fluxo" para "descrição" para facilitar implementação do front-end.
                descricao: r.tarefa_fluxo,
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.workflowTarefa.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
