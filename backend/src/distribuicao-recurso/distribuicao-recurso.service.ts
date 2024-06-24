import { HttpException, Injectable } from '@nestjs/common';
import { DistribuicaoStatusTipo, Prisma, WorkflowResponsabilidade } from '@prisma/client';
import { CreateDistribuicaoRecursoDto } from './dto/create-distribuicao-recurso.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import {
    DistribuicaoHistoricoStatusDto,
    DistribuicaoRecursoDetailDto,
    DistribuicaoRecursoDto,
} from './entities/distribuicao-recurso.entity';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import { FilterDistribuicaoRecursoDto } from './dto/filter-distribuicao-recurso.dto';
import { formataSEI } from 'src/common/formata-sei';
import { BlocoNotaService } from '../bloco-nota/bloco-nota/bloco-nota.service';
import { NotaService } from '../bloco-nota/nota/nota.service';
import { AvisoEmailService } from '../aviso-email/aviso-email.service';
import { DateTime } from 'luxon';

type OperationsRegistroSEI = {
    id?: number;
    nome: string | null;
    processo_sei: string;
}[];

@Injectable()
export class DistribuicaoRecursoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly blocoNotaService: BlocoNotaService,
        private readonly notaService: NotaService,
        private readonly avisoEmailService: AvisoEmailService
    ) {}

    async create(dto: CreateDistribuicaoRecursoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const orgaoGestorExiste = await this.prisma.orgao.count({
            where: {
                id: dto.orgao_gestor_id,
                removido_em: null,
            },
        });
        if (!orgaoGestorExiste) throw new HttpException('orgao_gestor_id| Órgão gestor inválido', 400);

        const transferencia = await this.prisma.transferencia.findFirst({
            where: {
                id: dto.transferencia_id,
                removido_em: null,
            },
            select: {
                custeio: true,
                investimento: true,
                valor_contrapartida: true,
                valor_total: true,
            },
        });
        if (!transferencia) throw new HttpException('transferencia_id| Transferência não encontrada.', 400);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.nome) {
                    const similarExists = await prismaTx.distribuicaoRecurso.count({
                        where: {
                            nome: { endsWith: dto.nome, mode: 'insensitive' },
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'nome| Nome de distribuição, igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

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

                // A soma de custeio, investimento, contrapartida e total de todas as distribuições não pode ser superior aos valores da transferência.
                const outrasDistribuicoes = await prismaTx.distribuicaoRecurso.findMany({
                    where: {
                        removido_em: null,
                        status: {
                            some: {
                                OR: [
                                    {
                                        AND: [
                                            { NOT: { status_base: { tipo: DistribuicaoStatusTipo.Declinada } } },
                                            { NOT: { status_base: { tipo: DistribuicaoStatusTipo.Redirecionada } } },
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

                let sumCusteio: number = +dto.custeio ?? 0;
                let sumInvestimento: number = +dto.investimento ?? 0;
                let sumContrapartida: number = +dto.valor_contrapartida ?? 0;
                let sumTotal: number = +dto.valor_total ?? 0;

                for (const distRow of outrasDistribuicoes) {
                    sumCusteio += +distRow.custeio.toNumber();
                    sumContrapartida += +distRow.valor_contrapartida.toNumber();
                    sumInvestimento += +distRow.investimento.toNumber();
                    sumTotal += +distRow.valor_total.toNumber();
                }

                if (transferencia.custeio && sumCusteio && sumCusteio > transferencia.custeio.toNumber())
                    throw new HttpException(
                        'Soma de custeio de todas as distribuições não pode ser superior ao valor de custeio da transferência.',
                        400
                    );

                if (
                    transferencia.valor_contrapartida &&
                    sumContrapartida &&
                    sumContrapartida > transferencia.valor_contrapartida.toNumber()
                )
                    throw new HttpException(
                        'Soma de contrapartida de todas as distribuições não pode ser superior ao valor de contrapartida da transferência.',
                        400
                    );

                if (
                    transferencia.investimento &&
                    sumInvestimento &&
                    sumInvestimento > transferencia.investimento.toNumber()
                )
                    throw new HttpException(
                        'Soma de investimento de todas as distribuições não pode ser superior ao valor de investimento da transferência.',
                        400
                    );

                if (transferencia.valor_total && sumTotal && sumTotal > transferencia.valor_total.toNumber())
                    throw new HttpException(
                        'Soma do total de todas as distribuições não pode ser superior ao valor total da transferência.',
                        400
                    );

                const distribuicaoRecurso = await prismaTx.distribuicaoRecurso.create({
                    data: {
                        transferencia_id: dto.transferencia_id,
                        orgao_gestor_id: dto.orgao_gestor_id,
                        nome: dto.nome,
                        objeto: dto.objeto,
                        valor: dto.valor,
                        valor_total: dto.valor_total,
                        valor_contrapartida: dto.valor_contrapartida,
                        custeio: dto.custeio,
                        investimento: dto.investimento,
                        empenho: dto.empenho,
                        data_empenho: dto.data_empenho,
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
                                                  nome: r.nome,
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

                // Caso seja a primeira row de distribuição de recurso.
                // É necessário verificar as fases e tarefas do workflow
                // Cuja responsabilidade é "OutroOrgao" e setar o orgao_id da tarefa do cronograma.
                const countLinhas = await prismaTx.distribuicaoRecurso.count({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        removido_em: null,
                    },
                });

                if (countLinhas == 1 && distribuicaoRecurso.transferencia.workflow_id != null) {
                    const rows = await prismaTx.transferenciaAndamento.findMany({
                        where: {
                            transferencia_id: dto.transferencia_id,
                            transferencia: {
                                workflow_id: distribuicaoRecurso.transferencia.workflow_id,
                            },

                            workflow_fase: {
                                fluxos: {
                                    some: {
                                        responsabilidade: WorkflowResponsabilidade.OutroOrgao,
                                    },
                                },
                            },
                        },
                        select: {
                            tarefaEspelhada: {
                                select: { id: true },
                            },

                            tarefas: {
                                where: {
                                    workflow_tarefa: {
                                        fluxoTarefas: {
                                            some: { responsabilidade: WorkflowResponsabilidade.OutroOrgao },
                                        },
                                    },
                                },
                                select: {
                                    tarefaEspelhada: {
                                        select: { id: true },
                                    },
                                },
                            },
                        },
                    });

                    const operations = [];
                    for (const fase of rows) {
                        for (const tarefaEspelhada of fase.tarefaEspelhada) {
                            operations.push(
                                prismaTx.tarefa.update({
                                    where: { id: tarefaEspelhada.id },
                                    data: {
                                        orgao_id: dto.orgao_gestor_id,
                                        atualizado_em: new Date(Date.now()),
                                    },
                                })
                            );
                        }

                        for (const tarefa of fase.tarefas) {
                            for (const tarefaEspelhada of tarefa.tarefaEspelhada) {
                                operations.push(
                                    prismaTx.tarefa.update({
                                        where: { id: tarefaEspelhada.id },
                                        data: {
                                            orgao_id: dto.orgao_gestor_id,
                                            atualizado_em: new Date(Date.now()),
                                        },
                                    })
                                );
                            }
                        }
                    }

                    await Promise.all(operations);
                }

                return { id: distribuicaoRecurso.id };
            }
        );

        return { id: created.id };
    }

    async findAll(filters: FilterDistribuicaoRecursoDto): Promise<DistribuicaoRecursoDto[]> {
        const transferencia = await this.prisma.transferencia.findFirstOrThrow({
            where: {
                id: filters.transferencia_id,
            },
            select: {
                valor_total: true,
            },
        });

        const rows = await this.prisma.distribuicaoRecurso.findMany({
            where: {
                removido_em: null,
                transferencia_id: filters.transferencia_id,
            },
            select: {
                id: true,
                transferencia_id: true,
                nome: true,
                objeto: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                custeio: true,
                investimento: true,
                empenho: true,
                data_empenho: true,
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
                        nome: true,
                        processo_sei: true,
                    },
                },
                aditamentos: {
                    orderBy: { criado_em: 'desc' },
                    select: {
                        data_vigencia: true,
                        data_vigencia_corrente: true,
                        justificativa: true,
                    },
                },
                status: {
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
                },
            },
        });

        return rows.map((r) => {
            let pode_registrar_status: boolean = true;
            if (r.status.length) {
                if (!r.status[0].status?.permite_novos_registros || !r.status[0].status_base?.permite_novos_registros)
                    pode_registrar_status = false;
            }

            let pct_valor_transferencia: number = 0;
            if (transferencia.valor_total && r.valor_total) {
                pct_valor_transferencia = Math.round(
                    (r.valor_total.toNumber() / transferencia.valor_total.toNumber()) * 100
                );
            }

            return {
                id: r.id,
                nome: r.nome,
                transferencia_id: r.transferencia_id,
                orgao_gestor: r.orgao_gestor,
                objeto: r.objeto,
                valor: r.valor,
                valor_total: r.valor_total,
                valor_contrapartida: r.valor_contrapartida,
                custeio: r.custeio,
                investimento: r.investimento,
                empenho: r.empenho,
                data_empenho: r.data_empenho,
                programa_orcamentario_estadual: r.programa_orcamentario_estadual,
                programa_orcamentario_municipal: r.programa_orcamentario_municipal,
                dotacao: r.dotacao,
                proposta: r.proposta,
                contrato: r.contrato,
                convenio: r.convenio,
                assinatura_termo_aceite: r.assinatura_termo_aceite,
                assinatura_municipio: r.assinatura_municipio,
                assinatura_estado: r.assinatura_estado,
                vigencia: r.vigencia,
                aditamentos: r.aditamentos,
                conclusao_suspensiva: r.conclusao_suspensiva,
                pode_registrar_status: pode_registrar_status,
                pct_valor_transferencia: pct_valor_transferencia,
                registros_sei: r.registros_sei.map((s) => {
                    return {
                        id: s.id,
                        nome: s.nome,
                        processo_sei: formataSEI(s.processo_sei),
                    };
                }),
                historico_status: r.status.map((r) => {
                    return {
                        id: r.id,
                        data_troca: r.data_troca,
                        dias_no_status: Math.abs(Math.round(DateTime.fromJSDate(r.data_troca).diffNow('days').days)),
                        motivo: r.motivo,
                        nome_responsavel: r.nome_responsavel,
                        orgao_responsavel: {
                            id: r.orgao_responsavel.id,
                            sigla: r.orgao_responsavel.sigla,
                        },
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
                }),
            };
        });
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<DistribuicaoRecursoDetailDto> {
        const row = await this.prisma.distribuicaoRecurso.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                transferencia_id: true,
                nome: true,
                objeto: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                custeio: true,
                investimento: true,
                empenho: true,
                data_empenho: true,
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
                        nome: true,
                        processo_sei: true,
                    },
                },

                aditamentos: {
                    orderBy: { criado_em: 'desc' },
                    select: {
                        data_vigencia: true,
                        data_vigencia_corrente: true,
                        justificativa: true,
                    },
                },

                status: {
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
                },

                transferencia: {
                    select: {
                        valor_total: true,
                    },
                },
            },
        });
        if (!row) throw new HttpException('id| Distribuição de recurso não encontrada.', 404);

        const historico_status: DistribuicaoHistoricoStatusDto[] = row.status.map((r) => {
            return {
                id: r.id,
                data_troca: r.data_troca,
                dias_no_status: Math.abs(Math.round(DateTime.fromJSDate(r.data_troca).diffNow('days').days)),
                motivo: r.motivo,
                nome_responsavel: r.nome_responsavel,
                orgao_responsavel: {
                    id: r.orgao_responsavel.id,
                    sigla: r.orgao_responsavel.sigla,
                },
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

        let pode_registrar_status: boolean = true;
        if (row.status.length) {
            if (!row.status[0].status?.permite_novos_registros || !row.status[0].status_base?.permite_novos_registros)
                pode_registrar_status = false;
        }

        let pct_valor_transferencia: number = 0;
        if (row.transferencia.valor_total && row.valor_total) {
            pct_valor_transferencia = Math.round(
                (row.valor_total.toNumber() / row.transferencia.valor_total.toNumber()) * 100
            );
        }

        return {
            id: row.id,
            transferencia_id: row.transferencia_id,
            nome: row.nome,
            objeto: row.objeto,
            valor: row.valor,
            valor_total: row.valor_total,
            valor_contrapartida: row.valor_contrapartida,
            custeio: row.custeio,
            investimento: row.investimento,
            empenho: row.empenho,
            data_empenho: row.data_empenho,
            programa_orcamentario_estadual: row.programa_orcamentario_estadual,
            programa_orcamentario_municipal: row.programa_orcamentario_municipal,
            dotacao: row.dotacao,
            proposta: row.proposta,
            contrato: row.contrato,
            convenio: row.convenio,
            assinatura_termo_aceite: row.assinatura_termo_aceite,
            assinatura_municipio: row.assinatura_municipio,
            assinatura_estado: row.assinatura_estado,
            vigencia: row.vigencia,
            conclusao_suspensiva: row.conclusao_suspensiva,
            pode_registrar_status: pode_registrar_status,
            pct_valor_transferencia: pct_valor_transferencia,
            historico_status: historico_status,
            orgao_gestor: {
                id: row.orgao_gestor.id,
                sigla: row.orgao_gestor.sigla,
                descricao: row.orgao_gestor.descricao,
            },
            aditamentos: row.aditamentos.map((aditamento) => {
                return {
                    data_vigencia: aditamento.data_vigencia,
                    data_vigencia_corrente: aditamento.data_vigencia_corrente,
                    justificativa: aditamento.justificativa,
                };
            }),
            registros_sei: row.registros_sei.map((s) => {
                return {
                    id: s.id,
                    nome: s.nome,
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
        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            if (dto.registros_sei != undefined) {
                const currRegistrosSei = self.registros_sei ?? [];
                await this.checkDiffSei(id, dto.registros_sei, currRegistrosSei, prismaTx, user);
            } else {
                // Front não envia o param quando tiver vazio.
                await prismaTx.distribuicaoRecursoSei.updateMany({
                    where: {
                        distribuicao_recurso_id: id,
                        removido_em: null,
                    },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                    },
                });
            }
            delete dto.registros_sei;

            if (dto.nome && dto.nome != self.nome) {
                const similarExists = await prismaTx.distribuicaoRecurso.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                        id: { not: id },
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);
            }

            if (dto.vigencia && self.vigencia != null && dto.vigencia.toISOString() != self.vigencia.toISOString()) {
                await this.registerAditamento(prismaTx, id, dto, user, now);
            }

            if (
                dto.custeio != undefined ||
                dto.investimento != undefined ||
                dto.valor_contrapartida != undefined ||
                dto.valor_total
            ) {
                const transferencia = await prismaTx.transferencia.findFirst({
                    where: {
                        id: self.transferencia_id,
                        removido_em: null,
                    },
                    select: {
                        custeio: true,
                        investimento: true,
                        valor_contrapartida: true,
                        valor_total: true,
                    },
                });
                if (!transferencia) throw new HttpException('Transferência não encontrada.', 400);

                const outrasDistribuicoes = await prismaTx.distribuicaoRecurso.findMany({
                    where: {
                        id: { not: id },
                        removido_em: null,
                        status: {
                            some: {
                                OR: [
                                    {
                                        AND: [
                                            { NOT: { status_base: { tipo: DistribuicaoStatusTipo.Declinada } } },
                                            { NOT: { status_base: { tipo: DistribuicaoStatusTipo.Redirecionada } } },
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

                let sumCusteio: number = dto.custeio ?? 0;
                let sumInvestimento: number = dto.investimento ?? 0;
                let sumContrapartida: number = dto.valor_contrapartida ?? 0;
                let sumTotal: number = dto.valor_total ?? 0;

                for (const distRow of outrasDistribuicoes) {
                    sumCusteio += +distRow.custeio.toNumber();
                    sumContrapartida += +distRow.valor_contrapartida.toNumber();
                    sumInvestimento += +distRow.investimento.toNumber();
                    sumTotal += +distRow.valor_total.toNumber();
                }

                if (dto.custeio != self.custeio.toNumber()) {
                    if (transferencia.custeio && sumCusteio && sumCusteio > transferencia.custeio.toNumber())
                        throw new HttpException(
                            'Soma de custeio de todas as distribuições não pode ser superior ao valor de custeio da transferência.',
                            400
                        );
                }

                if (dto.investimento != self.investimento.toNumber()) {
                    if (
                        transferencia.investimento &&
                        sumInvestimento &&
                        sumInvestimento > transferencia.investimento.toNumber()
                    )
                        throw new HttpException(
                            'Soma de investimento de todas as distribuições não pode ser superior ao valor de investimento da transferência.',
                            400
                        );
                }

                if (dto.valor_contrapartida != self.valor_contrapartida.toNumber()) {
                    if (
                        transferencia.valor_contrapartida &&
                        sumContrapartida &&
                        sumContrapartida > transferencia.valor_contrapartida.toNumber()
                    )
                        throw new HttpException(
                            'Soma de contrapartida de todas as distribuições não pode ser superior ao valor de contrapartida da transferência.',
                            400
                        );
                }

                if (dto.valor_total != self.valor_total.toNumber()) {
                    if (transferencia.valor_total && sumTotal && sumTotal > transferencia.valor_total.toNumber())
                        throw new HttpException(
                            'Soma de total de todas as distribuições não pode ser superior ao valor total da transferência.',
                            400
                        );
                }
            }

            await prismaTx.distribuicaoRecurso.update({
                where: { id },
                data: {
                    orgao_gestor_id: dto.orgao_gestor_id,
                    nome: dto.nome,
                    objeto: dto.objeto,
                    valor: dto.valor,
                    valor_total: dto.valor_total,
                    valor_contrapartida: dto.valor_contrapartida,
                    custeio: dto.custeio,
                    investimento: dto.investimento,
                    empenho: dto.empenho,
                    data_empenho: dto.data_empenho,
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

            // Caso seja a única distribuição.
            // E o órgão for atualizado, a atualização deve refletir no cronograma.
            const countDistribuicoes = await prismaTx.distribuicaoRecurso.count({
                where: {
                    removido_em: null,
                    transferencia_id: self.transferencia_id,
                },
            });

            if (self.orgao_gestor.id != dto.orgao_gestor_id && countDistribuicoes == 1) {
                await prismaTx.tarefa.updateMany({
                    where: {
                        tarefa_cronograma: {
                            transferencia_id: self.transferencia_id,
                            removido_em: null,
                        },
                        removido_em: null,
                    },
                    data: {
                        orgao_id: dto.orgao_gestor_id,
                    },
                });
            }

            const updatedSelf = await this.findOne(id, user);

            // “VALOR DO REPASSE”  é a soma de “Custeio” + Investimento”
            if (updatedSelf.valor.toNumber() != updatedSelf.custeio.toNumber() + updatedSelf.investimento.toNumber())
                throw new HttpException(
                    'valor| Valor do repasse deve ser a soma dos valores de custeio e investimento.',
                    400
                );

            // “VALOR TOTAL”  é a soma de “Custeio” + Investimento” + “Contrapartida”
            if (
                updatedSelf.valor_total.toNumber() !=
                updatedSelf.valor.toNumber() + updatedSelf.valor_contrapartida.toNumber()
            )
                throw new HttpException(
                    'valor| Valor total deve ser a soma dos valores de repasse e contrapartida.',
                    400
                );

            return { id };
        });

        return { id };
    }

    private async registerAditamento(
        prismaTx: Prisma.TransactionClient,
        distribuicaoRecursoId: number,
        dto: UpdateDistribuicaoRecursoDto,
        user: PessoaFromJwt,
        now: Date
    ) {
        const self = await prismaTx.distribuicaoRecurso.findFirstOrThrow({
            where: {
                id: distribuicaoRecursoId,
                removido_em: null,
            },
            select: {
                id: true,
                nota_id: true,
                aviso_email_id: true,
                vigencia: true,
                transferencia_id: true,
                objeto: true,
                orgao_gestor_id: true,
            },
        });
        if (!dto.justificativa_aditamento || self.vigencia == null)
            throw new HttpException('justificativa_aditamento| Deve ser enviada.', 400);

        await prismaTx.distribuicaoRecursoAditamento.create({
            data: {
                distribuicao_recurso_id: self.id,
                data_vigencia: self.vigencia,
                data_vigencia_corrente: dto.vigencia!,
                justificativa: dto.justificativa_aditamento,
                criado_por: user.id,
                criado_em: now,
            },
        });

        let nota_id = self.nota_id;
        if (!self.nota_id) {
            const bloco_token = await this.blocoNotaService.getTokenFor(
                {
                    transferencia_id: self.transferencia_id,
                },
                user,
                prismaTx
            );
            const tipo_id = await this.notaService.getTipoNotaDistRecurso(prismaTx);

            // Quadro de atividades, mostrar a data prazo=data de vigencia,
            // atividade=”Distribuição de recursos: ${OBJETO/EMPREENDIMENTO}”
            const nota = await this.notaService.create(
                {
                    bloco_token,
                    nota: `Distribuição de recursos: ${self.objeto}`,
                    data_nota: self.vigencia,
                    dispara_email: true,
                    status: 'Programado',
                    tipo_nota_id: tipo_id,
                    enderecamentos: [{ orgao_enderecado_id: self.orgao_gestor_id, pessoa_enderecado_id: null }],
                },
                user,
                prismaTx
            );

            await prismaTx.distribuicaoRecurso.update({
                where: { id: self.id },
                data: {
                    nota_id: nota.id,
                },
            });
            nota_id = nota.id;
        } else if (nota_id) {
            await this.notaService.update(
                this.notaService.getToken(nota_id, true),
                {
                    data_nota: self.vigencia,
                    dispara_email: true,
                    status: 'Programado',
                    enderecamentos: [{ orgao_enderecado_id: self.orgao_gestor_id, pessoa_enderecado_id: null }],
                },
                user,
                prismaTx
            );
        }

        if (!self.aviso_email_id && nota_id) {
            const aviso_email = await this.avisoEmailService.create(
                {
                    nota_jwt: this.notaService.getToken(nota_id, true),
                    ativo: true,
                    com_copia: [],
                    numero: 60, // acabou ficando hardcoded essas configs abaixo
                    numero_periodo: 'Dias',
                    recorrencia_dias: 1,
                    tipo: 'Nota',
                },
                user,
                prismaTx
            );

            await prismaTx.distribuicaoRecurso.update({
                where: { id: self.id },
                data: {
                    aviso_email_id: aviso_email.id,
                },
            });
        } else if (self.aviso_email_id && nota_id) {
            await this.avisoEmailService.update(
                self.aviso_email_id,
                {
                    ativo: true, // só reativa
                },
                user,
                prismaTx
            );
        }
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
        sentRegistrosSei: OperationsRegistroSEI,
        currRegistrosSei: OperationsRegistroSEI,
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt
    ) {
        const updated: OperationsRegistroSEI = sentRegistrosSei
            .filter((r) => r.id != undefined)
            .filter((rNew) => {
                const rOld = currRegistrosSei.find((r) => r.id == rNew.id);

                return rNew.processo_sei !== rOld!.processo_sei || rNew.nome !== rOld!.nome;
            });

        const created: OperationsRegistroSEI = sentRegistrosSei.filter((r) => r.id == undefined);

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
                        nome: updatedRow.nome,
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
                        nome: createdRow.nome,
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
}
