import { forwardRef, HttpException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { DistribuicaoStatusTipo, Prisma, TarefaDependenteTipo, WorkflowResponsabilidade } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { formataSEI } from 'src/common/formata-sei';
import { UpdateTarefaDto } from 'src/pp/tarefa/dto/update-tarefa.dto';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AvisoEmailService } from '../../aviso-email/aviso-email.service';
import { BlocoNotaService } from '../../bloco-nota/bloco-nota/bloco-nota.service';
import { NotaService } from '../../bloco-nota/nota/nota.service';
import { SeiIntegracaoService } from '../../sei-integracao/sei-integracao.service';
import { CreateDistribuicaoRecursoDto, CreateDistribuicaoRegistroSEIDto } from './dto/create-distribuicao-recurso.dto';
import { FilterDistribuicaoRecursoDto } from './dto/filter-distribuicao-recurso.dto';
import { UpdateDistribuicaoRecursoDto } from './dto/update-distribuicao-recurso.dto';
import {
    AditamentosDto,
    DistribuicaoHistoricoStatusDto,
    DistribuicaoRecursoDetailDto,
    DistribuicaoRecursoDto,
    DistribuicaoRecursoSeiDto,
    ParlamentarDistribuicaoDto,
    SeiLidoStatusDto,
} from './entities/distribuicao-recurso.entity';
import { WorkflowService } from '../workflow/configuracao/workflow.service';
import { Date2YMD } from '../../common/date2ymd';
import { TransferenciaService } from '../transferencia/transferencia.service';

type OperationsRegistroSEI = {
    id?: number;
    nome?: string | null;
    processo_sei: string;
}[];

// Unified structure for items that will generate a new cronograma task
type ItemParaCriarTarefa = {
    nome_base: string; // Name of the phase or task from the workflow
    tarefa_pai_id: number; // ID of the parent cronograma task (always nivel 2)
    // Planning data inherited from the parent or a sibling for consistency
    inicio_planejado: Date | null;
    termino_planejado: Date | null;
    duracao_planejado: number | null;
    dependencias: {
        dependencia_tarefa_id: number;
        tipo: TarefaDependenteTipo;
        latencia: number;
    }[];
};

@Injectable()
export class DistribuicaoRecursoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly blocoNotaService: BlocoNotaService,
        private readonly notaService: NotaService,
        private readonly avisoEmailService: AvisoEmailService,
        @Inject(forwardRef(() => TarefaService))
        private readonly tarefaService: TarefaService,
        private readonly seiService: SeiIntegracaoService,
        private readonly workflowService: WorkflowService,
        @Inject(forwardRef(() => TransferenciaService))
        private readonly transferenciaService: TransferenciaService
    ) {}

    async create(
        dto: CreateDistribuicaoRecursoDto,
        user: PessoaFromJwt,
        distribuicao_automatica?: boolean,
        prismaTx?: Prisma.TransactionClient | undefined
    ): Promise<RecordWithId> {
        const orgaoGestorExiste = await this.prisma.orgao.count({
            where: {
                id: dto.orgao_gestor_id,
                removido_em: null,
            },
        });
        if (!orgaoGestorExiste) throw new HttpException('orgao_gestor_id| Órgão gestor inválido', 400);

        this.checkDuplicateSei(dto);

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

        const agora = new Date(Date.now());
        const create = async (prismaTx: Prisma.TransactionClient) => {
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
                    id: true,
                    custeio: true,
                    investimento: true,
                    valor_contrapartida: true,
                    valor_total: true,
                    status: {
                        orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                        where: { removido_em: null },
                        take: 1,
                        select: {
                            id: true,
                            status_base: {
                                select: {
                                    tipo: true,
                                    valor_distribuicao_contabilizado: true,
                                },
                            },
                            status: {
                                select: {
                                    tipo: true,
                                    valor_distribuicao_contabilizado: true,
                                },
                            },
                        },
                    },
                },
            });

            const outrasDistribuicoesFiltradas = outrasDistribuicoes.filter((distribuicao) => {
                const statusAtual = distribuicao.status.length ? distribuicao.status[0] : null;

                if (statusAtual) {
                    const statusConfig = statusAtual.status_base ?? statusAtual.status;

                    return statusConfig?.valor_distribuicao_contabilizado == true;
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

            let sumCusteio: number = +dto.custeio || 0;
            let sumInvestimento: number = +dto.investimento || 0;
            let sumContrapartida: number = +dto.valor_contrapartida || 0;
            let sumTotal: number = +dto.valor_total || 0;

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

            if (transferencia.valor_contrapartida && sumContrapartida && sumContrapartida > transferencia_contrapartida)
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

            const parlamentaresTratadosParaCreate = [];
            if (dto.parlamentares?.length) {
                const parlamentaresNaTransf = await prismaTx.transferenciaParlamentar.findMany({
                    where: {
                        parlamentar_id: { in: dto.parlamentares.map((p) => p.parlamentar_id) },
                        transferencia_id: dto.transferencia_id,
                        removido_em: null,
                    },
                    select: {
                        parlamentar_id: true,
                        partido_id: true,
                        cargo: true,
                        valor: true,
                    },
                });

                if (parlamentaresNaTransf.length != dto.parlamentares.length)
                    throw new HttpException('parlamentares| Parlamentar(es) não encontrado(s) na transferência.', 400);

                const sumValor = dto.parlamentares.filter((e) => e.valor).reduce((acc, curr) => acc + +curr.valor!, 0);
                if (+sumValor > +dto.valor)
                    throw new HttpException(
                        'parlamentares| A soma dos valores dos parlamentares não pode superar o valor de repasse da distribuição.',
                        400
                    );

                for (const novaRow of dto.parlamentares) {
                    const rowsParlamentarDist = await prismaTx.distribuicaoParlamentar.findMany({
                        where: {
                            parlamentar_id: novaRow.parlamentar_id,
                            removido_em: null,
                            distribuicao_recurso: {
                                transferencia_id: dto.transferencia_id,
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
                        },
                        select: {
                            id: true,
                            distribuicao_recurso_id: true,
                            valor: true,

                            distribuicao_recurso: {
                                select: {
                                    status: {
                                        take: 1,
                                        orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                                        where: { removido_em: null },
                                        select: {
                                            status_base: {
                                                select: {
                                                    tipo: true,
                                                    valor_distribuicao_contabilizado: true,
                                                },
                                            },
                                            status: {
                                                select: {
                                                    tipo: true,
                                                    valor_distribuicao_contabilizado: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    });

                    const rowParlamentarTransf = parlamentaresNaTransf.find(
                        (e) => e.parlamentar_id == novaRow.parlamentar_id
                    );
                    if (!rowParlamentarTransf)
                        throw new InternalServerErrorException('Erro em verificar valores na transferência.');
                    const valorNaTransf = rowParlamentarTransf.valor ?? 0;

                    let sumValor = rowsParlamentarDist
                        .filter((e) => e.valor != null)
                        .filter((e) => {
                            const statusUltimaRow = e.distribuicao_recurso.status[0];
                            if (!statusUltimaRow) return true;

                            const statusConfig = statusUltimaRow.status_base ?? statusUltimaRow.status;

                            return statusConfig!.valor_distribuicao_contabilizado == true;
                        })
                        .reduce((acc, curr) => acc + +curr.valor!, 0);
                    sumValor += novaRow.valor ? +novaRow.valor : 0;

                    if (+sumValor > +valorNaTransf)
                        throw new HttpException(
                            'parlamentares|A soma dos valores do parlamentar em todas as distruições não pode superar o valor de repasse, do parlamentar, na transferência.',
                            400
                        );

                    parlamentaresTratadosParaCreate.push({
                        parlamentar_id: novaRow.parlamentar_id,
                        cargo: rowParlamentarTransf.cargo,
                        partido_id: rowParlamentarTransf.partido_id,
                        valor: novaRow.valor,
                    });
                }
            }

            const statusBaseRegistrada = await prismaTx.distribuicaoStatusBase.findFirstOrThrow({
                where: {
                    tipo: DistribuicaoStatusTipo.NaoIniciado,
                },
                select: {
                    id: true,
                },
            });

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
                    criado_em: agora,
                    criado_por: user.id,
                    pct_custeio: dto.pct_custeio,
                    pct_investimento: dto.pct_investimento,
                    registros_sei: {
                        createMany: {
                            data:
                                dto.registros_sei != undefined && dto.registros_sei.length > 0
                                    ? dto.registros_sei!.map((r) => {
                                          return {
                                              processo_sei: r.processo_sei.replace(/\D/g, ''),
                                              nome: r.nome,
                                              criado_em: agora,
                                              criado_por: user.id,
                                          } satisfies Prisma.DistribuicaoRecursoSeiWhereInput;
                                      })
                                    : [],
                        },
                    },
                    parlamentares: {
                        createMany: {
                            data: parlamentaresTratadosParaCreate.map((e) => {
                                return {
                                    parlamentar_id: e.parlamentar_id,
                                    cargo: e.cargo,
                                    valor: e.valor,
                                    partido_id: e.partido_id,
                                    criado_em: agora,
                                    criado_por: user.id,
                                } satisfies Prisma.DistribuicaoParlamentarWhereInput;
                            }),
                        },
                    },
                    status: {
                        create: {
                            status_base_id: statusBaseRegistrada.id,
                            data_troca: agora,
                            nome_responsavel: '',
                            motivo: '',
                            criado_por: user.id,
                        } satisfies Prisma.DistribuicaoRecursoStatusWhereInput,
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
            if (distribuicao_automatica != true && distribuicaoRecurso.transferencia.workflow_id) {
                const workflowConfigValida = await this.workflowService.configValida(
                    distribuicaoRecurso.transferencia.workflow_id,
                    prismaTx
                );

                if (workflowConfigValida) await this._createTarefasOutroOrgao(prismaTx, distribuicaoRecurso.id, user);
            }

            return { id: distribuicaoRecurso.id };
        };

        let created: RecordWithId;
        if (prismaTx) {
            created = await create(prismaTx);
        } else {
            created = await this.prisma.$transaction(create, {
                isolationLevel: 'Serializable',
                maxWait: 20000,
                timeout: 50000,
            });
        }

        // Atualizando vetores da transferência.
        this.transferenciaService.updateVetoresBusca(dto.transferencia_id).catch((err) => {
            // Optional: log if the background task fails for some reason
            console.error(`Background task updateVetoresBusca failed for transferencia ${dto.transferencia_id}`, err);
        });

        return { id: created.id };
    }

    private checkDuplicateSei(dto: { registros_sei?: CreateDistribuicaoRegistroSEIDto[] }) {
        if (dto.registros_sei) {
            const duplicateSei = dto.registros_sei
                .map((r) => r.processo_sei)
                .filter((value, index, self) => self.indexOf(value) !== index);
            if (duplicateSei.length > 0) throw new HttpException('Processo SEI duplicado na distribuição.', 400);
        }
    }

    async findAll(filters: FilterDistribuicaoRecursoDto, user: PessoaFromJwt): Promise<DistribuicaoRecursoDto[]> {
        const transferencia = await this.prisma.transferencia.findFirstOrThrow({
            where: {
                id: filters.transferencia_id,
            },
        });

        const rows = await this.prisma.distribuicaoRecurso.findMany({
            where: {
                removido_em: null,
                transferencia_id: filters.transferencia_id,
            },
            orderBy: { orgao_gestor: { sigla: 'asc' } },
            select: {
                id: true,
                transferencia_id: true,
                nome: true,
                objeto: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                valor_empenho: true,
                valor_liquidado: true,
                rubrica_de_receita: true,
                finalidade: true,
                gestor_contrato: true,
                custeio: true,
                pct_custeio: true,
                investimento: true,
                pct_investimento: true,
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
                distribuicao_agencia: true,
                distribuicao_conta: true,
                distribuicao_banco: true,
                parlamentares: {
                    orderBy: { id: 'asc' },
                    where: { removido_em: null },
                    select: {
                        id: true,
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
                            },
                        },
                        cargo: true,
                        objeto: true,
                        valor: true,
                    },
                },
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
                    orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                    where: { removido_em: null },
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

        const processo_seis = rows.map((r) => r.registros_sei.map((s) => s.processo_sei));
        const integracoes = await this.seiService.buscaSeiStatus(processo_seis.flatMap((p) => p));
        const readStatusMap = await this.seiService.verificaStatusLeituraSei(
            processo_seis.flatMap((p) => p),
            user.id
        );

        return rows.map((r) => {
            let pode_registrar_status: boolean = true;
            if (r.status.length) {
                if (!r.status[0].status?.permite_novos_registros || !r.status[0].status_base?.permite_novos_registros)
                    pode_registrar_status = false;
            }

            let pct_valor_transferencia: number = 0;
            if (transferencia.valor && r.valor) {
                pct_valor_transferencia = Math.round((r.valor.toNumber() / transferencia.valor.toNumber()) * 100);
            }

            const integracoes_sei = integracoes.filter((i) =>
                r.registros_sei.map((s) => s.processo_sei).includes(i.processo_sei)
            );

            const historico_status = r.status.map((status, idx) => {
                // Caso tenha rows mais novas, o dado "dias_no_status" deve ser calculado olhando a prox row.
                //const proxRow = r.status![idx + 1];
                const proxRow = r.status && idx + 1 < r.status.length ? r.status[idx + 1] : null;
                let data_prox_row;
                if (proxRow) {
                    data_prox_row = proxRow.data_troca;
                }

                return {
                    id: status.id,
                    data_troca: Date2YMD.toString(status.data_troca),
                    dias_no_status: Math.abs(
                        data_prox_row
                            ? Math.round(
                                  DateTime.fromJSDate(status.data_troca).diff(
                                      DateTime.fromJSDate(data_prox_row),
                                      'days'
                                  ).days
                              )
                            : Math.round(DateTime.fromJSDate(status.data_troca).diffNow('days').days)
                    ),
                    motivo: status.motivo,
                    nome_responsavel: status.nome_responsavel,
                    orgao_responsavel: status.orgao_responsavel
                        ? {
                              id: status.orgao_responsavel.id,
                              sigla: status.orgao_responsavel.sigla,
                          }
                        : null,
                    status_customizado: status.status
                        ? {
                              id: status.status.id,
                              nome: status.status.nome,
                              tipo: status.status.tipo,
                              status_base: false,
                          }
                        : null,
                    status_base: status.status_base
                        ? {
                              id: status.status_base.id,
                              nome: status.status_base.nome,
                              tipo: status.status_base.tipo,
                              status_base: true,
                          }
                        : null,
                };
            });

            let status_atual: string = '-';
            if (historico_status.length) {
                const linhaAtual = historico_status[0];

                status_atual = linhaAtual.status_base?.nome ?? linhaAtual.status_customizado?.nome ?? '-';
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
                pct_custeio: r.pct_custeio,
                investimento: r.investimento,
                pct_investimento: r.pct_investimento,
                empenho: r.empenho,
                data_empenho: Date2YMD.toStringOrNull(r.data_empenho),
                programa_orcamentario_estadual: r.programa_orcamentario_estadual,
                programa_orcamentario_municipal: r.programa_orcamentario_municipal,
                dotacao: r.dotacao,
                proposta: r.proposta,
                contrato: r.contrato,
                convenio: r.convenio,
                assinatura_termo_aceite: Date2YMD.toStringOrNull(r.assinatura_termo_aceite),
                assinatura_municipio: Date2YMD.toStringOrNull(r.assinatura_municipio),
                assinatura_estado: Date2YMD.toStringOrNull(r.assinatura_estado),
                vigencia: Date2YMD.toStringOrNull(r.vigencia),
                aditamentos: r.aditamentos.map((a) => {
                    return {
                        ...a,
                        data_vigencia: Date2YMD.toString(a.data_vigencia),
                        data_vigencia_corrente: Date2YMD.toString(a.data_vigencia_corrente),
                    };
                }),
                conclusao_suspensiva: Date2YMD.toStringOrNull(r.conclusao_suspensiva),
                pode_registrar_status: pode_registrar_status,
                pct_valor_transferencia: pct_valor_transferencia,
                parlamentares: r.parlamentares,
                registros_sei: r.registros_sei.map((s) => {
                    return {
                        id: s.id,
                        nome: s.nome,
                        processo_sei: formataSEI(s.processo_sei),
                        integracao_sei: integracoes_sei.find((i) => i.processo_sei == s.processo_sei) ?? null,
                        lido: readStatusMap.get(s.processo_sei) ?? false,
                    };
                }),
                historico_status: historico_status,

                status_atual: status_atual,

                valor_empenho: r.valor_empenho,
                valor_liquidado: r.valor_liquidado,
                rubrica_de_receita: r.rubrica_de_receita,
                finalidade: r.finalidade,
                gestor_contrato: r.gestor_contrato,
                distribuicao_agencia: r.distribuicao_agencia,
                distribuicao_conta: r.distribuicao_conta,
                distribuicao_banco: r.distribuicao_banco,
            } satisfies DistribuicaoRecursoDto;
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
                valor_empenho: true,
                valor_liquidado: true,
                rubrica_de_receita: true,
                finalidade: true,
                gestor_contrato: true,
                custeio: true,
                pct_custeio: true,
                investimento: true,
                pct_investimento: true,
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
                distribuicao_agencia: true,
                distribuicao_conta: true,
                distribuicao_banco: true,
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
                    orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                    where: { removido_em: null },
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
                        valor: true,
                        parlamentar: {
                            orderBy: { id: 'asc' },
                            where: { removido_em: null },
                            select: {
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
                                    },
                                },
                                cargo: true,
                                objeto: true,
                            },
                        },
                    },
                },

                parlamentares: {
                    orderBy: { id: 'asc' },
                    where: { removido_em: null },
                    select: {
                        id: true,
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
                            },
                        },
                        cargo: true,
                        objeto: true,
                        valor: true,
                    },
                },
            },
        });
        if (!row) throw new HttpException('id| Distribuição de recurso não encontrada.', 404);

        const historico_status: DistribuicaoHistoricoStatusDto[] = row.status.map((r) => {
            return {
                id: r.id,
                data_troca: Date2YMD.toString(r.data_troca),
                dias_no_status: Math.abs(Math.round(DateTime.fromJSDate(r.data_troca).diffNow('days').days)),
                motivo: r.motivo,
                nome_responsavel: r.nome_responsavel,
                orgao_responsavel: r.orgao_responsavel
                    ? {
                          id: r.orgao_responsavel.id,
                          sigla: r.orgao_responsavel.sigla,
                      }
                    : null,
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
        if (row.transferencia.valor && row.valor) {
            pct_valor_transferencia = Math.round((row.valor.toNumber() / row.transferencia.valor.toNumber()) * 100);
        }

        const processo_seis = row.registros_sei.map((s) => s.processo_sei);
        const integracoes = await this.seiService.buscaSeiStatus(processo_seis.flatMap((p) => p));
        const readStatusMap = await this.seiService.verificaStatusLeituraSei(processo_seis, user.id);

        // Os parlamentares, inicialmente, são preenchidos no estágio de "identificação" da Transferência
        // E não são pre-preenchidos na Distribuição de Recurso, do ponto de vista de banco de dados.
        // Portanto, é feito o merge das linhas de transf e de dist.
        const parlamentares: ParlamentarDistribuicaoDto[] = [
            ...new Set([
                ...row.parlamentares,
                ...row.transferencia.parlamentar
                    .filter((dp) => !row.parlamentares.find((tp) => tp.parlamentar_id == dp.parlamentar_id))
                    .map((p) => {
                        return {
                            parlamentar_id: p.parlamentar_id,
                            parlamentar: p.parlamentar,
                            partido_id: p.partido_id,
                            partido: p.partido,
                            cargo: p.cargo,
                            objeto: p.objeto,
                            valor: null,
                        };
                    }),
            ]),
        ];

        let status_atual: string = '-';
        if (historico_status.length) {
            const linhaAtual = historico_status[0];

            status_atual = linhaAtual.status_base?.nome ?? linhaAtual.status_customizado?.nome ?? '-';
        }

        return {
            id: row.id,
            transferencia_id: row.transferencia_id,
            nome: row.nome,
            objeto: row.objeto,
            valor: row.valor,
            valor_total: row.valor_total,
            valor_contrapartida: row.valor_contrapartida,
            valor_empenho: row.valor_empenho,
            valor_liquidado: row.valor_liquidado,
            rubrica_de_receita: row.rubrica_de_receita,
            finalidade: row.finalidade,
            gestor_contrato: row.gestor_contrato,
            custeio: row.custeio,
            pct_custeio: row.pct_custeio,
            investimento: row.investimento,
            pct_investimento: row.pct_investimento,
            empenho: row.empenho,
            data_empenho: Date2YMD.toStringOrNull(row.data_empenho),
            programa_orcamentario_estadual: row.programa_orcamentario_estadual,
            programa_orcamentario_municipal: row.programa_orcamentario_municipal,
            dotacao: row.dotacao,
            proposta: row.proposta,
            contrato: row.contrato,
            convenio: row.convenio,
            assinatura_termo_aceite: Date2YMD.toStringOrNull(row.assinatura_termo_aceite),
            assinatura_municipio: Date2YMD.toStringOrNull(row.assinatura_municipio),
            assinatura_estado: Date2YMD.toStringOrNull(row.assinatura_estado),
            vigencia: Date2YMD.toStringOrNull(row.vigencia),
            conclusao_suspensiva: Date2YMD.toStringOrNull(row.conclusao_suspensiva),
            pode_registrar_status: pode_registrar_status,
            pct_valor_transferencia: pct_valor_transferencia,
            historico_status: historico_status,
            status_atual: status_atual,
            orgao_gestor: {
                id: row.orgao_gestor.id,
                sigla: row.orgao_gestor.sigla,
                descricao: row.orgao_gestor.descricao,
            },
            aditamentos: row.aditamentos.map((aditamento) => {
                return {
                    data_vigencia: Date2YMD.toString(aditamento.data_vigencia),
                    data_vigencia_corrente: Date2YMD.toString(aditamento.data_vigencia_corrente),
                    justificativa: aditamento.justificativa,
                } satisfies AditamentosDto;
            }),
            registros_sei: row.registros_sei.map((s) => {
                return {
                    id: s.id,
                    nome: s.nome,
                    processo_sei: formataSEI(s.processo_sei),
                    integracao_sei: integracoes.find((i) => i.processo_sei == s.processo_sei) ?? null,
                    lido: readStatusMap.get(s.processo_sei) ?? false,
                } satisfies DistribuicaoRecursoSeiDto;
            }),
            parlamentares: parlamentares,
            distribuicao_agencia: row.distribuicao_agencia,
            distribuicao_conta: row.distribuicao_conta,
            distribuicao_banco: row.distribuicao_banco,
        } satisfies DistribuicaoRecursoDetailDto;
    }

    async update(id: number, dto: UpdateDistribuicaoRecursoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const self = await this.findOne(id, user);
        this.checkDuplicateSei(dto);

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

                    // Atualiza o nome da tarefa do cronograma, se existir.
                    const tarefaDist = await prismaTx.tarefa.findFirst({
                        where: {
                            distribuicao_recurso_id: id,
                            removido_em: null,
                        },
                        select: {
                            tarefa: true,
                        },
                    });

                    if (tarefaDist) {
                        // Pegando nome anterior e substituindo pelo novo
                        let nomeTarefaDist = tarefaDist.tarefa;
                        nomeTarefaDist = nomeTarefaDist.replace(/ - .*/, ' - ' + dto.nome);

                        await prismaTx.tarefa.updateMany({
                            where: {
                                distribuicao_recurso_id: id,
                                removido_em: null,
                            },
                            data: {
                                tarefa: nomeTarefaDist,
                            },
                        });
                    }
                }

                if (
                    dto.vigencia &&
                    self.vigencia != null &&
                    Date2YMD.dbDateToDMY(dto.vigencia) != Date2YMD.ymdToDMY(self.vigencia)
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
                                orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                                where: { removido_em: null },
                                take: 1,
                                select: {
                                    status_base: {
                                        select: {
                                            tipo: true,
                                            valor_distribuicao_contabilizado: true,
                                        },
                                    },
                                    status: {
                                        select: {
                                            tipo: true,
                                            valor_distribuicao_contabilizado: true,
                                        },
                                    },
                                },
                            },
                        },
                    });

                    const outrasDistribuicoesFiltradas = outrasDistribuicoes.filter((distribuicao) => {
                        const statusAtual = distribuicao.status.length ? distribuicao.status[0] : null;

                        if (statusAtual) {
                            const statusConfig = statusAtual.status_base ?? statusAtual.status;

                            return statusConfig?.valor_distribuicao_contabilizado == true;
                        }
                        return true;
                    });

                    let sumCusteio: number = dto.custeio ?? 0;
                    let sumInvestimento: number = dto.investimento ?? 0;
                    let sumContrapartida: number = dto.valor_contrapartida ?? 0;
                    let sumTotal: number = dto.valor_total ?? 0;

                    for (const distRow of outrasDistribuicoesFiltradas) {
                        sumCusteio = +sumCusteio + +distRow.custeio.toNumber();
                        sumContrapartida = +sumContrapartida + +distRow.valor_contrapartida.toNumber();
                        sumInvestimento = +sumInvestimento + +distRow.investimento.toNumber();
                        sumTotal = +sumTotal + +distRow.valor_total.toNumber();
                    }

                    if (dto.custeio != self.custeio.toNumber()) {
                        if (transferencia.custeio && sumCusteio && sumCusteio > transferencia.custeio.toNumber()) {
                            throw new HttpException(
                                'Soma de custeio de todas as distribuições não pode ser superior ao valor de custeio da transferência.',
                                400
                            );
                        }
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
                        valor_empenho: dto.valor_empenho,
                        valor_liquidado: dto.valor_liquidado,
                        rubrica_de_receita: dto.rubrica_de_receita,
                        finalidade: dto.finalidade,
                        gestor_contrato: dto.gestor_contrato,
                        distribuicao_agencia: dto.distribuicao_agencia,
                        distribuicao_conta: dto.distribuicao_conta,
                        distribuicao_banco: dto.distribuicao_banco,
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
                        atualizado_em: now,
                        atualizado_por: user.id,
                        pct_custeio: dto.pct_custeio,
                        pct_investimento: dto.pct_investimento,
                    },
                    select: {
                        id: true,
                        nome: true,
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
                        parlamentares: {
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
                        transferencia: {
                            select: {
                                workflow_id: true,
                            },
                        },
                    },
                });

                if (self.orgao_gestor.id != dto.orgao_gestor_id && updated.transferencia.workflow_id) {
                    const workflowConfigValida = await this.workflowService.configValida(
                        updated.transferencia.workflow_id,
                        prismaTx
                    );

                    if (workflowConfigValida) {
                        if (updated.tarefas.length > 0) {
                            await prismaTx.$executeRaw`
                            UPDATE tarefa SET
                                tarefa = regexp_replace(tarefa, ' - .*', ' - ' || ${updated.nome}),
                                orgao_id = ${updated.orgao_gestor.id}
                            WHERE distribuicao_recurso_id = ${id} AND removido_em IS NULL;
                        `;
                        } else {
                            await this._createTarefasOutroOrgao(prismaTx, id, user);
                        }
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

                // Tratando upsert de parlamentares.
                const operations = [];
                if (dto.parlamentares?.length) {
                    const parlamentaresNaTransf = await prismaTx.transferenciaParlamentar.findMany({
                        where: {
                            parlamentar_id: { in: dto.parlamentares.map((p) => p.parlamentar_id) },
                            transferencia_id: self.transferencia_id,
                            removido_em: null,
                        },
                        select: {
                            parlamentar_id: true,
                            partido_id: true,
                            cargo: true,
                            valor: true,
                        },
                    });

                    const sumValor = dto.parlamentares
                        .filter((e) => e.valor)
                        .reduce((acc, curr) => acc + +curr.valor!, 0);
                    if (+sumValor > +updated.valor)
                        throw new HttpException(
                            'parlamentares| A soma dos valores dos parlamentares não pode superar o valor de repasse da distribuição.',
                            400
                        );

                    for (const relParlamentar of dto.parlamentares) {
                        const parlamentarNaTransf = await prismaTx.transferenciaParlamentar.findFirst({
                            where: {
                                parlamentar_id: relParlamentar.parlamentar_id,
                                transferencia_id: self.transferencia_id,
                                removido_em: null,
                            },
                            select: {
                                parlamentar_id: true,
                                partido_id: true,
                                cargo: true,
                                valor: true,
                            },
                        });
                        if (!parlamentarNaTransf)
                            throw new HttpException(
                                'parlamentar_id| Parlamentar não encontrado na transferência.',
                                400
                            );

                        const rowParlamentarTransf = parlamentaresNaTransf.find(
                            (e) => e.parlamentar_id == relParlamentar.parlamentar_id
                        );
                        if (!rowParlamentarTransf)
                            throw new InternalServerErrorException('Erro em verificar valores na transferência.');
                        const valorNaTransf = rowParlamentarTransf.valor ?? 0;

                        const rowsParlamentarDist = await prismaTx.distribuicaoParlamentar.findMany({
                            where: {
                                id: relParlamentar.id ? { not: relParlamentar.id } : undefined,
                                parlamentar_id: relParlamentar.parlamentar_id,
                                removido_em: null,
                                distribuicao_recurso: {
                                    removido_em: null,
                                    transferencia_id: self.transferencia_id,
                                },
                            },
                            select: {
                                id: true,
                                valor: true,
                                distribuicao_recurso: {
                                    select: {
                                        status: {
                                            take: 1,
                                            orderBy: [{ data_troca: 'desc' }, { id: 'desc' }],
                                            where: { removido_em: null },
                                            select: {
                                                status_base: {
                                                    select: {
                                                        tipo: true,
                                                        valor_distribuicao_contabilizado: true,
                                                    },
                                                },
                                                status: {
                                                    select: {
                                                        tipo: true,
                                                        valor_distribuicao_contabilizado: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        });

                        let sumValor = rowsParlamentarDist
                            .filter((e) => e.valor != null)
                            .filter((e) => {
                                const statusUltimaRow = e.distribuicao_recurso.status[0];
                                if (!statusUltimaRow) return true;

                                const statusConfig = statusUltimaRow.status_base ?? statusUltimaRow.status;
                                return statusConfig!.valor_distribuicao_contabilizado == true;
                            })
                            .reduce((acc, curr) => acc + +curr.valor!, 0);
                        sumValor += +relParlamentar.valor!;

                        if (+sumValor > +valorNaTransf)
                            throw new HttpException(
                                'parlamentares| A soma dos valores do parlamentar em todas as distruições não pode superar o valor de repasse, do parlamentar, na transferência.',
                                400
                            );

                        if (relParlamentar.id) {
                            const row = updated.parlamentares.find((e) => e.id == relParlamentar.id);
                            if (!row) throw new HttpException('id| Linha não encontrada.', 400);

                            if (
                                row.objeto !== relParlamentar.objeto ||
                                row.valor?.toNumber() !== relParlamentar.valor
                            ) {
                                operations.push(
                                    prismaTx.distribuicaoParlamentar.update({
                                        where: { id: relParlamentar.id },
                                        data: {
                                            valor: relParlamentar.valor,
                                            objeto: relParlamentar.objeto,
                                            atualizado_em: now,
                                            atualizado_por: user.id,
                                        },
                                    })
                                );
                            }
                        } else {
                            // Verificando se o parlamentar já está na distribuição
                            const exists = updated.parlamentares.find(
                                (e) => e.parlamentar_id == relParlamentar.parlamentar_id
                            );
                            if (exists)
                                throw new HttpException('parlamentar_id| Parlamentar já está na distribuição.', 400);

                            operations.push(
                                prismaTx.distribuicaoParlamentar.create({
                                    data: {
                                        distribuicao_recurso_id: id,
                                        parlamentar_id: relParlamentar.parlamentar_id,
                                        partido_id: parlamentarNaTransf.partido_id,
                                        cargo: parlamentarNaTransf.cargo,
                                        valor: relParlamentar.valor,
                                        objeto: relParlamentar.objeto,
                                        criado_em: now,
                                        criado_por: user.id,
                                    },
                                })
                            );
                        }
                    }
                }

                const parlamentaresRemovidos = updated.parlamentares.filter(
                    (e) => !dto.parlamentares?.map((e) => e.id).includes(e.id)
                );
                if (parlamentaresRemovidos.length) {
                    for (const row of parlamentaresRemovidos) {
                        operations.push(
                            prismaTx.distribuicaoParlamentar.update({
                                where: { id: row.id },
                                data: {
                                    removido_em: now,
                                    removido_por: user.id,
                                },
                            })
                        );
                    }
                }

                if (operations.length) await Promise.all(operations);

                return { id };
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );

        // Atualizando vetores da transferência.
        this.transferenciaService.updateVetoresBusca(self.transferencia_id).catch((err) => {
            // Optional: log if the background task fails for some reason
            console.error(`Background task updateVetoresBusca failed for transferencia ${self.transferencia_id}`, err);
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
        // Verificando se a justificativa foi enviada e não é null.
        // Ela é required na tabela.
        if (!dto.justificativa_aditamento) throw new HttpException('justificativa_aditamento| Deve ser enviada.', 400);

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
            const self = await prismaTx.distribuicaoRecurso.findFirstOrThrow({
                where: {
                    id,
                    removido_em: null,
                },
                select: {
                    id: true,
                    transferencia_id: true,
                },
            });

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

            // Atualizando vetores da transferência.
            this.transferenciaService.updateVetoresBusca(self.transferencia_id).catch((err) => {
                // Optional: log if the background task fails for some reason
                console.error(
                    `Background task updateVetoresBusca failed for transferencia ${self.transferencia_id}`,
                    err
                );
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
        const processoAtivar: string[] = created.map((r) => r.processo_sei);

        for (const updatedRow of updated) {
            processoAtivar.push(updatedRow.processo_sei);
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
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                })
            );
        }

        await this.seiService.atualizaStatusAtivo(processoAtivar, true);

        if (deleted.length > 0) {
            const removidos = await prismaTx.distribuicaoRecursoSei.findMany({
                where: {
                    id: { in: deleted },
                    distribuicao_recurso_id: distribuicaoRecursoId,
                    removido_em: null,
                },
                select: {
                    processo_sei: true,
                },
            });
            const processosRemover = removidos.map((r) => r.processo_sei);
            await this.seiService.atualizaStatusAtivo(processosRemover, false);

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

    async _createTarefasOutroOrgao(prismaTx: Prisma.TransactionClient, distribuicao_id: number, user: PessoaFromJwt) {
        const distribuicaoRecurso = await prismaTx.distribuicaoRecurso.findFirst({
            where: { id: distribuicao_id, removido_em: null },
            select: {
                id: true,
                transferencia_id: true,
                nome: true,
                orgao_gestor: { select: { id: true, sigla: true } },
                transferencia: { select: { workflow_id: true } },
            },
        });

        if (!distribuicaoRecurso || !distribuicaoRecurso.transferencia.workflow_id) {
            throw new InternalServerErrorException(
                'Distribuição de recurso não encontrada ou sem workflow ao criar tarefas.'
            );
        }

        const workflow_id = distribuicaoRecurso.transferencia.workflow_id;

        // 1. Fetch workflow phases with 'OutroOrgao' responsibility
        const andamentoFases = await prismaTx.transferenciaAndamento.findMany({
            where: {
                transferencia_id: distribuicaoRecurso.transferencia_id,
                removido_em: null,
                workflow_fase: {
                    fluxos: {
                        some: {
                            responsabilidade: WorkflowResponsabilidade.OutroOrgao,
                            removido_em: null,
                            fluxo: { workflow_id },
                        },
                    },
                },
            },
            select: {
                workflow_fase: {
                    select: {
                        fase: true,
                        fluxos: {
                            select: {
                                duracao: true,
                            },
                        },
                    },
                },
                tarefaEspelhada: {
                    select: {
                        id: true,
                        inicio_planejado: true,
                        termino_planejado: true,
                        duracao_planejado: true,
                        tarefa_pai_id: true,
                        dependencias: { select: { id: true, dependencia_tarefa_id: true, tipo: true, latencia: true } },
                    },
                },
            },
        });

        // 2. Fetch workflow tasks with 'OutroOrgao' responsibility
        const andamentoTarefas = await prismaTx.transferenciaAndamentoTarefa.findMany({
            where: {
                transferencia_andamento: {
                    transferencia_id: distribuicaoRecurso.transferencia_id,
                    removido_em: null,
                },
                workflow_tarefa: {
                    fluxoTarefas: {
                        some: {
                            responsabilidade: WorkflowResponsabilidade.OutroOrgao,
                            removido_em: null,
                            fluxo_fase: { fluxo: { workflow_id } },
                        },
                    },
                },
            },
            select: {
                workflow_tarefa: {
                    select: {
                        tarefa_fluxo: true,
                        fluxoTarefas: {
                            select: {
                                duracao: true,
                            },
                        },
                    },
                },
                transferencia_andamento: {
                    select: {
                        tarefaEspelhada: {
                            select: {
                                id: true,
                                inicio_planejado: true,
                                termino_planejado: true,
                                duracao_planejado: true,
                                dependencias: {
                                    select: { id: true, dependencia_tarefa_id: true, tipo: true, latencia: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const itensParaCriar: ItemParaCriarTarefa[] = [];
        const parentTaskIds = new Set<number>();

        // 3. Unify phases into the creation list
        andamentoFases.forEach((af) => {
            const tarefaPai = af.tarefaEspelhada?.[0];
            if (tarefaPai) {
                parentTaskIds.add(tarefaPai.id);
                itensParaCriar.push({
                    nome_base: af.workflow_fase.fase,
                    tarefa_pai_id: tarefaPai.id,
                    inicio_planejado: tarefaPai.inicio_planejado,
                    termino_planejado: tarefaPai.termino_planejado,
                    duracao_planejado: af.workflow_fase.fluxos[0].duracao,
                    dependencias: tarefaPai.dependencias.map((d) => ({ ...d, latencia: d.latencia ?? 0 })),
                });
            }
        });

        // 4. Unify tasks into the creation list
        andamentoTarefas.forEach((at) => {
            const tarefaPai = at.transferencia_andamento.tarefaEspelhada?.[0];
            if (tarefaPai) {
                parentTaskIds.add(tarefaPai.id);
                itensParaCriar.push({
                    nome_base: at.workflow_tarefa.tarefa_fluxo,
                    tarefa_pai_id: tarefaPai.id,
                    inicio_planejado: tarefaPai.inicio_planejado,
                    termino_planejado: tarefaPai.termino_planejado,
                    duracao_planejado: at.workflow_tarefa.fluxoTarefas[0].duracao,
                    dependencias: tarefaPai.dependencias.map((d) => ({ ...d, latencia: d.latencia ?? 0 })),
                });
            }
        });

        if (itensParaCriar.length === 0) {
            await this._validarTopologia(prismaTx, distribuicao_id, user);
            return;
        }

        const tarefaCronograma = await prismaTx.tarefaCronograma.findFirst({
            where: { transferencia_id: distribuicaoRecurso.transferencia_id, removido_em: null },
            select: { id: true },
        });
        if (!tarefaCronograma) throw new InternalServerErrorException('Cronograma da transferência não encontrado.');

        // --- Dependency Transfer Logic (for first child creation) ---
        const transitioningParents = await prismaTx.tarefa.findMany({
            where: {
                id: { in: Array.from(parentTaskIds) },
                n_filhos_imediatos: 0,
                removido_em: null,
            },
            select: {
                id: true,
                dependencias: {
                    select: { dependencia_tarefa_id: true, tipo: true, latencia: true },
                },
            },
        });

        const movedDependencies = new Map<number, any[]>();
        const parentIdsToProcess = new Set<number>();

        if (transitioningParents.length > 0) {
            for (const parent of transitioningParents) {
                parentIdsToProcess.add(parent.id);
                if (parent.dependencias.length > 0) {
                    movedDependencies.set(parent.id, parent.dependencias);
                }
            }

            if (parentIdsToProcess.size > 0) {
                await prismaTx.tarefaDependente.deleteMany({
                    where: { tarefa_id: { in: Array.from(parentIdsToProcess) } },
                });
                await prismaTx.tarefa.updateMany({
                    where: { id: { in: Array.from(parentIdsToProcess) } },
                    data: {
                        inicio_planejado: null,
                        termino_planejado: null,
                        duracao_planejado: null,
                        custo_estimado: null,
                        duracao_planejado_calculado: false,
                        inicio_planejado_calculado: false,
                        termino_planejado_calculado: false,
                    },
                });
            }
        }
        // --- End of Dependency Transfer ---

        // --- Inherit Dependencies from Sibling ---
        const parentTasksWithExistingChildren = await prismaTx.tarefa.findMany({
            where: {
                id: { in: Array.from(parentTaskIds) },
                n_filhos_imediatos: { gt: 0 },
                removido_em: null,
            },
            select: { id: true },
        });

        const siblingDependencies = new Map<number, any[]>();
        if (parentTasksWithExistingChildren.length > 0) {
            const firstChildren = await prismaTx.tarefa.findMany({
                where: {
                    tarefa_pai_id: { in: parentTasksWithExistingChildren.map((p) => p.id) },
                    // Use numero 1 OR the lowest numero if 1 doesn't exist for some reason
                    numero: 1,
                    removido_em: null,
                },
                select: {
                    tarefa_pai_id: true,
                    dependencias: {
                        select: { dependencia_tarefa_id: true, tipo: true, latencia: true },
                    },
                },
            });

            for (const child of firstChildren) {
                if (child.tarefa_pai_id) {
                    siblingDependencies.set(child.tarefa_pai_id, child.dependencias);
                }
            }
        }
        // --- END OF Sibling Dependency Logic ---

        const tarefasExistentes = await prismaTx.tarefa.findMany({
            where: {
                tarefa_cronograma_id: tarefaCronograma.id,
                nivel: 3,
                tarefa_pai_id: { in: itensParaCriar.map((i) => i.tarefa_pai_id) },
                removido_em: null,
            },
            orderBy: { numero: 'desc' },
            select: { tarefa_pai_id: true, numero: true },
        });

        const maxNumeroPorPai = new Map<number, number>();
        for (const t of tarefasExistentes) {
            if (t.tarefa_pai_id && !maxNumeroPorPai.has(t.tarefa_pai_id)) {
                maxNumeroPorPai.set(t.tarefa_pai_id, t.numero);
            }
        }

        itensParaCriar.sort((a, b) => a.tarefa_pai_id - b.tarefa_pai_id);

        const newChildTaskIds = new Map<number, number>();
        const creationPromises = [];

        for (const item of itensParaCriar) {
            const numeroAtual = maxNumeroPorPai.get(item.tarefa_pai_id) ?? 0;
            const novoNumero = numeroAtual + 1;
            maxNumeroPorPai.set(item.tarefa_pai_id, novoNumero);

            let finalDependencies: any[];
            const inheritedFromParent = movedDependencies.get(item.tarefa_pai_id);
            const inheritedFromSibling = siblingDependencies.get(item.tarefa_pai_id);

            if (inheritedFromParent) {
                finalDependencies = inheritedFromParent;
            } else if (inheritedFromSibling) {
                finalDependencies = inheritedFromSibling;
            } else {
                finalDependencies = item.dependencias;
            }

            const createAndGetId = async () => {
                const new_task = await prismaTx.tarefa.create({
                    data: {
                        tarefa_cronograma_id: tarefaCronograma.id,
                        tarefa_pai_id: item.tarefa_pai_id,
                        nivel: 3,
                        numero: novoNumero,
                        tarefa: `${item.nome_base} - ${distribuicaoRecurso.nome}`,
                        descricao: `${item.nome_base} - ${distribuicaoRecurso.nome}`,
                        distribuicao_recurso_id: distribuicaoRecurso.id,
                        recursos: distribuicaoRecurso.orgao_gestor.sigla,
                        orgao_id: distribuicaoRecurso.orgao_gestor.id,
                        inicio_planejado: item.inicio_planejado,
                        termino_planejado: item.termino_planejado,
                        duracao_planejado: item.duracao_planejado,
                        dependencias: {
                            createMany: { data: finalDependencies.map((d) => ({ ...d, latencia: d.latencia ?? 0 })) },
                        },
                    },
                    select: { id: true },
                });
                newChildTaskIds.set(item.tarefa_pai_id, new_task.id);
            };
            creationPromises.push(createAndGetId());
        }

        await Promise.all(creationPromises);

        if (parentIdsToProcess.size > 0) {
            const externalDependenciesToRemap = await prismaTx.tarefaDependente.findMany({
                where: {
                    dependencia_tarefa_id: { in: Array.from(parentIdsToProcess) },
                },
            });

            const remapPromises = [];
            for (const dep of externalDependenciesToRemap) {
                const oldPredecessorId = dep.dependencia_tarefa_id;
                const newPredecessorId = newChildTaskIds.get(oldPredecessorId);

                if (newPredecessorId) {
                    remapPromises.push(
                        prismaTx.tarefaDependente.update({
                            where: { id: dep.id },
                            data: {
                                dependencia_tarefa_id: newPredecessorId,
                            },
                        })
                    );
                }
            }
            await Promise.all(remapPromises);
        }

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
                removido_em: null,
                tarefa_cronograma: {
                    transferencia_id: distribuicaoRecurso.transferencia_id,
                    removido_em: null,
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
                    removido_em: null,
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
                    throw new InternalServerErrorException('Erro ao encontrar tarefa filha para base de projeção.');

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
                    throw new InternalServerErrorException('Erro ao encontrar tarefa filha para base de projeção.');

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

    async marcarComoLido(id: number, dto: SeiLidoStatusDto, user: PessoaFromJwt): Promise<void> {
        await this.findOne(id, user);

        await this.seiService.marcaLidoStatusSei(dto.processo_sei, user.id, dto.lido);
    }
}
