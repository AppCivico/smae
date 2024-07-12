import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
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
import { UpdateTarefaDto } from 'src/pp/tarefa/dto/update-tarefa.dto';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';

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
        private readonly avisoEmailService: AvisoEmailService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService
    ) {}

    async create(
        dto: CreateDistribuicaoRecursoDto,
        user: PessoaFromJwt,
        distribuicao_automatica?: boolean
    ): Promise<RecordWithId> {
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
                            transferencia_id: dto.transferencia_id,
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

                // A soma de custeio, investimento, contrapartida e total de todas as distribuições não pode ser superior aos valores da transferência.
                const outrasDistribuicoes = await prismaTx.distribuicaoRecurso.findMany({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        removido_em: null,
                    },
                    select: {
                        custeio: true,
                        investimento: true,
                        valor_contrapartida: true,
                        valor_total: true,
                        status: {
                            orderBy: { data_troca: 'desc' },
                            take: 1,
                            select: {
                                status_base: {
                                    select: {
                                        tipo: true,
                                    },
                                },
                                status: {
                                    select: {
                                        tipo: true,
                                    },
                                },
                            },
                        },
                    },
                });

                const outrasDistribuicoesFiltradas = outrasDistribuicoes.filter((distribuicao) => {
                    console.log(distribuicao.status);
                    const statusAtual = distribuicao.status.length ? distribuicao.status[0] : null;

                    if (statusAtual) {
                        const statusConfig = statusAtual.status_base ?? statusAtual.status;

                        return statusConfig?.tipo != DistribuicaoStatusTipo.Terminal;
                    }
                    return true;
                });

                const transferencia_custeio = distribuicao_automatica == true ? dto.custeio : +transferencia.custeio!;
                const transferencia_investimento =
                    distribuicao_automatica == true ? dto.investimento : +transferencia.investimento!;
                const transferencia_contrapartida =
                    distribuicao_automatica == true ? dto.valor_contrapartida : +transferencia.valor_contrapartida!;
                const transferencia_valor_total =
                    distribuicao_automatica == true ? dto.valor_total : +transferencia.valor_total!;

                let sumCusteio: number = +dto.custeio ?? 0;
                let sumInvestimento: number = +dto.investimento ?? 0;
                let sumContrapartida: number = +dto.valor_contrapartida ?? 0;
                let sumTotal: number = +dto.valor_total ?? 0;

                for (const distRow of outrasDistribuicoesFiltradas) {
                    sumCusteio += +distRow.custeio;
                    sumContrapartida += +distRow.valor_contrapartida;
                    sumInvestimento += +distRow.investimento;
                    sumTotal = sumTotal + +distRow.valor_total;
                }

                if (transferencia.custeio && sumCusteio && sumCusteio > transferencia_custeio)
                    throw new HttpException(
                        'Soma de custeio de todas as distribuições não pode ser superior ao valor de custeio da transferência.',
                        400
                    );

                if (
                    transferencia.valor_contrapartida &&
                    sumContrapartida &&
                    sumContrapartida > transferencia_contrapartida
                )
                    throw new HttpException(
                        'Soma de contrapartida de todas as distribuições não pode ser superior ao valor de contrapartida da transferência.',
                        400
                    );

                if (transferencia.investimento && sumInvestimento && sumInvestimento > transferencia_investimento)
                    throw new HttpException(
                        'Soma de investimento de todas as distribuições não pode ser superior ao valor de investimento da transferência.',
                        400
                    );

                if (transferencia.valor_total && sumTotal && sumTotal > transferencia_valor_total)
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
                        orgao_gestor: {
                            select: {
                                sigla: true,
                            },
                        },
                    },
                });

                // Sprint 13: Quando uma distribuição é criada.
                // Devem ser criadas tarefas no cronograma
                // Para cada linha de tarefa do workflow que é de responsabilidade de outro órgão.
                if (distribuicao_automatica != true) {
                    await this._createTarefasOutroOrgao(prismaTx, distribuicaoRecurso.id, user);
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

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
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

                if (self.empenho == false && dto.empenho && dto.empenho == true && dto.data_empenho == undefined)
                    throw new HttpException('data_empenho| Obrigatório quando for empenho.', 400);

                if (dto.nome && dto.nome != self.nome) {
                    const similarExists = await prismaTx.distribuicaoRecurso.count({
                        where: {
                            nome: { endsWith: dto.nome, mode: 'insensitive' },
                            transferencia_id: self.transferencia_id,
                            removido_em: null,
                            id: { not: id },
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'nome| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                if (
                    dto.vigencia &&
                    self.vigencia != null &&
                    dto.vigencia.toISOString() != self.vigencia.toISOString()
                ) {
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
                            id: true,
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
                            transferencia_id: transferencia.id,
                            removido_em: null,
                        },
                        select: {
                            custeio: true,
                            investimento: true,
                            valor_contrapartida: true,
                            valor_total: true,
                            status: {
                                orderBy: { data_troca: 'desc' },
                                take: 1,
                                select: {
                                    status_base: {
                                        select: {
                                            tipo: true,
                                        },
                                    },
                                    status: {
                                        select: {
                                            tipo: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                    const outrasDistribuicoesFiltradas = outrasDistribuicoes.filter((distribuicao) => {
                        console.log(distribuicao.status);
                        const statusAtual = distribuicao.status.length ? distribuicao.status[0] : null;

                        if (statusAtual) {
                            const statusConfig = statusAtual.status_base ?? statusAtual.status;

                            return statusConfig?.tipo != DistribuicaoStatusTipo.Terminal;
                        }
                        return true;
                    });

                    let sumCusteio: number = dto.custeio ?? 0;
                    let sumInvestimento: number = dto.investimento ?? 0;
                    let sumContrapartida: number = dto.valor_contrapartida ?? 0;
                    let sumTotal: number = dto.valor_total ?? 0;

                    for (const distRow of outrasDistribuicoesFiltradas) {
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

                const updated = await prismaTx.distribuicaoRecurso.update({
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
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                            },
                        },
                        tarefas: {
                            where: {
                                removido_em: null,
                            },
                            select: {
                                id: true,
                            },
                        },
                        valor: true,
                        custeio: true,
                        valor_contrapartida: true,
                        investimento: true,
                        valor_total: true,
                    },
                });

                if (self.orgao_gestor.id != dto.orgao_gestor_id) {
                    if (updated.tarefas.length > 0) {
                        console.log('======================================');
                        console.log('Atualizando tarefas');
                        await prismaTx.$executeRaw`
                        UPDATE tarefa SET
                            tarefa = regexp_replace(tarefa, ' - .*', ' - ' || ${updated.orgao_gestor.sigla}),
                            orgao_id = ${updated.orgao_gestor.id}
                        WHERE distribuicao_recurso_id = ${id} AND removido_em IS NULL;
                    `;
                        console.log('======================================');
                    } else {
                        await this._createTarefasOutroOrgao(prismaTx, id, user);
                    }
                }

                // “VALOR DO REPASSE”  é a soma de “Custeio” + Investimento”
                if (Number(updated.valor).toFixed(2) != (+updated.custeio + +updated.investimento).toFixed(2))
                    throw new HttpException(
                        'valor| Valor do repasse deve ser a soma dos valores de custeio e investimento.',
                        400
                    );

                // “VALOR TOTAL”  é a soma de “Custeio” + Investimento” + “Contrapartida”
                if (
                    Number(updated.valor_total).toFixed(2) != (+updated.valor + +updated.valor_contrapartida).toFixed(2)
                )
                    throw new HttpException(
                        'valor| Valor total deve ser a soma dos valores de repasse e contrapartida.',
                        400
                    );

                return { id };
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );

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
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.distribuicaoRecurso.updateMany({
                where: {
                    id,
                    removido_em: null,
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });

            await prismaTx.tarefa.updateMany({
                where: {
                    distribuicao_recurso_id: id,
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });
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

    private async _createTarefasOutroOrgao(
        prismaTx: Prisma.TransactionClient,
        distribuicao_id: number,
        user: PessoaFromJwt
    ) {
        const distribuicaoRecurso = await prismaTx.distribuicaoRecurso.findFirstOrThrow({
            where: {
                id: distribuicao_id,
                removido_em: null,
            },
            select: {
                id: true,
                transferencia_id: true,
                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
            },
        });

        const andamentoTarefas = await prismaTx.transferenciaAndamentoTarefa.findMany({
            where: {
                transferencia_andamento: {
                    transferencia_id: distribuicaoRecurso.transferencia_id,
                },
                workflow_tarefa: {
                    fluxoTarefas: {
                        some: {
                            responsabilidade: WorkflowResponsabilidade.OutroOrgao,
                        },
                    },
                },
            },
            select: {
                id: true,
                transferencia_andamento: {
                    select: {
                        tarefaEspelhada: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                workflow_tarefa: {
                    select: {
                        tarefa_fluxo: true,
                    },
                },
            },
        });

        const operations = [];
        if (andamentoTarefas.length) {
            const tarefaCronograma = await prismaTx.tarefaCronograma.findFirstOrThrow({
                where: {
                    transferencia_id: distribuicaoRecurso.transferencia_id,
                    removido_em: null,
                },
                select: { id: true },
            });

            const tarefasExistentes = await prismaTx.tarefa.findMany({
                where: {
                    removido_em: null,
                    tarefa_cronograma_id: tarefaCronograma.id,
                    nivel: 3,
                },
                orderBy: [{ tarefa_pai_id: 'asc' }, { numero: 'desc' }],
                select: {
                    tarefa_pai_id: true,
                    numero: true,
                },
            });

            let tarefa_pai_id: number | undefined;
            let numero: number = 1;
            for (const andamentoTarefa of andamentoTarefas) {
                if (!andamentoTarefa.transferencia_andamento.tarefaEspelhada[0])
                    throw new Error('Erro interno! Tarefa espelhada não encontrada.');

                if (tarefa_pai_id != andamentoTarefa.transferencia_andamento.tarefaEspelhada[0].id) {
                    tarefa_pai_id = andamentoTarefa.transferencia_andamento.tarefaEspelhada[0].id;
                    numero = tarefasExistentes.filter((t) => t.tarefa_pai_id == tarefa_pai_id)[0].numero + 1;
                } else {
                    numero++;
                }

                operations.push(
                    prismaTx.tarefa.create({
                        data: {
                            tarefa_cronograma_id: tarefaCronograma.id,
                            tarefa_pai_id: tarefa_pai_id,
                            nivel: 3,
                            numero: numero,
                            tarefa:
                                andamentoTarefa.workflow_tarefa.tarefa_fluxo +
                                ` - ${distribuicaoRecurso.orgao_gestor.sigla}`,
                            descricao:
                                andamentoTarefa.workflow_tarefa.tarefa_fluxo +
                                ` - ${distribuicaoRecurso.orgao_gestor.sigla}`,
                            distribuicao_recurso_id: distribuicaoRecurso.id,
                            recursos: distribuicaoRecurso.orgao_gestor.sigla,
                            orgao_id: distribuicaoRecurso.orgao_gestor.id,
                        },
                    })
                );
            }
        }

        // Verificando se existe tarefa de nível de fase
        // que possui dependencia de tarefa de nível de fase, mas cuja fase, tem tarefas.
        // Caso exista, esta dependência deve ser modificada para apontar para a tarefa de maior número,
        // Cuja responsabilidade é da casa civil (SERI).
        const tarefaFasePendenteMudanca = await prismaTx.tarefa.findMany({
            where: {
                nivel: 2,
                tarefa_cronograma: { transferencia_id: distribuicaoRecurso.transferencia_id },
                dependencias: {
                    some: {
                        tarefas_dependente: {
                            nivel: 2,
                            n_filhos_imediatos: { gt: 0 },
                        },
                    },
                },
            },
            select: {
                id: true,
                dependencias: {
                    select: {
                        id: true,
                        tarefas_dependente: {
                            select: {
                                tarefa_pai_id: true,
                            },
                        },
                    },
                },
            },
        });

        const orgaoCasaCivil = await prismaTx.orgao.findFirst({
            where: {
                removido_em: null,
                sigla: 'SERI',
            },
            select: {
                id: true,
            },
        });
        if (!orgaoCasaCivil) throw new HttpException('Órgão da casa civil não foi encontrado', 400);

        for (const tarefaFase of tarefaFasePendenteMudanca) {
            // Buscando tarefa que seja da SERI e tenha o maior número.
            const novaTarefaDependente = await prismaTx.tarefa.findFirst({
                orderBy: { numero: 'desc' },
                where: {
                    // Em teoria só pode ter uma dependência pois é um cronograma de paridade com o workflow.
                    // Por isso dependencia[0]
                    tarefa_pai_id: tarefaFase.dependencias[0].tarefas_dependente.tarefa_pai_id,

                    orgao_id: orgaoCasaCivil.id,
                },
            });
            if (!novaTarefaDependente) throw new Error('Erro ao encontrar nova tarefa dependente.');

            operations.push(
                prismaTx.tarefaDependente.update({
                    where: { id: tarefaFase.dependencias[0].id },
                    data: { dependencia_tarefa_id: novaTarefaDependente.id },
                })
            );
        }

        await Promise.all(operations);
        await this._validarTopologia(prismaTx, distribuicao_id, user);
    }

    private async _validarTopologia(prismaTxn: Prisma.TransactionClient, distribuicao_id: number, user: PessoaFromJwt) {
        const distribuicaoRecurso = await prismaTxn.distribuicaoRecurso.findFirstOrThrow({
            where: {
                id: distribuicao_id,
                removido_em: null,
            },
            select: {
                id: true,
                transferencia_id: true,
            },
        });

        const tarefas = await prismaTxn.tarefa.findMany({
            where: {
                tarefa_cronograma: {
                    transferencia_id: distribuicaoRecurso.transferencia_id,
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
                    { transferencia_id: distribuicaoRecurso.transferencia_id },
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
                    transferencia_id: distribuicaoRecurso.transferencia_id,
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
    }
}
