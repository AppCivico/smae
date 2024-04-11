import { HttpException, Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { Prisma, WorkflowResponsabilidade, WorkflowSituacaoTipo } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateWorkflowAndamentoFaseDto, WorkflowFinalizarFaseDto } from './dto/patch-workflow-andamento-fase.dto';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';

@Injectable()
export class WorkflowAndamentoFaseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workflowService: WorkflowService
    ) {}

    async update(dto: UpdateWorkflowAndamentoFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Encontrando row na table transferencia_andamento
                const self = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_fase_id: dto.fase_id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        orgao_responsavel_id: true,
                        pessoa_responsavel_id: true,
                        workflow_situacao_id: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,
                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });
                if (!self) throw new Error('Não foi encontrada um registro de andamento para esta fase');

                if (!self.transferencia.workflow_id)
                    throw new Error('Transferência não possui configuração de Workflow.');

                // Caso a situação seja modificada. Deve verificar se ela existe na config do Workflow.
                if (dto.situacao_id != undefined && self.workflow_situacao_id != dto.situacao_id) {
                    const situacaoNaConfig = await prismaTxn.fluxoFaseSituacao.count({
                        where: {
                            fluxo_fase: {
                                fase_id: dto.fase_id,
                                removido_em: null,
                            },
                            situacao_id: dto.situacao_id,
                        },
                    });
                    if (!situacaoNaConfig)
                        throw new HttpException(
                            'situacao_id| Situação não está presente na configuração do Workflow.',
                            400
                        );
                }

                if (
                    (dto.orgao_responsavel_id != undefined || dto.pessoa_responsavel_id != undefined) &&
                    (self.orgao_responsavel_id != dto.orgao_responsavel_id ||
                        self.pessoa_responsavel_id != dto.pessoa_responsavel_id)
                ) {
                    const configFluxoFase = await prismaTxn.fluxoFase.findFirst({
                        where: {
                            removido_em: null,
                            fase_id: self.workflow_fase_id,
                            fluxo: {
                                fluxo_etapa_de_id: self.workflow_etapa_id,
                                removido_em: null,
                            },
                        },
                        select: {
                            responsabilidade: true,
                        },
                    });
                    if (!configFluxoFase)
                        throw new Error(
                            'Não foi possível encontrar configuração de Fluxo Fase para editar órgão responsável.'
                        );

                    // Caso seja modificado o órgão responsável, é necessário verificar o tipo de responsabilidade da fase.
                    if (dto.orgao_responsavel_id != undefined) {
                        if (configFluxoFase.responsabilidade === WorkflowResponsabilidade.Propria)
                            throw new HttpException(
                                'orgao_responsavel_id| Fase é de responsabilidade própria e portanto não deve ser atribuida a outro órgão.',
                                400
                            );
                    }

                    // Caso seja modificado a pessoa responsável, é necessário verificar o tipo de responsabilidade da fase.
                    if (dto.orgao_responsavel_id != undefined) {
                        if (
                            configFluxoFase.responsabilidade === WorkflowResponsabilidade.Propria &&
                            dto.pessoa_responsavel_id != user.id
                        )
                            throw new HttpException(
                                'pessoa_responsavel_id| Fase é de responsabilidade própria e portanto não deve ser atribuida à outra pessoa.',
                                400
                            );
                    }
                }

                const updated = await prismaTxn.transferenciaAndamento.update({
                    where: { id: self.id },
                    data: {
                        workflow_situacao_id: dto.situacao_id,
                        orgao_responsavel_id: dto.orgao_responsavel_id,
                        pessoa_responsavel_id: dto.pessoa_responsavel_id,
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });

                return { id: updated.id };
            }
        );

        return updated;
    }

    async finalizarFase(dto: WorkflowFinalizarFaseDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Encontrando row na table transferencia_andamento
                const self = await prismaTxn.transferenciaAndamento.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        workflow_fase_id: dto.fase_id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        transferencia_id: true,
                        orgao_responsavel_id: true,
                        pessoa_responsavel_id: true,
                        workflow_fase_id: true,
                        workflow_etapa_id: true,

                        workflow_situacao: {
                            select: {
                                id: true,
                                tipo_situacao: true,
                            },
                        },

                        tarefas: {
                            select: {
                                id: true,
                                feito: true,
                            },
                        },

                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });
                if (!self) throw new Error('Não foi encontrada um registro de andamento para esta fase');

                if (!self.transferencia.workflow_id)
                    throw new Error('Transferência não possui configuração de Workflow.');

                // Verificando situação da fase.
                // Caso a fase seja Suspensa, Cancelada ou Terminal.
                // Pode ser finalizada sem concluir as tarefas.
                const situacaoPodeFecharSemTarefa = new Set<WorkflowSituacaoTipo>([
                    WorkflowSituacaoTipo.Suspenso,
                    WorkflowSituacaoTipo.Cancelado,
                    WorkflowSituacaoTipo.Terminal,
                ]);

                if (
                    !situacaoPodeFecharSemTarefa.has(self.workflow_situacao.tipo_situacao) &&
                    self.tarefas.find((t) => {
                        t.feito == false;
                    })
                ) {
                    throw new Error('Há tarefas que não foram finalizadas.');
                }

                // Finalizando a fase.
                await prismaTxn.transferenciaAndamento.update({
                    where: { id: self.id },
                    data: {
                        data_termino: new Date(Date.now()),
                        atualizado_em: new Date(Date.now()),
                        atualizado_por: user.id,
                    },
                });

                // Procurando a próxima fase e iniciando-a.
                // Caso não exista. Procura pela próxima etapa.
                const configFluxoFaseAtual = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        removido_em: null,
                        fase_id: self.workflow_fase_id,
                        fluxo: {
                            fluxo_etapa_de_id: self.workflow_etapa_id,
                            removido_em: null,
                        },
                    },
                    select: {
                        ordem: true,
                    },
                });
                if (!configFluxoFaseAtual)
                    throw new Error('Não foi encontrada configuração da Fase atual no Workflow.');

                const configFluxoFaseSeguinte = await prismaTxn.fluxoFase.findFirst({
                    where: {
                        removido_em: null,
                        ordem: configFluxoFaseAtual.ordem + 1,
                        fluxo: {
                            fluxo_etapa_de_id: self.workflow_etapa_id,
                            removido_em: null,
                        },
                    },
                    select: {
                        fase_id: true,
                        ordem: true,
                        responsabilidade: true,
                        tarefas: {
                            select: {
                                responsabilidade: true,
                                workflow_tarefa: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                        situacoes: {
                            where: {
                                situacao: {
                                    OR: [
                                        { tipo_situacao: WorkflowSituacaoTipo.NaoIniciado },
                                        { tipo_situacao: WorkflowSituacaoTipo.EmAndamento },
                                    ],
                                },
                            },
                            select: {
                                situacao_id: true,
                            },
                        },
                    },
                });

                if (configFluxoFaseSeguinte) {
                    if (!configFluxoFaseSeguinte.situacoes.length)
                        throw new Error('Fase não possui configuração de status Inicial');

                    const situacao_id: number = configFluxoFaseSeguinte.situacoes[0].situacao_id;

                    await prismaTxn.transferenciaAndamento.create({
                        data: {
                            transferencia_id: self.transferencia_id,
                            workflow_etapa_id: self.workflow_etapa_id,
                            workflow_fase_id: configFluxoFaseSeguinte.fase_id,
                            workflow_situacao_id: situacao_id,
                            pessoa_responsavel_id:
                                configFluxoFaseSeguinte.responsabilidade == WorkflowResponsabilidade.Propria
                                    ? user.id
                                    : null,
                            data_inicio: new Date(Date.now()),
                            criado_por: user.id,
                            criado_em: new Date(Date.now()),

                            tarefas: {
                                createMany: {
                                    data: configFluxoFaseSeguinte.tarefas.map((e) => {
                                        return {
                                            workflow_tarefa_fluxo_id: e.workflow_tarefa.id,
                                            criado_por: user.id,
                                            criado_em: new Date(Date.now()),
                                        };
                                    }),
                                },
                            },
                        },
                    });
                } else {
                    const workflow = await this.workflowService.findOne(self.transferencia.workflow_id, user);

                    // Buscando pela próxima etapa.
                    const configEtapaAtual = workflow.fluxo.find(
                        (f) => f.workflow_etapa_de?.id == self.workflow_etapa_id
                    );
                    if (!configEtapaAtual) throw new Error('Erro interno ao buscar configuração de etapa atual');

                    const proxEtapa = workflow.fluxo.find(
                        (f) => f.workflow_etapa_de?.id == configEtapaAtual.workflow_etapa_para?.id
                    );
                    if (proxEtapa) {
                        // Pegando sempre a primeira fase.
                        // No endpoint FindOne, já vem ordenado.
                        const primeiraFase = proxEtapa.fases[0];
                        if (!primeiraFase) throw new Error('Erro ao encontrar primeira fase de próxima Etapa');

                        const situacaoFaseInicial = primeiraFase.situacao?.find(
                            (s) =>
                                s.tipo_situacao == WorkflowSituacaoTipo.NaoIniciado ||
                                s.tipo_situacao == WorkflowSituacaoTipo.EmAndamento
                        );
                        if (!situacaoFaseInicial)
                            throw new Error('Fase não possui configuração de status Inicial para fase seguinte');

                        await prismaTxn.transferenciaAndamento.create({
                            data: {
                                transferencia_id: self.transferencia_id,
                                workflow_etapa_id: proxEtapa.workflow_etapa_de!.id,
                                workflow_fase_id: primeiraFase.id!,
                                workflow_situacao_id: situacaoFaseInicial.id,
                                pessoa_responsavel_id:
                                    primeiraFase.responsabilidade == WorkflowResponsabilidade.Propria ? user.id : null,
                                data_inicio: new Date(Date.now()),
                                criado_por: user.id,
                                criado_em: new Date(Date.now()),

                                tarefas: {
                                    createMany: {
                                        data: primeiraFase.tarefas.map((e) => {
                                            return {
                                                workflow_tarefa_fluxo_id: e.workflow_tarefa!.id,
                                                criado_por: user.id,
                                                criado_em: new Date(Date.now()),
                                            };
                                        }),
                                    },
                                },
                            },
                        });
                    }
                }

                return { id: self.id };
            }
        );

        return updated;
    }
}
