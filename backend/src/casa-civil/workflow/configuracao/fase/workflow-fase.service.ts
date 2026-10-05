import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from '@prisma/client';
import { CreateWorkflowFaseDto } from './dto/create-workflow-fase.dto';
import { UpdateWorkflowFaseDto } from './dto/update-workflow-fase.dto';
import { WorkflowFaseDto } from './entities/workflow-fase.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkflowFaseService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.workflowFase.count({
                    where: {
                        fase: { endsWith: dto.fase, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

                const workflowFase = await prismaTxn.workflowFase.create({
                    data: {
                        fase: dto.fase,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFase;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.workflowFase.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        fase: true,
                    },
                });
                if (!self) throw new NotFoundException('Etapa não encontrada');

                if (dto.fase != undefined && dto.fase != self.fase) {
                    const similarExists = await this.prisma.workflowFase.count({
                        where: {
                            fase: { endsWith: dto.fase, mode: 'insensitive' },
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                const workflowFase = await prismaTxn.workflowFase.update({
                    where: { id },
                    data: {
                        fase: dto.fase,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowFase;
            }
        );

        return updated;
    }

    async findAll(user: PessoaFromJwt): Promise<WorkflowFaseDto[]> {
        const rows = await this.prisma.workflowFase.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                fase: true,
            },
        });

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            const self = await prismaTxn.workflowFase.findFirst({
                where: {
                    id,
                    removido_em: null,
                },
                select: { id: true },
            });
            if (!self) throw new NotFoundException('Fase não encontrada');

            // Uso na configuração: fase referenciada por algum fluxo/etapa ativo.
            const emUsoConfig = await prismaTxn.fluxoFase.count({
                where: {
                    fase_id: id,
                    removido_em: null,
                },
            });
            if (emUsoConfig)
                throw new HttpException('Fase não pode ser removida, pois está em uso na configuração de um workflow.', 400);

            // Uso em execução: fase referenciada por alguma transferência ativa (fase atual ou andamento).
            const emUsoTransferenciaAtual = await prismaTxn.transferencia.count({
                where: {
                    workflow_fase_atual_id: id,
                    removido_em: null,
                },
            });
            const emUsoAndamento = await prismaTxn.transferenciaAndamento.count({
                where: {
                    workflow_fase_id: id,
                    removido_em: null,
                    transferencia: { removido_em: null },
                },
            });
            if (emUsoTransferenciaAtual || emUsoAndamento)
                throw new HttpException('Fase não pode ser removida, pois está em uso por uma transferência.', 400);

            await prismaTxn.workflowFase.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }
}
