import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { CreateWorkflowEtapaDto } from './dto/create-workflow-etapa.dto';
import { UpdateWorkflowEtapaDto } from './dto/update-workflow-etapa.dto';
import { WorkflowEtapaDto } from './entities/workflow-etapa.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterWorkflowEtapaDto } from '../dto/filter-workflow.dto';

@Injectable()
export class WorkflowEtapaService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowEtapaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.workflowEtapa.count({
                    where: {
                        etapa_fluxo: { endsWith: dto.descricao, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException(
                        'etapa_fluxo| Nome igual ou semelhante já existe em outro registro ativo',
                        400
                    );

                const workflowEtapa = await prismaTxn.workflowEtapa.create({
                    data: {
                        etapa_fluxo: dto.descricao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowEtapa;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowEtapaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.workflowEtapa.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        etapa_fluxo: true,
                    },
                });
                if (!self) throw new NotFoundException('Etapa não encontrada');

                if (dto.descricao != undefined && dto.descricao != self.etapa_fluxo) {
                    const similarExists = await this.prisma.workflowEtapa.count({
                        where: {
                            etapa_fluxo: { endsWith: dto.descricao, mode: 'insensitive' },
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'etapa_fluxo| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                const workflowEtapa = await prismaTxn.workflowEtapa.update({
                    where: { id },
                    data: {
                        etapa_fluxo: dto.descricao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowEtapa;
            }
        );

        return updated;
    }

    async findAll(filters: FilterWorkflowEtapaDto, user: PessoaFromJwt): Promise<WorkflowEtapaDto[]> {
        const rows = await this.prisma.workflowEtapa.findMany({
            where: {
                removido_em: filters.incluir_removidas ? undefined : null,
            },
            select: {
                id: true,
                etapa_fluxo: true,
            },
        });

        return rows.map((r) => {
            return {
                id: r.id,
                // Modificando de "etapa_fluxo" para "descrição" para facilitar implementação do front-end.
                descricao: r.etapa_fluxo,
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.workflowEtapa.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
