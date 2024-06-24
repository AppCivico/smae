import { BadRequestException, HttpException, Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DistribuicaoStatusTipo, Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { TarefaCronogramaDto } from 'src/common/dto/TarefaCronograma.dto';
import { PaginatedDto } from 'src/common/dto/paginated.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { UploadService } from 'src/upload/upload.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { BlocoNotaService } from '../../bloco-nota/bloco-nota/bloco-nota.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransferenciaAnexoDto, CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { FilterTransferenciaDto } from './dto/filter-transferencia.dto';
import {
    CompletarTransferenciaDto,
    UpdateTransferenciaAnexoDto,
    UpdateTransferenciaDto,
} from './dto/update-transferencia.dto';
import { TransferenciaAnexoDto, TransferenciaDetailDto, TransferenciaDto } from './entities/transferencia.dto';
import { WorkflowService } from 'src/workflow/configuracao/workflow.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { UpdateTarefaDto } from 'src/pp/tarefa/dto/update-tarefa.dto';
import { DistribuicaoRecursoService } from 'src/distribuicao-recurso/distribuicao-recurso.service';

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
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const tipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: { id: dto.tipo_id, removido_em: null },
                });
                if (!tipoExiste) throw new HttpException('tipo_id| Tipo não encontrado.', 400);

                if (dto.parlamentar_id != undefined) {
                    const parlamentarExiste = await prismaTxn.parlamentar.count({
                        where: { id: dto.parlamentar_id, removido_em: null },
                    });

                    if (!parlamentarExiste) throw new HttpException('parlamentar_id| Parlamentar não encontrado.', 400);
                }

                if (dto.partido_id != undefined) {
                    const partidoExiste = await prismaTxn.partido.count({
                        where: { id: dto.partido_id, removido_em: null },
                    });

                    if (!partidoExiste) throw new HttpException('partido_id| Partido não encontrado.', 400);
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
                    throw new Error(`Erro ao gerar identificador, já está em uso: ${identificador}`);

                const transferencia = await prismaTxn.transferencia.create({
                    data: {
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_str: dto.secretaria_concedente,
                        partido_id: dto.partido_id,
                        parlamentar_id: dto.parlamentar_id,
                        objeto: dto.objeto,
                        interface: dto.interface,
                        esfera: dto.esfera,
                        identificador: identificador,
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
                        cargo: dto.cargo,
                        workflow_id: workflow_id,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                if (workflow_id) await this.startWorkflow(transferencia.id, workflow_id, prismaTxn, user);

                return transferencia;
            }
        );

        // Disparando update para validar topologia.
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
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

                    await this.tarefaService.update({ transferencia_id: created.id }, tarefa.id, dto, user);
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
                console.log(row);
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
                    console.log('tarefa filha');
                    console.log(tarefaFilha);

                    if (!tarefaFilha) throw new Error('Erro ao encontrar tarefa filha para base de projeção.');

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
                    if (!tarefaIrma) throw new Error('Erro ao encontrar tarefa filha para base de projeção.');

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

        return created;
    }

    async updateTransferencia(id: number, dto: UpdateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
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
                    },
                });
                if (!self) throw new HttpException('id| Transferência não encontrada', 404);

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
                        throw new Error(`Erro ao gerar identificador, já está em uso: ${identificador}`);
                }

                let workflow_id: number | undefined;

                if (!self.workflow_id) {
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
                    if (workflow) workflow_id = workflow?.id;
                }

                const transferencia = await prismaTxn.transferencia.update({
                    where: { id },
                    data: {
                        identificador: identificador,
                        workflow_id: workflow_id,
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_str: dto.secretaria_concedente,
                        partido_id: dto.partido_id,
                        parlamentar_id: dto.parlamentar_id,
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
                        cargo: dto.cargo,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
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

                if (workflow_id) await this.startWorkflow(id, workflow_id, prismaTxn, user);

                return transferencia;
            }
        );

        return updated;
    }

    async completeTransferencia(
        id: number,
        dto: CompletarTransferenciaDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                // “VALOR DO REPASSE”  é a soma de “Custeio” + Investimento”
                if (dto.valor != dto.custeio + dto.investimento)
                    throw new HttpException(
                        'valor| Valor do repasse deve ser a soma dos valores de custeio e investimento.',
                        400
                    );

                // “VALOR TOTAL”  é a soma de “Custeio” + Investimento” + “Contrapartida”
                if (dto.valor_total != dto.valor + dto.valor_contrapartida)
                    throw new HttpException(
                        'valor| Valor total deve ser a soma dos valores de repasse e contrapartida.',
                        400
                    );

                const transferencia = await prismaTxn.transferencia.update({
                    where: { id },
                    data: {
                        valor: dto.valor,
                        valor_total: dto.valor_total,
                        valor_contrapartida: dto.valor_contrapartida,
                        custeio: dto.custeio,
                        investimento: dto.investimento,
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
                        atualizado_em: new Date(Date.now()),
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
                    if (!orgaoCasaCivil) throw new HttpException('Órgão da casa civil não foi encontrado', 400);

                    // Criada com status base de "Registrada".
                    const status = await prismaTxn.distribuicaoStatusBase.findFirstOrThrow({
                        where: {
                            tipo: DistribuicaoStatusTipo.Registrada,
                        },
                        select: {
                            id: true,
                        },
                    });

                    const distribuicao = await this.distribuicaoService.create(
                        {
                            transferencia_id: transferencia.id,
                            dotacao: self.dotacao ? self.dotacao : undefined,
                            valor: self.valor!.toNumber(),
                            valor_contrapartida: self.valor_contrapartida!.toNumber(),
                            valor_total: self.valor_total!.toNumber(),
                            custeio: self.custeio!.toNumber(),
                            investimento: self.investimento!.toNumber(),
                            empenho: self.empenho ?? false,
                            objeto: self.objeto,
                            orgao_gestor_id: orgaoCasaCivil.id,
                        },
                        user
                    );

                    await prismaTxn.distribuicaoRecursoStatus.create({
                        data: {
                            distribuicao_id: distribuicao.id,
                            status_base_id: status.id,
                            data_troca: new Date(Date.now()),
                            orgao_responsavel_id: orgaoCasaCivil.id,
                            nome_responsavel: 'SERI',
                            motivo: 'Distribuição criada automaticamente',
                            criado_por: user.id,
                        },
                    });
                }

                if (
                    dto.custeio != undefined ||
                    dto.investimento != undefined ||
                    dto.valor_contrapartida != undefined ||
                    dto.valor_total
                ) {
                    const outrasDistribuicoes = await prismaTxn.distribuicaoRecurso.findMany({
                        where: {
                            removido_em: null,
                            status: {
                                some: {
                                    OR: [
                                        {
                                            AND: [
                                                { NOT: { status_base: { tipo: DistribuicaoStatusTipo.Declinada } } },
                                                {
                                                    NOT: {
                                                        status_base: { tipo: DistribuicaoStatusTipo.Redirecionada },
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            AND: [
                                                { NOT: { status: { tipo: DistribuicaoStatusTipo.Declinada } } },
                                                { NOT: { status: { tipo: DistribuicaoStatusTipo.Redirecionada } } },
                                            ],
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
                        },
                    });

                    let sumCusteio: number = 0;
                    let sumInvestimento: number = 0;
                    let sumContrapartida: number = 0;
                    let sumTotal: number = 0;

                    for (const distRow of outrasDistribuicoes) {
                        sumCusteio += distRow.custeio.toNumber();
                        sumContrapartida += distRow.valor_contrapartida.toNumber();
                        sumInvestimento += distRow.investimento.toNumber();
                        sumTotal += distRow.valor_total.toNumber();
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
                }

                return transferencia;
            }
        );

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
            orderBy: [{ pendente_preenchimento_valores: 'asc' }, { ano: 'asc' }],
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
                    select: {
                        fase: true,
                    },
                },

                tipo: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },

                partido: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },

                orgao_concedente: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },
            },
        });

        if (rows.length > ipp) {
            tem_mais = true;
            rows.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        const linhas = rows
            .map((r) => {
                return {
                    id: r.id,
                    ano: r.ano,
                    identificador: r.identificador,
                    valor: r.valor,
                    partido: r.partido,
                    tipo: r.tipo,
                    objeto: r.objeto,
                    detalhamento: r.detalhamento,
                    clausula_suspensiva: r.clausula_suspensiva,
                    clausula_suspensiva_vencimento: r.clausula_suspensiva_vencimento,
                    normativa: r.normativa,
                    observacoes: r.observacoes,
                    programa: r.programa,
                    pendente_preenchimento_valores: r.pendente_preenchimento_valores,
                    esfera: r.esfera,
                    orgao_concedente: r.orgao_concedente,
                    secretaria_concedente: r.secretaria_concedente_str,
                    andamento_etapa: r.workflow_etapa_atual ? r.workflow_etapa_atual.etapa_fluxo : null,
                    andamento_fase: r.workflow_fase_atual ? r.workflow_fase_atual.fase : null,
                };
            })
            .sort((a, b) => {
                const [idA, yearA] = a.identificador.split('/').map(Number);
                const [idB, yearB] = b.identificador.split('/').map(Number);

                if (yearA !== yearB) {
                    return yearA - yearB;
                }

                return idA - idB;
            });

        return {
            linhas: linhas,
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
        };
    }

    async buscaIdsPalavraChave(input: string | undefined): Promise<number[] | undefined> {
        let palavrasChave: number[] | undefined = undefined;
        if (input) {
            const rows: { id: number }[] = await this.prisma
                .$queryRaw`SELECT id FROM transferencia WHERE vetores_busca @@ plainto_tsquery('simple', ${input})`;
            palavrasChave = rows.map((row) => row.id);
        }
        return palavrasChave;
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
                investimento: true,
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
                cargo: true,
                secretaria_concedente_str: true,
                workflow_id: true,
                partido: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
                parlamentar: {
                    select: {
                        id: true,
                        nome: true,
                        nome_popular: true,
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
            },
        });
        if (!row) throw new HttpException('id| Transferência não encontrada.', 404);

        return {
            ...row,
            bloco_nota_token: await this.blocoNotaService.getTokenFor({ transferencia_id: row.id }, user),
            secretaria_concedente: row.secretaria_concedente_str,
        };
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
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const arquivo = await prismaTx.arquivo.findFirstOrThrow({
                    where: { id: arquivoId },
                    select: { descricao: true },
                });

                return await prismaTx.transferenciaAnexo.create({
                    data: {
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                        arquivo_id: arquivoId,
                        transferencia_id: transferenciaId,
                        descricao: dto.descricao || arquivo.descricao,
                        data: dto.data,
                    },
                    select: {
                        id: true,
                    },
                });
            }
        );

        return { id: documento.id };
    }

    async list_document(transferenciaId: number, user: PessoaFromJwt) {
        const arquivos: TransferenciaAnexoDto[] = await this.findAllDocumentos(transferenciaId);
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos;
    }

    private async findAllDocumentos(transferenciaId: number): Promise<TransferenciaAnexoDto[]> {
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
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        const documentosRet: TransferenciaAnexoDto[] = documentosDB.map((d) => {
            return {
                id: d.id,
                data: d.data,
                descricao: d.descricao,
                arquivo: {
                    id: d.arquivo.id,
                    tamanho_bytes: d.arquivo.tamanho_bytes,
                    descricao: d.arquivo.descricao,
                    nome_original: d.arquivo.nome_original,
                    diretorio_caminho: d.arquivo.diretorio_caminho,
                    data: d.data,
                    TipoDocumento: d.arquivo.TipoDocumento,
                },
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
            previsao_inicio: transferenciaCronograma.previsao_inicio,
            previsao_termino: transferenciaCronograma.previsao_termino,
            atraso: transferenciaCronograma.atraso,
            em_atraso: transferenciaCronograma.em_atraso,
            projecao_termino: transferenciaCronograma.projecao_termino,
            realizado_duracao: transferenciaCronograma.realizado_duracao,
            percentual_concluido: transferenciaCronograma.percentual_concluido,
            realizado_inicio: transferenciaCronograma.realizado_inicio,
            realizado_termino: transferenciaCronograma.realizado_termino,
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
                workflow_etapa_id: true,
                workflow_fase_id: true,
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
}
