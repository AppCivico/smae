import {
    BadRequestException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    ModuloSistema,
    Prisma,
    TipoPdm,
    TipoProjeto,
    TransferenciaHistoricoAcao,
    WorkflowResponsabilidade,
} from '@prisma/client';
import { TarefaCronogramaDto } from 'src/common/dto/TarefaCronograma.dto';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from 'src/common/dto/paginated.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { DistribuicaoRecursoService } from 'src/casa-civil/distribuicao-recurso/distribuicao-recurso.service';
import { UpdateTarefaDto } from 'src/pp/tarefa/dto/update-tarefa.dto';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { UploadService } from 'src/upload/upload.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { BlocoNotaService } from '../../bloco-nota/bloco-nota/bloco-nota.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';
import { CreateTransferenciaAnexoDto, CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { FilterTransferenciaDto, FilterTransferenciaHistoricoDto } from './dto/filter-transferencia.dto';
import {
    CompletarTransferenciaDto,
    UpdateTransferenciaAnexoDto,
    UpdateTransferenciaDto,
} from './dto/update-transferencia.dto';
import {
    TransferenciaAnexoDto,
    TransferenciaDetailDto,
    TransferenciaDto,
    TransferenciaHistoricoDto,
} from './entities/transferencia.dto';
import { PrismaHelpers } from '../../common/PrismaHelpers';
import { WorkflowService } from '../workflow/configuracao/workflow.service';
import { Date2YMD } from '../../common/date2ymd';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class TransferenciaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly jwtService: JwtService,
        private readonly blocoNotaService: BlocoNotaService,
        private readonly workflowService: WorkflowService,
        private readonly distribuicaoService: DistribuicaoRecursoService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService
    ) {}

    async createTransferencia(dto: CreateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        let workflowCriado: boolean = false;

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const tipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: { id: dto.tipo_id, removido_em: null },
                });
                if (!tipoExiste) throw new HttpException('tipo_id| Tipo não encontrado.', 400);

                /*Validação para caso seja informada a classificação realize a validação de existência
                 */
                if (dto.classificacao_id != null) {
                    const tipoExiste = await prismaTxn.classificacao.count({
                        where: { id: dto.classificacao_id, removido_em: null },
                    });
                    if (!tipoExiste) throw new HttpException('classificacao_id| Classificação não encontrada.', 400);
                }

                // Tratando workflow
                // Caso tenha um workflow ativo para o tipo de transferência.
                // Ele deve ser automaticamente o workflow selecionado.
                const workflow = await prismaTxn.workflow.findFirst({
                    where: {
                        transferencia_tipo_id: dto.tipo_id,
                        removido_em: null,
                        ativo: true,
                    },
                    select: {
                        id: true,
                    },
                });
                const workflow_id: number | null = workflow?.id ?? null;

                // Verificando match de esferas.
                const tipo = await prismaTxn.transferenciaTipo.findFirstOrThrow({
                    where: {
                        id: dto.tipo_id,
                        removido_em: null,
                    },
                    select: {
                        esfera: true,
                    },
                });
                if (tipo.esfera != dto.esfera)
                    throw new HttpException('esfera| Esfera da transferência e esfera do tipo devem ser iguais', 400);

                // Criando identificador
                // Identificador segue a seguinte regra: count(1) + 1 de transf / ano
                // O count é relativo ao ano.
                const idParaAno: number =
                    (await prismaTxn.transferencia.count({
                        where: {
                            ano: dto.ano,
                        },
                    })) + 1;

                const identificador: string = `${idParaAno}/${dto.ano}`;

                // Garantindo que não houve erro e duplicou identificador.
                const identificadorExiste = await prismaTxn.transferencia.count({
                    where: {
                        identificador: identificador,
                    },
                });
                if (identificadorExiste)
                    throw new InternalServerErrorException(
                        `Erro ao gerar identificador, já está em uso: ${identificador}`
                    );

                const transferencia = await prismaTxn.transferencia.create({
                    data: {
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_str: dto.secretaria_concedente,
                        objeto: dto.objeto,
                        interface: dto.interface,
                        esfera: dto.esfera,
                        identificador: identificador,
                        identificador_nro: idParaAno,
                        clausula_suspensiva: dto.clausula_suspensiva,
                        clausula_suspensiva_vencimento: dto.clausula_suspensiva_vencimento,
                        ano: dto.ano,
                        emenda: dto.emenda,
                        demanda: dto.demanda,
                        programa: dto.programa,
                        normativa: dto.normativa,
                        observacoes: dto.observacoes,
                        detalhamento: dto.detalhamento,
                        nome_programa: dto.nome_programa,
                        agencia_aceite: dto.agencia_aceite,
                        emenda_unitaria: dto.emenda_unitaria,
                        numero_identificacao: dto.numero_identificacao,
                        workflow_id: workflow_id,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                        parlamentar: {
                            createMany: {
                                data: dto.parlamentares
                                    ? dto.parlamentares.map((e) => {
                                          return {
                                              parlamentar_id: e.parlamentar_id,
                                              cargo: e.cargo,
                                              partido_id: e.partido_id,
                                              criado_em: new Date(Date.now()),
                                              criado_por: user.id,
                                          };
                                      })
                                    : [],
                            },
                        },
                        classificacao_id: dto.classificacao_id,
                    },
                    select: { id: true },
                });

                if (workflow_id) {
                    await this.startWorkflow(transferencia.id, workflow_id, prismaTxn, user);
                    workflowCriado = true;
                }

                return transferencia;
            }
        );

        // Disparando update para validar topologia.
        if (workflowCriado) {
            await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                // Caso a transferência possua distribuição(es).
                // Criamos as tarefas que não são responsabilidade própria.
                const distribuicoes = await prismaTxn.distribuicaoRecurso.findMany({
                    where: {
                        transferencia_id: created.id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                    },
                });

                for (const distribuicao of distribuicoes) {
                    const distribuicaoId = distribuicao.id;

                    await this.distribuicaoService._createTarefasOutroOrgao(prismaTxn, distribuicaoId, user);
                }

                const tarefas = await prismaTxn.tarefa.findMany({
                    where: {
                        tarefa_cronograma: {
                            transferencia_id: created.id,
                        },
                    },
                    select: {
                        id: true,
                        dependencias: {
                            select: {
                                id: true,
                                tarefa_id: true,
                                dependencia_tarefa_id: true,
                                tipo: true,
                                latencia: true,
                            },
                        },
                    },
                });

                for (const tarefa of tarefas) {
                    let dto: UpdateTarefaDto = {};

                    if (tarefa.dependencias.length) {
                        dto = {
                            dependencias: tarefa.dependencias.map((e) => {
                                return {
                                    dependencia_tarefa_id: e.dependencia_tarefa_id,
                                    tipo: e.tipo,
                                    latencia: e.latencia,
                                };
                            }),
                        };

                        await this.tarefaService.update(
                            { transferencia_id: created.id },
                            tarefa.id,
                            dto,
                            user,
                            prismaTxn
                        );
                    }
                }

                // Atualizando previsão de término para tarefas de fase de etapa e tarefas de acompanhamento da etapa.
                const tarefaEtapasAcompanhamentos = await prismaTxn.tarefa.findMany({
                    where: {
                        tarefa_cronograma: {
                            transferencia_id: created.id,
                        },
                        termino_planejado: null,
                        db_projecao_termino: null,
                    },
                    select: {
                        id: true,
                        tarefa_pai_id: true,
                        nivel: true,
                        numero: true,
                        tarefa: true,
                    },
                });

                const updates = [];
                for (const row of tarefaEtapasAcompanhamentos) {
                    if (row.nivel == 1 && row.tarefa_pai_id == null) {
                        // Tarefa referente à própia etapa.

                        // Buscando tarefa filha de maior número.
                        const tarefaFilha = await prismaTxn.tarefa.findFirst({
                            where: {
                                tarefa_pai_id: row.id,
                                removido_em: null,
                            },
                            orderBy: { numero: 'desc' },
                            select: {
                                termino_planejado: true,
                                db_projecao_termino: true,
                            },
                        });

                        if (!tarefaFilha)
                            throw new InternalServerErrorException(
                                'Erro ao encontrar tarefa filha para base de projeção.'
                            );

                        updates.push(
                            prismaTxn.tarefa.update({
                                where: { id: row.id },
                                data: {
                                    termino_planejado: tarefaFilha.termino_planejado,
                                    db_projecao_termino: tarefaFilha.db_projecao_termino,
                                },
                            })
                        );
                    } else if (row.nivel == 2 && row.tarefa_pai_id != null) {
                        // Buscando tarefa irmã de maior número.

                        const tarefaIrma = await prismaTxn.tarefa.findFirst({
                            where: {
                                tarefa_pai_id: row.tarefa_pai_id,

                                removido_em: null,
                            },
                            orderBy: { numero: 'desc' },
                            select: {
                                termino_planejado: true,
                                db_projecao_termino: true,
                            },
                        });
                        if (!tarefaIrma)
                            throw new InternalServerErrorException(
                                'Erro ao encontrar tarefa filha para base de projeção.'
                            );

                        updates.push(
                            prismaTxn.tarefa.update({
                                where: { id: row.id },
                                data: {
                                    termino_planejado: tarefaIrma.termino_planejado,
                                    db_projecao_termino: tarefaIrma.db_projecao_termino,
                                },
                            })
                        );
                    } else {
                        // Nada, pois não deveria cair aqui se tudo ocorreu ok.
                    }
                }
                await Promise.all(updates);
            });
        }

        // Atualizando vetores da transferência.
        this.updateVetoresBusca(created.id).catch((err) => {
            // Optional: log if the background task fails for some reason
            console.error(`Background task updateVetoresBusca failed for transferencia ${created.id}`, err);
        });

        return created;
    }

    async updateTransferencia(id: number, dto: UpdateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const agora = new Date(Date.now());
        let workflowCriado: boolean = false;
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTxn.transferencia.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        esfera: true,
                        tipo_id: true,
                        identificador: true,
                        workflow_id: true,
                        ano: true,
                        clausula_suspensiva: true,
                    },
                });
                if (!self) throw new HttpException('id| Transferência não encontrada', 404);

                /*Validação para caso seja informada a classificação realize a validação de existência
                 */
                if (dto.classificacao_id != null) {
                    const tipoExiste = await prismaTxn.classificacao.count({
                        where: { id: dto.classificacao_id, removido_em: null },
                    });
                    if (!tipoExiste) throw new HttpException('classificacao_id| Classificação não encontrada.', 400);
                }

                if (self.esfera != dto.esfera || self.tipo_id != dto.tipo_id) {
                    const tipo_id: number = dto.tipo_id ? dto.tipo_id : self.tipo_id;
                    // Verificando match de esferas.
                    const tipo = await prismaTxn.transferenciaTipo.findFirstOrThrow({
                        where: {
                            id: tipo_id,
                            removido_em: null,
                        },
                        select: {
                            esfera: true,
                        },
                    });
                    if (tipo.esfera != dto.esfera)
                        throw new HttpException(
                            'esfera| Esfera da transferência e esfera do tipo devem ser iguais',
                            400
                        );
                }

                let identificador: string | undefined = undefined;
                if (dto.ano != undefined && dto.ano != self.ano) {
                    // Caso o ano seja modificado, deve-se verificar se pode mudar o ano.
                    // E caso possa mudar o ano, deve mudar o identificador.

                    // Caso a transferência tenha movimentação de workflow, não pode trocar o ano.
                    const temMovimentacaoWorkflow = await prismaTxn.transferenciaAndamento.count({
                        where: {
                            transferencia_id: id,
                            OR: [
                                { atualizado_em: { not: undefined } },
                                { data_termino: { not: null } },
                                {
                                    tarefas: {
                                        some: {
                                            atualizado_em: { not: undefined },
                                        },
                                    },
                                },
                            ],
                        },
                    });
                    if (temMovimentacaoWorkflow)
                        throw new HttpException(
                            'ano| Ano não pode ser modificado, pois transferência já está em progresso.',
                            400
                        );

                    // Gerando novo identificador
                    const idParaAno: number =
                        (await prismaTxn.transferencia.count({
                            where: {
                                ano: dto.ano,
                            },
                        })) + 1;

                    identificador = `${idParaAno}/${dto.ano}`;

                    // Garantindo que não houve erro e duplicou identificador.
                    const identificadorExiste = await prismaTxn.transferencia.count({
                        where: {
                            identificador: identificador,
                        },
                    });
                    if (identificadorExiste)
                        throw new InternalServerErrorException(
                            `Erro ao gerar identificador, já está em uso: ${identificador}`
                        );
                }

                // Caso o tipo da transferência seja modificado.
                // O workflow e seu cronograma devem ser removidos.
                if (self.tipo_id != dto.tipo_id) {
                    await prismaTxn.transferenciaAndamento.updateMany({
                        where: { transferencia_id: id, removido_em: null },
                        data: {
                            removido_em: agora,
                            removido_por: user.id,
                        },
                    });

                    await prismaTxn.transferenciaAndamentoTarefa.updateMany({
                        where: {
                            transferencia_andamento: {
                                transferencia_id: id,
                            },
                            removido_em: null,
                        },
                        data: {
                            removido_em: agora,
                            removido_por: user.id,
                        },
                    });

                    await prismaTxn.tarefa.updateMany({
                        where: {
                            tarefa_cronograma: { transferencia_id: id, removido_em: null },
                        },
                        data: {
                            transferencia_fase_id: null,
                            transferencia_tarefa_id: null,
                            removido_em: agora,
                            removido_por: user.id,
                        },
                    });

                    await prismaTxn.tarefaCronograma.updateMany({
                        where: { transferencia_id: id, removido_em: null },
                        data: {
                            removido_em: agora,
                            removido_por: user.id,
                        },
                    });

                    // Inserindo row no histórico de alterações.
                    await prismaTxn.transferenciaHistorico.create({
                        data: {
                            transferencia_id: id,
                            tipo_antigo_id: self.tipo_id,
                            tipo_novo_id: dto.tipo_id,
                            acao: TransferenciaHistoricoAcao.TrocaTipo,
                            criado_por: user.id,
                            criado_em: agora,
                        },
                    });
                }

                let workflow_id: number | undefined | null;
                if (!self.workflow_id || (self.tipo_id && self.tipo_id != dto.tipo_id)) {
                    const workflow = await prismaTxn.workflow.findFirst({
                        where: {
                            transferencia_tipo_id: dto.tipo_id,
                            removido_em: null,
                            ativo: true,
                        },
                        select: {
                            id: true,
                        },
                    });
                    workflow_id = null;
                    if (workflow) workflow_id = workflow?.id;
                }

                // Caso a clausula_suspensiva estava true, e foi alterada para false.
                // É setado null para clausula_suspensiva_vencimento.
                if (dto.clausula_suspensiva == false && self.clausula_suspensiva == true) {
                    dto.clausula_suspensiva_vencimento = null;
                }

                // E caso seja modificada para true, deve ser validado se a data foi informada.
                if (
                    dto.clausula_suspensiva == true &&
                    self.clausula_suspensiva == false &&
                    dto.clausula_suspensiva_vencimento == null
                )
                    throw new HttpException(
                        'clausula_suspensiva_vencimento| Data de vencimento da cláusula suspensiva deve ser informada.',
                        400
                    );

                const transferencia = await prismaTxn.transferencia.update({
                    where: { id },
                    data: {
                        identificador: identificador,
                        workflow_id: workflow_id,
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_str: dto.secretaria_concedente,
                        objeto: dto.objeto,
                        interface: dto.interface,
                        esfera: dto.esfera,
                        clausula_suspensiva: dto.clausula_suspensiva,
                        clausula_suspensiva_vencimento: dto.clausula_suspensiva_vencimento,
                        ano: dto.ano,
                        emenda: dto.emenda,
                        demanda: dto.demanda,
                        programa: dto.programa,
                        normativa: dto.normativa,
                        observacoes: dto.observacoes,
                        detalhamento: dto.detalhamento,
                        nome_programa: dto.nome_programa,
                        agencia_aceite: dto.agencia_aceite,
                        emenda_unitaria: dto.emenda_unitaria,
                        numero_identificacao: dto.numero_identificacao,
                        atualizado_por: user.id,
                        atualizado_em: agora,
                        classificacao_id: dto.classificacao_id,
                    },
                    select: { id: true },
                });

                const updatedSelf = await this.prisma.transferencia.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        valor: true,
                        valor_total: true,
                        valor_contrapartida: true,
                        pendente_preenchimento_valores: true,
                        workflow_id: true,
                        tipo_id: true,
                        parlamentar: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                parlamentar_id: true,
                                partido_id: true,
                                cargo: true,
                                valor: true,
                                objeto: true,
                            },
                        },
                    },
                });

                if (
                    updatedSelf.valor &&
                    updatedSelf.valor_contrapartida &&
                    updatedSelf.valor_total &&
                    updatedSelf.pendente_preenchimento_valores == true
                ) {
                    await prismaTxn.transferencia.update({
                        where: { id },
                        data: {
                            pendente_preenchimento_valores: false,
                        },
                    });
                }

                if (workflow_id) {
                    await this.startWorkflow(id, workflow_id, prismaTxn, user);
                    workflowCriado = true;
                }

                // Tratando upsert de parlamentares.
                const operations = [];
                if (dto.parlamentares?.length) {
                    for (const relParlamentar of dto.parlamentares) {
                        if (relParlamentar.id) {
                            const row = updatedSelf.parlamentar.find((e) => e.id == relParlamentar.id);
                            if (!row) throw new HttpException('id| Linha não encontrada.', 400);

                            if (
                                row.objeto !== relParlamentar.objeto ||
                                row.parlamentar_id !== relParlamentar.parlamentar_id ||
                                row.partido_id !== relParlamentar.partido_id ||
                                row.cargo !== relParlamentar.cargo
                            ) {
                                operations.push(
                                    prismaTxn.transferenciaParlamentar.update({
                                        where: { id: relParlamentar.id },
                                        data: {
                                            parlamentar_id: relParlamentar.parlamentar_id,
                                            partido_id: relParlamentar.partido_id,
                                            cargo: relParlamentar.cargo,
                                            objeto: relParlamentar.objeto,
                                            atualizado_em: agora,
                                            atualizado_por: user.id,
                                        },
                                    })
                                );

                                // Verificando se há linhas em distribuição de recurso.
                                // E caso exista, atualizar os dados.
                                const distribuicoesParlamentares = await prismaTxn.distribuicaoParlamentar.findMany({
                                    where: {
                                        distribuicao_recurso: {
                                            transferencia_id: id,
                                            removido_em: null,
                                        },
                                        parlamentar_id: row.parlamentar_id,
                                        removido_em: null,
                                    },
                                    select: {
                                        id: true,
                                    },
                                });

                                for (const distribuicaoParlamentar of distribuicoesParlamentares) {
                                    operations.push(
                                        prismaTxn.distribuicaoParlamentar.update({
                                            where: { id: distribuicaoParlamentar.id },
                                            data: {
                                                cargo: relParlamentar.cargo,
                                                partido_id: relParlamentar.partido_id,
                                                atualizado_em: agora,
                                                atualizado_por: user.id,
                                            },
                                        })
                                    );
                                }
                            }
                        } else {
                            operations.push(
                                prismaTxn.transferenciaParlamentar.create({
                                    data: {
                                        id: relParlamentar.id,
                                        transferencia_id: id,
                                        parlamentar_id: relParlamentar.parlamentar_id,
                                        partido_id: relParlamentar.partido_id,
                                        cargo: relParlamentar.cargo,
                                        objeto: relParlamentar.objeto,
                                        criado_em: agora,
                                        criado_por: user.id,
                                    },
                                })
                            );
                        }
                    }
                }

                const parlamentaresRemovidos = updatedSelf.parlamentar.filter(
                    (e) => !dto.parlamentares?.map((e) => e.id).includes(e.id)
                );
                if (parlamentaresRemovidos.length) {
                    for (const row of parlamentaresRemovidos) {
                        // Verificando se parlamentar já está configurado em alguma distribuição desta transferência.
                        // Caso esteja, não deixo deletar.
                        const parlamentarDistribuicao = await prismaTxn.distribuicaoParlamentar.count({
                            where: {
                                distribuicao_recurso: {
                                    transferencia_id: id,
                                    removido_em: null,
                                },
                                parlamentar_id: row.parlamentar_id,
                                removido_em: null,
                            },
                        });
                        if (parlamentarDistribuicao)
                            throw new HttpException(
                                'parlamentar| Parlamentar já está configurado em distribuição de recurso. Remova-o primeiro na distribuição.',
                                400
                            );

                        operations.push(
                            prismaTxn.transferenciaParlamentar.update({
                                where: { id: row.id },
                                data: {
                                    removido_em: agora,
                                    removido_por: user.id,
                                },
                            })
                        );
                    }
                }

                if (operations.length) await Promise.all(operations);

                return transferencia;
            }
        );

        // Caso a transferência possua distribuição(es).
        // Criamos as tarefas que não são responsabilidade própria.
        const distribuicoes = await this.prisma.distribuicaoRecurso.findMany({
            where: {
                transferencia_id: id,
                removido_em: null,
            },
            select: {
                id: true,
            },
        });

        if (distribuicoes.length && workflowCriado) {
            await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                for (const distribuicao of distribuicoes) {
                    const distribuicaoId = distribuicao.id;

                    await this.distribuicaoService._createTarefasOutroOrgao(prismaTxn, distribuicaoId, user);
                }
            });
        }

        // Atualizando vetores da transferência.
        this.updateVetoresBusca(id).catch((err) => {
            // Optional: log if the background task fails for some reason
            console.error(`Background task updateVetoresBusca failed for transferencia ${id}`, err);
        });

        return updated;
    }

    async completeTransferencia(
        id: number,
        dto: CompletarTransferenciaDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const agora = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // “VALOR DO REPASSE”  é a soma de “Custeio” + Investimento”
                if (Number(dto.valor).toFixed(2) != (+dto.custeio + +dto.investimento).toFixed(2))
                    throw new HttpException(
                        'valor| Valor do repasse deve ser a soma dos valores de custeio e investimento.',
                        400
                    );

                // “VALOR TOTAL”  é a soma de “Custeio” + Investimento” + “Contrapartida”
                if (Number(dto.valor_total).toFixed(2) != (+dto.valor + +dto.valor_contrapartida).toFixed(2))
                    throw new HttpException(
                        'valor| Valor total deve ser a soma dos valores de repasse e contrapartida.',
                        400
                    );

                // TODO: quando o front-end começar a enviar os params de pct_custeio e pct_investimento, implementar a validação dos valores de porcentagem.
                const transferencia = await prismaTxn.transferencia.update({
                    where: { id },
                    data: {
                        valor: dto.valor,
                        valor_total: dto.valor_total,
                        valor_contrapartida: dto.valor_contrapartida,
                        custeio: dto.custeio,
                        pct_custeio: dto.pct_custeio,
                        investimento: dto.investimento,
                        pct_investimento: dto.pct_investimento,
                        dotacao: dto.dotacao,
                        ordenador_despesa: dto.ordenador_despesa,
                        gestor_contrato: dto.gestor_contrato,
                        banco_aceite: dto.banco_aceite,
                        conta_aceite: dto.conta_aceite,
                        conta_fim: dto.conta_fim,
                        agencia_aceite: dto.agencia_aceite,
                        agencia_fim: dto.agencia_fim,
                        banco_fim: dto.banco_fim,
                        empenho: dto.empenho,
                        criado_por: user.id,
                        atualizado_por: user.id,
                        atualizado_em: agora,
                        classificacao_id: dto.classificacao_id,
                    },
                    select: { id: true },
                });

                const self = await prismaTxn.transferencia.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        valor: true,
                        valor_total: true,
                        valor_contrapartida: true,
                        custeio: true,
                        investimento: true,
                        pendente_preenchimento_valores: true,
                        empenho: true,
                        objeto: true,
                        dotacao: true,
                        parlamentar: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                parlamentar_id: true,
                                partido_id: true,
                                cargo: true,
                                objeto: true,
                                valor: true,
                            },
                        },
                        distribuicao_recursos: {
                            where: {
                                removido_em: null,
                            },
                        },
                    },
                });

                if (
                    self.valor &&
                    self.valor_contrapartida &&
                    self.valor_total &&
                    self.pendente_preenchimento_valores == true
                ) {
                    await prismaTxn.transferencia.update({
                        where: { id },
                        data: {
                            pendente_preenchimento_valores: false,
                        },
                    });
                }

                // Criando a primeira distribuição.
                const jaTemDistribuicao = await prismaTxn.distribuicaoRecurso.count({
                    where: {
                        transferencia_id: transferencia.id,
                        removido_em: null,
                    },
                });

                if (!jaTemDistribuicao) {
                    const orgaoCasaCivil = await prismaTxn.orgao.findFirst({
                        where: {
                            removido_em: null,
                            sigla: 'SERI',
                        },
                        select: {
                            id: true,
                        },
                    });
                    if (!orgaoCasaCivil) throw new HttpException('Órgão da SERI não foi encontrado', 400);

                    await this.distribuicaoService.create(
                        {
                            // Para preencher o nome, extraimos os 100 primeiros caracteres do objeto.
                            nome: self.objeto.substring(0, 100),
                            transferencia_id: transferencia.id,
                            dotacao: self.dotacao ? self.dotacao : undefined,
                            valor: self.valor!.toNumber(),
                            valor_contrapartida: self.valor_contrapartida!.toNumber(),
                            valor_total: self.valor_total!.toNumber(),
                            custeio: dto.custeio,
                            investimento: dto.investimento,
                            empenho: self.empenho ?? false,
                            objeto: self.objeto,
                            orgao_gestor_id: orgaoCasaCivil.id,
                        },
                        user,
                        true,
                        prismaTxn
                    );
                }

                // Tratando controles de limites de valores.
                if (
                    dto.custeio != undefined ||
                    dto.investimento != undefined ||
                    dto.valor_contrapartida != undefined ||
                    dto.valor_total ||
                    dto.valor
                ) {
                    const outrasDistribuicoes = await prismaTxn.distribuicaoRecurso.findMany({
                        where: {
                            removido_em: null,
                            status: {
                                some: {
                                    OR: [
                                        {
                                            status_base: {
                                                valor_distribuicao_contabilizado: true,
                                            },
                                        },
                                        {
                                            status: {
                                                valor_distribuicao_contabilizado: true,
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                        select: {
                            custeio: true,
                            investimento: true,
                            valor_contrapartida: true,
                            valor_total: true,
                            valor: true,
                        },
                    });

                    let sumCusteio: number = 0;
                    let sumInvestimento: number = 0;
                    let sumContrapartida: number = 0;
                    let sumRepasse: number = 0;
                    let sumTotal: number = 0;

                    for (const distRow of outrasDistribuicoes) {
                        sumCusteio += distRow.custeio.toNumber();
                        sumContrapartida += distRow.valor_contrapartida.toNumber();
                        sumInvestimento += distRow.investimento.toNumber();
                        sumTotal += distRow.valor_total.toNumber();
                        sumRepasse += distRow.valor.toNumber();
                    }

                    if (self.custeio && dto.custeio != self.custeio.toNumber()) {
                        if (self.custeio && sumCusteio && sumCusteio > self.custeio.toNumber())
                            throw new HttpException(
                                'Soma de custeio de todas as distribuições não pode ser superior ao valor de custeio da transferência.',
                                400
                            );
                    }

                    if (self.investimento && dto.investimento != self.investimento.toNumber()) {
                        if (self.investimento && sumInvestimento && sumInvestimento > self.investimento.toNumber())
                            throw new HttpException(
                                'Soma de investimento de todas as distribuições não pode ser superior ao valor de investimento da transferência.',
                                400
                            );
                    }

                    if (self.valor_contrapartida && dto.valor_contrapartida != self.valor_contrapartida.toNumber()) {
                        if (
                            self.valor_contrapartida &&
                            sumContrapartida &&
                            sumContrapartida > self.valor_contrapartida.toNumber()
                        )
                            throw new HttpException(
                                'Soma de contrapartida de todas as distribuições não pode ser superior ao valor de contrapartida da transferência.',
                                400
                            );
                    }

                    if (self.valor_total && dto.valor_total != self.valor_total.toNumber()) {
                        if (self.valor_total && sumTotal && sumTotal > self.valor_total.toNumber())
                            throw new HttpException(
                                'Soma de total de todas as distribuições não pode ser superior ao valor total da transferência.',
                                400
                            );
                    }

                    if (self.valor && dto.valor != self.valor.toNumber()) {
                        if (self.valor && sumRepasse && sumRepasse > self.valor.toNumber())
                            throw new HttpException(
                                'Soma de repasse de todas as distribuições não pode ser superior ao valor de repasse da transferência.',
                                400
                            );
                    }
                }

                // Tratando upsert de parlamentares.
                const operations = [];
                if (dto.parlamentares?.length) {
                    const sumValor = dto.parlamentares
                        .filter((e) => e.valor)
                        .reduce((acc, curr) => acc + +curr.valor!, 0);

                    if (+sumValor > +dto.valor!)
                        throw new HttpException(
                            'parlamentares| A soma dos valores dos parlamentares não pode superar o valor de repasse da transferência.',
                            400
                        );

                    for (const relParlamentar of dto.parlamentares) {
                        if (relParlamentar.id) {
                            const row = self.parlamentar.find((e) => e.id == relParlamentar.id);
                            if (!row) throw new HttpException('id| Linha não encontrada.', 400);

                            if (
                                row.objeto !== relParlamentar.objeto ||
                                row.valor?.toNumber() !== relParlamentar.valor ||
                                row.parlamentar_id !== relParlamentar.parlamentar_id
                            ) {
                                // Caso o valor seja modificado, deve ser verificado se o novo valor é, no mínimo, superior ao valor cadastrado em distribuições.
                                if (relParlamentar.valor && row.valor?.toNumber() != relParlamentar.valor) {
                                    const distribuicoes = await prismaTxn.distribuicaoParlamentar.findMany({
                                        where: {
                                            distribuicao_recurso: {
                                                transferencia_id: id,
                                                removido_em: null,
                                            },
                                            parlamentar_id: row.parlamentar_id,
                                            removido_em: null,
                                            valor: { not: null },
                                        },
                                        select: {
                                            valor: true,
                                        },
                                    });

                                    const sumDistribuicoes = distribuicoes.reduce(
                                        (acc, curr) => acc + curr.valor!.toNumber(),
                                        0
                                    );

                                    if (+sumDistribuicoes > +relParlamentar.valor)
                                        throw new HttpException(
                                            'valor| O novo valor do parlamentar não pode ser inferior ao valor já distribuído.',
                                            400
                                        );
                                }

                                operations.push(
                                    prismaTxn.transferenciaParlamentar.update({
                                        where: { id: relParlamentar.id },
                                        data: {
                                            valor: relParlamentar.valor,
                                            objeto: relParlamentar.objeto,
                                            atualizado_em: agora,
                                            atualizado_por: user.id,
                                        },
                                    })
                                );
                            }
                        } else {
                            // Não haverá create aqui.
                        }
                    }
                }

                if (operations.length) await Promise.all(operations);

                return transferencia;
            }
        );

        this.updateVetoresBusca(updated.id).catch((err) => {
            // Optional: log if the background task fails for some reason
            console.error(`Background task updateVetoresBusca failed for transferencia ${updated.id}`, err);
        });

        return updated;
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    permissionSet(user: PessoaFromJwt) {
        const permissionsSet: Prisma.Enumerable<Prisma.TransferenciaWhereInput> = [];

        if (!user.hasSomeRoles(['CadastroTransferencia.administrador'])) {
            if (!user.orgao_id) throw new BadRequestException('Usuário sem órgão associado.');

            permissionsSet.push({
                distribuicao_recursos: {
                    some: {
                        removido_em: null,
                        orgao_gestor_id: user.orgao_id,
                    },
                },
            });
        }

        return permissionsSet;
    }

    async findAllTransferencia(
        filters: FilterTransferenciaDto,
        user: PessoaFromJwt
    ): Promise<PaginatedDto<TransferenciaDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const palavrasChave = await this.buscaIdsPalavraChave(filters.palavra_chave);

        const rows = await this.prisma.transferencia.findMany({
            where: {
                removido_em: null,
                AND: this.permissionSet(user),
                esfera: filters.esfera,
                pendente_preenchimento_valores:
                    filters.preenchimento_completo != undefined ? !filters.preenchimento_completo : undefined,
                ano: filters.ano,

                // Filtro por palavras-chave com tsvector
                id: {
                    in: palavrasChave != undefined ? palavrasChave : undefined,
                },
            },
            orderBy: [{ ano: 'desc' }, { identificador_nro: 'desc' }],
            skip: offset,
            take: ipp + 1,
            select: {
                id: true,
                identificador: true,
                ano: true,
                objeto: true,
                esfera: true,
                detalhamento: true,
                clausula_suspensiva: true,
                clausula_suspensiva_vencimento: true,
                normativa: true,
                observacoes: true,
                programa: true,
                pendente_preenchimento_valores: true,
                valor: true,
                secretaria_concedente_str: true,
                workflow_etapa_atual: {
                    select: {
                        etapa_fluxo: true,
                    },
                },
                workflow_fase_atual: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        fase: true,
                    },
                },
                andamentoWorkflow: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        workflow_etapa_id: true,
                        workflow_fase_id: true,
                        workflow_situacao: {
                            select: {
                                situacao: true,
                            },
                        },
                    },
                },
                tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },

                orgao_concedente: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },

                parlamentar: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        cargo: true,
                        valor: true,
                        objeto: true,
                        partido: {
                            select: {
                                id: true,
                                sigla: true,
                                nome: true,
                            },
                        },
                        parlamentar: {
                            select: {
                                id: true,
                                nome_popular: true,
                                nome: true,
                            },
                        },
                    },
                },
                classificacao_id: true,
                classificacao: {
                    select: {
                        id: true,
                        nome: true,
                        transferencia_tipo: {
                            select: {
                                id: true,
                                nome: true,
                                esfera: true,
                                categoria: true,
                            },
                        },
                    },
                },
                distribuicao_recursos: {
                    where: { removido_em: null },
                    select: {
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                    },
                },
            },
        });

        if (rows.length > ipp) {
            tem_mais = true;
            rows.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        const linhas = rows.map((r) => {
            const faseStatusAtual = r.workflow_fase_atual
                ? r.andamentoWorkflow.find((e) => e.workflow_fase_id == r.workflow_fase_atual!.id)?.workflow_situacao
                      ?.situacao
                : null;

            return {
                id: r.id,
                ano: r.ano,
                identificador: r.identificador,
                valor: r.valor,
                partido: r.parlamentar
                    .filter((e) => e.partido)
                    .map((e) => {
                        return { id: e.partido!.id, sigla: e.partido!.sigla };
                    }),
                parlamentar: r.parlamentar.length
                    ? r.parlamentar.map((e) => {
                          return {
                              id: e.parlamentar.id,
                              nome: e.parlamentar.nome,
                              nome_popular: e.parlamentar.nome_popular,
                          };
                      })
                    : null,
                tipo: r.tipo,
                objeto: r.objeto,
                detalhamento: r.detalhamento,
                clausula_suspensiva: r.clausula_suspensiva,
                clausula_suspensiva_vencimento: Date2YMD.toStringOrNull(r.clausula_suspensiva_vencimento),
                normativa: r.normativa,
                observacoes: r.observacoes,
                programa: r.programa,
                pendente_preenchimento_valores: r.pendente_preenchimento_valores,
                esfera: r.esfera,
                orgao_concedente: r.orgao_concedente,
                secretaria_concedente: r.secretaria_concedente_str,
                andamento_etapa: r.workflow_etapa_atual ? r.workflow_etapa_atual.etapa_fluxo : null,
                andamento_fase: r.workflow_fase_atual ? r.workflow_fase_atual.fase : null,
                fase_status: r.workflow_fase_atual && faseStatusAtual ? faseStatusAtual : null,
                classificacao: r.classificacao,
                orgao_gestor: r.distribuicao_recursos.length
                    ? r.distribuicao_recursos.reduce((acc: IdSiglaDescricao[], curr) => {
                          // Se o órgão gestor já foi adicionado, não adiciona novamente.
                          if (!acc.find((e) => e.id === curr.orgao_gestor.id)) {
                              acc.push({
                                  id: curr.orgao_gestor.id,
                                  sigla: curr.orgao_gestor.sigla,
                                  descricao: curr.orgao_gestor.descricao,
                              });
                          }
                          return acc;
                      }, [] as IdSiglaDescricao[])
                    : null,
            } satisfies TransferenciaDto;
        });

        return {
            linhas: linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async buscaIdsPalavraChave(input: string | undefined): Promise<number[] | undefined> {
        return PrismaHelpers.buscaIdsPalavraChave(this.prisma, 'transferencia', input);
    }

    async findOneTransferencia(id: number, user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
        const row = await this.prisma.transferencia.findFirst({
            where: {
                id,
                removido_em: null,
                AND: this.permissionSet(user),
            },
            select: {
                id: true,
                identificador: true,
                ano: true,
                objeto: true,
                detalhamento: true,
                clausula_suspensiva: true,
                clausula_suspensiva_vencimento: true,
                normativa: true,
                observacoes: true,
                programa: true,
                empenho: true,
                pendente_preenchimento_valores: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                custeio: true,
                pct_custeio: true,
                investimento: true,
                pct_investimento: true,
                emenda: true,
                dotacao: true,
                demanda: true,
                banco_fim: true,
                conta_fim: true,
                agencia_fim: true,
                banco_aceite: true,
                conta_aceite: true,
                nome_programa: true,
                agencia_aceite: true,
                emenda_unitaria: true,
                gestor_contrato: true,
                ordenador_despesa: true,
                numero_identificacao: true,
                interface: true,
                esfera: true,
                secretaria_concedente_str: true,
                workflow_id: true,
                parlamentar: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        cargo: true,
                        objeto: true,
                        valor: true,
                        parlamentar_id: true,
                        parlamentar: {
                            select: {
                                id: true,
                                nome: true,
                                nome_popular: true,
                            },
                        },
                        partido_id: true,
                        partido: {
                            select: {
                                id: true,
                                sigla: true,
                                nome: true,
                            },
                        },
                    },
                },
                orgao_concedente: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
                distribuicao_recursos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        valor: true,
                        status: {
                            take: 1,
                            where: { removido_em: null },
                            orderBy: { data_troca: 'desc' },
                            select: {
                                status: {
                                    select: {
                                        tipo: true,
                                        permite_novos_registros: true,
                                        valor_distribuicao_contabilizado: true,
                                    },
                                },
                                status_base: {
                                    select: {
                                        tipo: true,
                                        permite_novos_registros: true,
                                        valor_distribuicao_contabilizado: true,
                                    },
                                },
                            },
                        },
                        vinculos: {
                            where: { removido_em: null, invalidado_em: null },
                            select: {
                                projeto: {
                                    select: {
                                        tipo: true,
                                    },
                                },
                                meta: {
                                    select: {
                                        pdm: {
                                            select: {
                                                tipo: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                classificacao_id: true,
                classificacao: {
                    select: {
                        id: true,
                        nome: true,
                        transferencia_tipo: {
                            select: {
                                id: true,
                                nome: true,
                                esfera: true,
                                categoria: true,
                            },
                        },
                    },
                },
            },
        });
        if (!row) throw new HttpException('id| Transferência não encontrada.', 404);

        return {
            id: row.id,
            identificador: row.identificador,
            ano: row.ano,
            objeto: row.objeto,
            detalhamento: row.detalhamento,
            clausula_suspensiva: row.clausula_suspensiva,
            clausula_suspensiva_vencimento: Date2YMD.toStringOrNull(row.clausula_suspensiva_vencimento),
            normativa: row.normativa,
            observacoes: row.observacoes,
            programa: row.programa,
            empenho: row.empenho,
            pendente_preenchimento_valores: row.pendente_preenchimento_valores,
            valor: row.valor,
            valor_total: row.valor_total,
            valor_contrapartida: row.valor_contrapartida,
            custeio: row.custeio,
            pct_custeio: row.pct_custeio,
            investimento: row.investimento,
            pct_investimento: row.pct_investimento,
            emenda: row.emenda,
            dotacao: row.dotacao,
            demanda: row.demanda,
            banco_fim: row.banco_fim,
            conta_fim: row.conta_fim,
            agencia_fim: row.agencia_fim,
            banco_aceite: row.banco_aceite,
            conta_aceite: row.conta_aceite,
            nome_programa: row.nome_programa,
            agencia_aceite: row.agencia_aceite,
            emenda_unitaria: row.emenda_unitaria,
            gestor_contrato: row.gestor_contrato,
            ordenador_despesa: row.ordenador_despesa,
            numero_identificacao: row.numero_identificacao,
            tipo: row.tipo,
            workflow_id: row.workflow_id,
            interface: row.interface,
            esfera: row.esfera,
            valor_distribuido: row.distribuicao_recursos
                .filter((e) => {
                    const statusRow = e.status[0];
                    if (!statusRow) return true;

                    const valor_contabilizado = statusRow.status
                        ? statusRow.status?.valor_distribuicao_contabilizado
                        : statusRow.status_base?.valor_distribuicao_contabilizado;
                    return valor_contabilizado;
                })
                .reduce((acc, curr) => acc + curr.valor.toNumber(), 0),
            parlamentares: row.parlamentar,
            bloco_nota_token: await this.blocoNotaService.getTokenFor({ transferencia_id: row.id }, user),
            secretaria_concedente: row.secretaria_concedente_str,
            orgao_concedente: row.orgao_concedente,
            classificacao: row.classificacao,
            classificacao_id: row.classificacao_id,

            modulos_vinculados: row.distribuicao_recursos
                .flatMap((dr) => dr.vinculos)
                .reduce((uniqueModules, v) => {
                    if (v.projeto) {
                        switch (v.projeto.tipo) {
                            case TipoProjeto.PP:
                                if (!uniqueModules.includes(ModuloSistema.Projetos)) {
                                    uniqueModules.push(ModuloSistema.Projetos);
                                }
                                break;
                            case TipoProjeto.MDO:
                                if (!uniqueModules.includes(ModuloSistema.MDO)) {
                                    uniqueModules.push(ModuloSistema.MDO);
                                }
                                break;
                        }
                    }

                    if (v.meta && v.meta.pdm) {
                        switch (v.meta.pdm.tipo) {
                            case TipoPdm.PDM:
                                if (!uniqueModules.includes(ModuloSistema.PDM)) {
                                    uniqueModules.push(ModuloSistema.PDM);
                                }
                                break;
                            case TipoPdm.PS:
                                if (!uniqueModules.includes(ModuloSistema.PlanoSetorial)) {
                                    uniqueModules.push(ModuloSistema.PlanoSetorial);
                                }
                                break;
                        }
                    }

                    return uniqueModules;
                }, [] as ModuloSistema[]),
        } satisfies TransferenciaDetailDto;
    }

    async removeTransferencia(id: number, user: PessoaFromJwt) {
        await this.prisma.transferencia.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async append_document(transferenciaId: number, dto: CreateTransferenciaAnexoDto, user: PessoaFromJwt) {
        const arquivoId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const r = await prismaTx.transferenciaAnexo.create({
                    data: {
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                        arquivo_id: arquivoId,
                        transferencia_id: transferenciaId,
                        descricao: dto.descricao,
                        data: dto.data,
                    },
                    select: {
                        id: true,
                    },
                });

                if (dto.diretorio_caminho)
                    await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token, prismaTx);

                return r;
            }
        );

        return { id: documento.id };
    }

    async list_document(transferenciaId: number, user: PessoaFromJwt) {
        const arquivos: TransferenciaAnexoDto[] = await this.findAllDocumentos(transferenciaId, user);

        return arquivos;
    }

    private async findAllDocumentos(transferenciaId: number, user: PessoaFromJwt): Promise<TransferenciaAnexoDto[]> {
        const documentosDB = await this.prisma.transferenciaAnexo.findMany({
            where: { transferencia_id: transferenciaId, removido_em: null },
            orderBy: [{ descricao: 'asc' }, { data: 'asc' }],
            select: {
                id: true,
                descricao: true,
                data: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        const pode_editar: boolean = user.hasSomeRoles(['SMAE.gestor_distribuicao_recurso']) ? false : true;

        const documentosRet: TransferenciaAnexoDto[] = documentosDB.map((d) => {
            const link = this.uploadService.getDownloadToken(d.arquivo.id, '30d').download_token;
            return {
                id: d.id,
                data: d.data,
                descricao: d.descricao,
                pode_editar: pode_editar,
                arquivo: {
                    descricao: null,
                    id: d.arquivo.id,
                    tamanho_bytes: d.arquivo.tamanho_bytes,
                    nome_original: d.arquivo.nome_original,
                    diretorio_caminho: d.arquivo.diretorio_caminho,
                    download_token: link,
                } satisfies ArquivoBaseDto,
            };
        });

        return documentosRet;
    }

    async updateDocumento(
        transferenciaId: number,
        documentoId: number,
        dto: UpdateTransferenciaAnexoDto,
        user: PessoaFromJwt
    ) {
        this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                return await prismaTx.transferenciaAnexo.update({
                    where: {
                        id: documentoId,
                        transferencia_id: transferenciaId,
                    },
                    data: {
                        descricao: dto.descricao,
                        data: dto.data,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });
            }
        );

        return { id: documento.id };
    }

    async remove_document(transferenciaId: number, transferenciaAnexoId: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaAnexo.updateMany({
            where: { transferencia_id: transferenciaId, removido_em: null, id: transferenciaAnexoId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async getCronogramaCabecalho(transferenciaId: number): Promise<TarefaCronogramaDto | null> {
        const transferenciaCronograma = await this.prisma.tarefaCronograma.findFirst({
            where: {
                transferencia_id: transferenciaId,
                removido_em: null,
            },
            select: {
                id: true,
                previsao_custo: true,
                previsao_duracao: true,
                previsao_inicio: true,
                previsao_termino: true,

                atraso: true,
                em_atraso: true,
                projecao_termino: true,
                realizado_duracao: true,
                percentual_concluido: true,

                realizado_inicio: true,
                realizado_termino: true,
                realizado_custo: true,
                tolerancia_atraso: true,
                percentual_atraso: true,
                status_cronograma: true,

                transferencia: {
                    select: {
                        nivel_maximo_tarefa: true,
                    },
                },
            },
        });
        if (!transferenciaCronograma) return null;

        return {
            id: transferenciaCronograma.id,
            previsao_custo: transferenciaCronograma.previsao_custo,
            previsao_duracao: transferenciaCronograma.previsao_duracao,
            previsao_inicio: Date2YMD.toStringOrNull(transferenciaCronograma.previsao_inicio),
            previsao_termino: Date2YMD.toStringOrNull(transferenciaCronograma.previsao_termino),
            atraso: transferenciaCronograma.atraso,
            em_atraso: transferenciaCronograma.em_atraso,
            projecao_termino: Date2YMD.toStringOrNull(transferenciaCronograma.projecao_termino),
            realizado_duracao: transferenciaCronograma.realizado_duracao,
            percentual_concluido: transferenciaCronograma.percentual_concluido,
            realizado_inicio: Date2YMD.toStringOrNull(transferenciaCronograma.realizado_inicio),
            realizado_termino: Date2YMD.toStringOrNull(transferenciaCronograma.realizado_termino),
            realizado_custo: transferenciaCronograma.realizado_custo,
            tolerancia_atraso: transferenciaCronograma.tolerancia_atraso,
            percentual_atraso: transferenciaCronograma.percentual_atraso,
            status_cronograma: transferenciaCronograma.status_cronograma,
            nivel_maximo_tarefa: transferenciaCronograma.transferencia!.nivel_maximo_tarefa,
        };
    }

    private async startWorkflow(
        transferencia_id: number,
        workflow_id: number,
        prismaTxn: Prisma.TransactionClient,
        user: PessoaFromJwt
    ) {
        // Garantindo que a transferência está com workflow e cronograma limpos
        const tarefasVelhas = await prismaTxn.tarefa.count({
            where: {
                removido_em: null,
                tarefa_cronograma: {
                    transferencia_id: transferencia_id,
                    removido_em: null,
                },
            },
        });
        if (tarefasVelhas > 0) await this.limparWorkflowCronograma(transferencia_id, user, prismaTxn);

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
                            'Fase é de responsabilidade própria, mas não foi encontrado órgão da SERI.',
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
                removido_em: null,
            },
            select: {
                workflow_etapa_id: true,
                workflow_fase_id: true,
                tarefaEspelhada: {
                    select: {
                        id: true,
                    },
                },
                tarefas: {
                    where: { removido_em: null },
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

        if (!andamentoPrimeiraFase.tarefaEspelhada.length)
            throw new HttpException(
                'Erro Interno / Configuração? Não foi possível encontrar tarefa espelhada para o primeiro nível do cronograma.',
                400
            );

        await prismaTxn.tarefa.update({
            where: { id: andamentoPrimeiraFase.tarefaEspelhada[0].id },
            data: {
                inicio_real: new Date(Date.now()),
            },
        });

        for (const tarefa of andamentoPrimeiraFase.tarefas) {
            // Sempre só tem uma tarefa, na table esta FK é unique.
            // No entanto, escrevendo com for const. De maneira defensiva.
            for (const tarefaEspelhada of tarefa.tarefaEspelhada) {
                await prismaTxn.tarefa.update({
                    where: { id: tarefaEspelhada.id },
                    data: {
                        inicio_real: new Date(Date.now()),
                    },
                });
            }
        }

        // Atualizando cols de controle na transferência
        await prismaTxn.transferencia.update({
            where: { id: transferencia_id },
            data: {
                workflow_etapa_atual_id: andamentoPrimeiraFase.workflow_etapa_id,
                workflow_fase_atual_id: andamentoPrimeiraFase.workflow_fase_id,
            },
        });
    }

    async limparWorkflowCronograma(
        transferencia_id: number,
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient | undefined
    ) {
        const agora = new Date(Date.now());

        // TODO: tornar compatível com troca de tipo.
        // Para essa func ser chamada no update.

        const update = async (prismaTxn: Prisma.TransactionClient) => {
            await prismaTxn.transferenciaAndamento.updateMany({
                where: { transferencia_id: transferencia_id },
                data: {
                    removido_em: agora,
                    removido_por: user.id,
                },
            });

            await prismaTxn.transferenciaAndamentoTarefa.updateMany({
                where: {
                    transferencia_andamento: {
                        transferencia_id: transferencia_id,
                    },
                },
                data: {
                    removido_em: agora,
                    removido_por: user.id,
                },
            });

            await prismaTxn.tarefa.updateMany({
                where: {
                    tarefa_cronograma: {
                        transferencia_id: transferencia_id,
                    },
                },
                data: {
                    transferencia_fase_id: null,
                    transferencia_tarefa_id: null,
                    removido_em: agora,
                    removido_por: user.id,
                },
            });

            await prismaTxn.tarefaCronograma.updateMany({
                where: { transferencia_id: transferencia_id },
                data: {
                    removido_em: agora,
                    removido_por: user.id,
                },
            });

            // Inserindo row no histórico de alterações.
            await prismaTxn.transferenciaHistorico.create({
                data: {
                    transferencia_id: transferencia_id,
                    acao: TransferenciaHistoricoAcao.DelecaoWorkflow,
                    criado_por: user.id,
                    criado_em: agora,
                },
            });
        };

        if (prismaTx) {
            return update(prismaTx);
        } else {
            return this.prisma.$transaction(update, {
                isolationLevel: 'Serializable',
                maxWait: 20000,
                timeout: 50000,
            });
        }
    }

    async findTransferenciaHistorico(
        id: number,
        filters: FilterTransferenciaHistoricoDto,
        user: PessoaFromJwt
    ): Promise<TransferenciaHistoricoDto[]> {
        // Disparando o findOne pois lá já há validações.
        await this.findOneTransferencia(id, user);

        const rows = await this.prisma.transferenciaHistorico.findMany({
            where: {
                transferencia_id: id,
                acao: {
                    in: filters.acao,
                },
            },
            orderBy: { criado_em: 'desc' },
            select: {
                acao: true,
                dados_extra: true,
                criado_em: true,
                tipo_antigo: {
                    select: {
                        id: true,
                        nome: true,
                        esfera: true,
                    },
                },
                tipo_novo: {
                    select: {
                        id: true,
                        nome: true,
                        esfera: true,
                    },
                },
                criador: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    },
                },
            },
        });

        return rows.map((r) => {
            return {
                acao: r.acao,
                dados_extra: typeof r.dados_extra === 'string' ? JSON.parse(r.dados_extra) : r.dados_extra,
                criado_em: r.criado_em,
                tipo_antigo: r.tipo_antigo,
                tipo_novo: r.tipo_novo,
                criador: r.criador,
            } satisfies TransferenciaHistoricoDto;
        });
    }

    /**
     * Rebuilds the full-text search vector for a given transferencia.
     * This should be called outside of any transaction that modifies its child records.
     * @param transferenciaId The ID of the transferencia to update.
     */
    async updateVetoresBusca(transferenciaId: number): Promise<void> {
        try {
            await this.prisma.$executeRaw`
                UPDATE transferencia
                SET vetores_busca = f_rebuild_transferencia_tsvector(${transferenciaId}::integer)
                WHERE id = ${transferenciaId};
            `;
        } catch (error) {
            // Log the error but don't let it crash the main flow.
            console.error(
                `[updateVetoresBusca] Failed to update tsvector for transferencia ${transferenciaId}:`,
                error
            );
        }
    }
}
