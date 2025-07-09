import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma } from 'src/generated/prisma/client';
import { UpdateWorkflowSituacaoDto } from './dto/update-workflow-situacao.dto';
import { WorkflowSituacaoDto } from './entities/workflow-situacao.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkflowSituacaoDto } from './dto/create-workflow-situacao.dto';

@Injectable()
export class WorkflowSituacaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateWorkflowSituacaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.workflowSituacao.count({
                    where: {
                        situacao: { endsWith: dto.situacao, mode: 'insensitive' },
                        tipo_situacao: dto.tipo_situacao,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException(
                        'situacao| Nome igual ou semelhante já existe em outro registro ativo',
                        400
                    );

                const workflowSituacao = await prismaTxn.workflowSituacao.create({
                    data: {
                        situacao: dto.situacao,
                        tipo_situacao: dto.tipo_situacao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowSituacao;
            }
        );

        return created;
    }

    async update(id: number, dto: UpdateWorkflowSituacaoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.workflowSituacao.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        situacao: true,
                        tipo_situacao: true,
                    },
                });
                if (!self) throw new NotFoundException('Situacao não encontrada');

                if (dto.situacao != undefined && dto.situacao != self.situacao) {
                    const similarExists = await this.prisma.workflowSituacao.count({
                        where: {
                            situacao: { endsWith: dto.situacao, mode: 'insensitive' },
                            tipo_situacao: dto.tipo_situacao,
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'situacao| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                const workflowSituacao = await prismaTxn.workflowSituacao.update({
                    where: { id },
                    data: {
                        situacao: dto.situacao,
                        tipo_situacao: dto.tipo_situacao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return workflowSituacao;
            }
        );

        return updated;
    }

    async findAll(user: PessoaFromJwt): Promise<WorkflowSituacaoDto[]> {
        const rows = await this.prisma.workflowSituacao.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                situacao: true,
                tipo_situacao: true,
            },
        });

        return rows;
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.workflowSituacao.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
