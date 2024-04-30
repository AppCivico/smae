import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { CreateDistribuicaoRecursoDto } from './dto/create-distribuicao-recurso.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { DistribuicaoRecursoDto } from './entities/distribuicao-recurso.entity';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import { FilterDistribuicaoRecursoDto } from './dto/filter-distribuicao-recurso.dto';
import { formataSEI } from 'src/common/formata-sei';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';

type operationsRegistroSEI = {
    id?: number;
    processo_sei: string;
}[];

@Injectable()
export class DistribuicaoRecursoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async create(dto: CreateDistribuicaoRecursoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orgaoGestorExiste = await this.prisma.orgao.count({
            where: {
                id: dto.orgao_gestor_id,
                removido_em: null,
            },
        });
        if (!orgaoGestorExiste) throw new HttpException('orgao_gestor_id| Órgão gestor inválido', 400);

        const transferenciaExiste = await this.prisma.transferencia.count({
            where: {
                id: dto.transferencia_id,
                removido_em: null,
            },
        });
        if (!transferenciaExiste) throw new HttpException('transferencia_id| Transferência não encontrada.', 400);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const distribuicaoRecurso = await prismaTx.distribuicaoRecurso.create({
                    data: {
                        transferencia_id: dto.transferencia_id,
                        orgao_gestor_id: dto.orgao_gestor_id,
                        objeto: dto.objeto,
                        valor: dto.valor,
                        valor_total: dto.valor_total,
                        valor_contrapartida: dto.valor_contrapartida,
                        empenho: dto.empenho,
                        programa_orcamentario_estadual: dto.programa_orcamentario_estadual,
                        programa_orcamentario_municipal: dto.programa_orcamentario_municipal,
                        dotacao: dto.dotacao,
                        proposta: dto.proposta,
                        contrato: dto.contrato,
                        convenio: dto.convenio,
                        assinatura_termo_aceite: dto.assinatura_termo_aceite,
                        assinatura_municipio: dto.assinatura_municipio,
                        assinatura_estado: dto.assinatura_estado,
                        vigencia: dto.vigencia,
                        conclusao_suspensiva: dto.conclusao_suspensiva,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                        registros_sei: {
                            createMany: {
                                data:
                                    dto.registros_sei != undefined && dto.registros_sei.length > 0
                                        ? dto.registros_sei!.map((r) => {
                                              return {
                                                  processo_sei: r.processo_sei.replace(/\D/g, ''),
                                                  registro_sei_info: '{}',
                                                  criado_em: new Date(Date.now()),
                                                  criado_por: user.id,
                                              };
                                          })
                                        : [],
                            },
                        },
                    },
                    select: {
                        id: true,
                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });

                if (distribuicaoRecurso.transferencia.workflow_id)
                    await this.startWorkflow(
                        dto.transferencia_id,
                        distribuicaoRecurso.transferencia.workflow_id,
                        prismaTx,
                        user
                    );

                return { id: distribuicaoRecurso.id };
            }
        );

        return { id: created.id };
    }

    async findAll(filters: FilterDistribuicaoRecursoDto): Promise<DistribuicaoRecursoDto[]> {
        const rows = await this.prisma.distribuicaoRecurso.findMany({
            where: {
                removido_em: null,
                transferencia_id: filters.transferencia_id,
            },
            select: {
                id: true,
                transferencia_id: true,
                objeto: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                empenho: true,
                programa_orcamentario_estadual: true,
                programa_orcamentario_municipal: true,
                dotacao: true,
                proposta: true,
                contrato: true,
                convenio: true,
                assinatura_termo_aceite: true,
                assinatura_municipio: true,
                assinatura_estado: true,
                vigencia: true,
                conclusao_suspensiva: true,
                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                registros_sei: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        processo_sei: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                ...r,
                registros_sei: r.registros_sei.map((s) => {
                    return {
                        id: s.id,
                        processo_sei: formataSEI(s.processo_sei),
                    };
                }),
            };
        });
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DistribuicaoRecursoDto> {
        const row = await this.prisma.distribuicaoRecurso.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                transferencia_id: true,
                objeto: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                empenho: true,
                programa_orcamentario_estadual: true,
                programa_orcamentario_municipal: true,
                dotacao: true,
                proposta: true,
                contrato: true,
                convenio: true,
                assinatura_termo_aceite: true,
                assinatura_municipio: true,
                assinatura_estado: true,
                vigencia: true,
                conclusao_suspensiva: true,
                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                registros_sei: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        processo_sei: true,
                    },
                },
            },
        });
        if (!row) throw new HttpException('id| Distribuição de recurso não encontrada.', 404);

        return {
            ...row,
            registros_sei: row.registros_sei.map((s) => {
                return {
                    id: s.id,
                    processo_sei: formataSEI(s.processo_sei),
                };
            }),
        };
    }

    async update(id: number, dto: UpdateDistribuicaoRecursoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const self = await this.findOne(id, user);

        if (dto.orgao_gestor_id != undefined && dto.orgao_gestor_id != self.orgao_gestor.id) {
            const orgaoGestorExiste = await this.prisma.orgao.count({
                where: {
                    id: dto.orgao_gestor_id,
                    removido_em: null,
                },
            });
            if (!orgaoGestorExiste) throw new HttpException('orgao_gestor_id| Órgão gestor inválido', 400);
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            if (dto.registros_sei != undefined) {
                const currRegistrosSei = self.registros_sei ?? [];
                await this.checkDiffSei(id, dto.registros_sei, currRegistrosSei, prismaTx, user);
            }
            delete dto.registros_sei;

            await prismaTx.distribuicaoRecurso.update({
                where: { id },
                data: {
                    orgao_gestor_id: dto.orgao_gestor_id,
                    objeto: dto.objeto,
                    valor: dto.valor,
                    valor_total: dto.valor_total,
                    valor_contrapartida: dto.valor_contrapartida,
                    empenho: dto.empenho,
                    programa_orcamentario_estadual: dto.programa_orcamentario_estadual,
                    programa_orcamentario_municipal: dto.programa_orcamentario_municipal,
                    dotacao: dto.dotacao,
                    proposta: dto.proposta,
                    contrato: dto.contrato,
                    convenio: dto.convenio,
                    assinatura_termo_aceite: dto.assinatura_termo_aceite,
                    assinatura_municipio: dto.assinatura_municipio,
                    assinatura_estado: dto.assinatura_estado,
                    vigencia: dto.vigencia,
                    conclusao_suspensiva: dto.conclusao_suspensiva,
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

    async remove(id: number, user: PessoaFromJwt) {
        const exists = await this.prisma.distribuicaoRecurso.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });
        if (!exists) return;

        await this.prisma.distribuicaoRecurso.updateMany({
            where: {
                id,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }

    private async checkDiffSei(
        distribuicaoRecursoId: number,
        sentRegistrosSei: operationsRegistroSEI,
        currRegistrosSei: operationsRegistroSEI,
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt
    ) {
        const updated: operationsRegistroSEI = sentRegistrosSei
            .filter((r) => r.id != undefined)
            .filter((rNew) => {
                const rOld = currRegistrosSei.find((r) => r.id == rNew.id);

                return rNew.processo_sei !== rOld!.processo_sei;
            });

        const created: operationsRegistroSEI = sentRegistrosSei.filter((r) => r.id == undefined);

        const deleted: number[] = currRegistrosSei
            .filter((r) => {
                return !sentRegistrosSei.filter((rNew) => rNew.id != undefined).find((rNew) => rNew.id == r.id);
            })
            .map((r) => {
                return r.id!;
            });

        const operations = [];

        for (const updatedRow of updated) {
            operations.push(
                prismaTx.distribuicaoRecursoSei.update({
                    where: {
                        id: updatedRow.id,
                        removido_em: null,
                    },
                    data: {
                        processo_sei: updatedRow.processo_sei.replace(/\D/g, ''),
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                })
            );
        }

        for (const createdRow of created) {
            operations.push(
                prismaTx.distribuicaoRecursoSei.create({
                    data: {
                        distribuicao_recurso_id: distribuicaoRecursoId,
                        processo_sei: createdRow.processo_sei.replace(/\D/g, ''),
                        registro_sei_info: '{}',
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                })
            );
        }

        if (deleted.length > 0) {
            operations.push(
                prismaTx.distribuicaoRecursoSei.deleteMany({
                    where: {
                        id: { in: deleted },
                        distribuicao_recurso_id: distribuicaoRecursoId,
                        removido_em: null,
                    },
                })
            );
        }

        await Promise.all(operations);
    }

    private async startWorkflow(
        transferencia_id: number,
        workflow_id: number,
        prismaTxn: Prisma.TransactionClient,
        user: PessoaFromJwt
    ) {
        const workflow = await this.workflowService.findOne(workflow_id, undefined);

        // Caso seja a primeira fase, já é iniciada.
        // Ou seja, o timestamp de data_inicio é preenchido.
        let primeiraFase: boolean = true;

        for (const fluxo of workflow.fluxo) {
            for (const fase of fluxo.fases) {
                // Caso a fase seja de responsabilidade própria.
                // Deve ser iniciada já sob a Casa Civil.
                let orgao_id: number | null = null;
                if (fase.responsabilidade == WorkflowResponsabilidade.Propria) {
                    const orgaoCasaCivil = await prismaTxn.orgao.findFirst({
                        where: {
                            removido_em: null,
                            sigla: 'SERI',
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (!orgaoCasaCivil)
                        throw new HttpException(
                            'Fase é de responsabilidade própria, mas não foi encontrado órgão da Casa Civil',
                            400
                        );

                    orgao_id = orgaoCasaCivil.id;
                }

                const jaExiste = await prismaTxn.transferenciaAndamento.count({
                    where: {
                        removido_em: null,
                        transferencia_id: transferencia_id,
                        workflow_etapa_id: fluxo.workflow_etapa_de!.id,
                        workflow_fase_id: fase.fase!.id,
                    },
                });

                if (!jaExiste) {
                    await prismaTxn.transferenciaAndamento.create({
                        data: {
                            transferencia_id: transferencia_id,
                            workflow_etapa_id: fluxo.workflow_etapa_de!.id, // Sempre será o "dê" do "dê-para".
                            workflow_fase_id: fase.fase!.id,
                            orgao_responsavel_id: orgao_id,
                            data_inicio: primeiraFase ? new Date(Date.now()) : null,
                            criado_por: user.id,
                            criado_em: new Date(Date.now()),

                            tarefas: {
                                createMany: {
                                    data: fase.tarefas.map((t: any) => {
                                        return {
                                            workflow_tarefa_fluxo_id: t.workflow_tarefa!.id,
                                            criado_por: user.id,
                                            criado_em: new Date(Date.now()),
                                        };
                                    }),
                                },
                            },
                        },
                    });
                }

                primeiraFase = false;
            }
        }
        await prismaTxn.$queryRaw`CALL create_workflow_cronograma(${transferencia_id}::int, ${workflow_id}::int);`;

        // Atualizando data de início de primeiro nível.
        const andamentoPrimeiraFase = await prismaTxn.transferenciaAndamento.findFirstOrThrow({
            where: {
                transferencia_id: transferencia_id,
                data_inicio: { not: null },
            },
            select: {
                tarefaEspelhada: {
                    select: {
                        id: true,
                    },
                },
                tarefas: {
                    select: {
                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });

        await prismaTxn.tarefa.update({
            where: { id: andamentoPrimeiraFase.tarefaEspelhada[0].id },
            data: {
                inicio_real: new Date(Date.now()),
            },
        });

        for (const tarefa of andamentoPrimeiraFase.tarefas) {
            await prismaTxn.tarefa.update({
                where: { id: tarefa.tarefaEspelhada[0].id },
                data: {
                    inicio_real: new Date(Date.now()),
                },
            });
        }
    }
}
