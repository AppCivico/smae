import {
    BadRequestException,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    forwardRef,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma, TarefaCronograma, TarefaDependente, TarefaDependenteTipo } from '@prisma/client';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { Graph } from 'graphlib'; // ta os types de da lib "graphlib" que é por enquanto pure-js
import { DateTime } from 'luxon';
import { TransferenciaService } from 'src/casa-civil/transferencia/transferencia.service';
import { GraphvizService, GraphvizServiceFormat } from 'src/graphviz/graphviz.service';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { DateTransform } from '../../auth/transforms/date.transform';
import { CalculaAtraso } from '../../common/CalculaAtraso';
import { Date2YMD, SYSTEM_TIMEZONE } from '../../common/date2ymd';
import { JOB_PP_TAREFA_ATRASO_LOCK } from '../../common/dto/locks';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoService } from '../projeto/projeto.service';
import {
    CheckDependenciasDto,
    CreateTarefaDto,
    FilterPPTarefa,
    TarefaCronogramaInput,
    TarefaDependenciaDto,
} from './dto/create-tarefa.dto';
import { UpdateTarefaDto, UpdateTarefaRealizadoDto } from './dto/update-tarefa.dto';
import {
    DependenciasDatasDto,
    ListApenasTarefaListDto,
    ListTarefaGenericoDto,
    TarefaDetailDto,
    TarefaItemDbDto,
    TarefaItemProjetadoDto,
} from './entities/tarefa.entity';
import { TarefaDotTemplate } from './tarefa.dot.template';
import { TarefaUtilsService } from './tarefa.service.utils';

// e temos um fork mais atualizado por esse projeto, @dagrejs
const graphlib = require('@dagrejs/graphlib');

export class InferenciaDatasDto {
    @Transform(DateTransform)
    inicio_planejado: Date | null;
    @Transform(DateTransform)
    termino_planejado: Date | null;
    @Type(() => Number)
    duracao_planejado: number | null;
}

export class ValidacaoDatas {
    dependencias_datas: DependenciasDatasDto | null;
    ordem_topologica_inicio_planejado: number[];
    ordem_topologica_termino_planejado: number[];
}

@Injectable()
export class TarefaService {
    private readonly logger = new Logger(TarefaService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly utils: TarefaUtilsService,
        private readonly dotTemplate: TarefaDotTemplate,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => TransferenciaService)) private readonly transferenciaService: TransferenciaService,
        private readonly graphvizService: GraphvizService
    ) {}

    async loadOrCreateByInput(dto: TarefaCronogramaInput, user: PessoaFromJwt): Promise<number> {
        if (dto.projeto_id) {
            const exists = await this.prisma.tarefaCronograma.findFirst({
                where: {
                    projeto_id: dto.projeto_id,
                    removido_em: null,
                },
                select: { id: true },
            });
            if (exists) return exists.id;
            const create = await this.prisma.tarefaCronograma.create({
                data: {
                    projeto_id: dto.projeto_id,
                    criado_em: new Date(Date.now()),
                    criado_por: user.id,
                },
                select: { id: true },
            });
            return create.id;
        }

        if (dto.transferencia_id) {
            // Cronograma só deve ser criado caso a transf. tenha workflow.
            const transferencia = await this.prisma.transferencia.findFirst({
                where: { id: dto.transferencia_id, removido_em: null },
                select: { workflow_id: true },
            });
            if (!transferencia)
                throw new InternalServerErrorException('Erro ao buscar transf em func loadOrCreateByInput.');

            if (transferencia.workflow_id) {
                const exists = await this.prisma.tarefaCronograma.findFirst({
                    where: {
                        transferencia_id: dto.transferencia_id,
                        removido_em: null,
                    },
                    select: { id: true },
                });
                if (exists) return exists.id;

                const create = await this.prisma.tarefaCronograma.create({
                    data: {
                        transferencia_id: dto.transferencia_id,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                    select: { id: true },
                });
                return create.id;
            } else {
                return 0;
            }
        }

        throw new BadRequestException(
            'Faltando projeto_id ou transferencia_id, não é possível criar cronograma tarefa livre no momento.'
        );
    }

    async create(
        tarefaCronoInput: TarefaCronogramaInput,
        dto: CreateTarefaDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        // no create, podemos assumir que é nulo se não receber
        if (!isNaN(dto.duracao_planejado!) && !('inicio_planejado' in dto) && !('termino_planejado' in dto)) {
            dto.inicio_planejado = null;
            dto.termino_planejado = null;
        }
        if (!isNaN(dto.duracao_real!) && !('inicio_real' in dto) && !('termino_real' in dto)) {
            dto.inicio_real = null;
            dto.termino_real = null;
        }

        this.checkIntervalosPlanejado(dto);
        this.checkIntervalosRealizado(dto);

        if (tarefaCronoInput.projeto_id)
            await this.utils.verifica_nivel_maximo_portfolio(tarefaCronoInput.projeto_id, dto.nivel);
        await this.utils.verifica_orgao_existe(dto.orgao_id);

        if (dto.tarefa_pai_id === null && dto.nivel > 1) {
            throw new HttpException('Tarefas com nível maior que 1 necessitam de uma tarefa pai', 400);
        } else if (dto.tarefa_pai_id !== null) {
            const pai = await this.prisma.tarefa.findFirst({
                where: { removido_em: null, id: dto.tarefa_pai_id, tarefa_cronograma_id: tarefaCronoId },
                select: { id: true, nivel: true, numero: true, tarefa: true },
            });
            if (!pai) throw new HttpException(`Tarefa pai (${dto.tarefa_pai_id}) não foi encontrada no projeto.`, 400);
            if (pai.nivel != dto.nivel - 1)
                throw new HttpException(
                    `Nível (${dto.nivel}) inválido para ser filho imediato da tarefa pai enviada (nível ${pai.nivel}).`,
                    400
                );

            await this.verificaPaiTemDependencias(pai);
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                await this.utils.lockTarefaCrono(prismaTx, tarefaCronoId);

                const calcDependencias = await this.calcDataDependencias(tarefaCronoId, prismaTx, {
                    tarefa_corrente_id: 0,
                    dependencias: dto.dependencias,
                });
                const dataDependencias = calcDependencias.dependencias_datas;

                let duracao_planejado_calculado = false;
                let inicio_planejado_calculado = false;
                let termino_planejado_calculado = false;

                if (dataDependencias != null) {
                    duracao_planejado_calculado = dataDependencias.duracao_planejado_calculado;
                    inicio_planejado_calculado = dataDependencias.inicio_planejado_calculado;
                    termino_planejado_calculado = dataDependencias.termino_planejado_calculado;

                    if (duracao_planejado_calculado && dto.duracao_planejado) {
                        //throw new HttpException("Duração não é aceita, pois será calculada automaticamente pelas dependências.", 400);
                        dto.duracao_planejado = dataDependencias.duracao_planejado;
                    } else if (duracao_planejado_calculado) {
                        dto.duracao_planejado = dataDependencias.duracao_planejado;
                    }

                    if (inicio_planejado_calculado && dto.inicio_planejado) {
                        //throw new HttpException("Início planejado não é aceita, pois será calculado automaticamente pelas dependências.", 400);
                        dto.inicio_planejado = dataDependencias.inicio_planejado;
                    } else if (inicio_planejado_calculado) {
                        dto.inicio_planejado = dataDependencias.inicio_planejado;
                    }

                    if (termino_planejado_calculado && dto.termino_planejado) {
                        //throw new HttpException("Término planejado não é aceita, pois será calculado automaticamente pelas dependências.", 400);
                        dto.termino_planejado = dataDependencias.termino_planejado;
                    } else if (termino_planejado_calculado) {
                        dto.termino_planejado = dataDependencias.termino_planejado;
                    }

                    // usa a função do banco, que sabe fazer conta muito melhor que duplicar o código aqui no JS
                    const patched = await this.calcInfereDataPeloPeriodo(prismaTx, dto, dataDependencias);
                    dto.inicio_planejado = patched.inicio_planejado;
                    dto.termino_planejado = patched.termino_planejado;
                    dto.duracao_planejado = patched.duracao_planejado;
                } else {
                    // não tem dependências, e como é create, tbm não há filhos

                    if (dto.inicio_planejado && dto.termino_planejado && !dto.duracao_planejado)
                        throw new HttpException('Se há Início e Término planejado, deve existir uma duração.', 400);

                    if (dto.duracao_planejado && dto.inicio_planejado && !dto.termino_planejado)
                        throw new HttpException('Se há Início e Duração planejado, deve existir um Término.', 400);

                    if (dto.duracao_planejado && dto.termino_planejado && !dto.inicio_planejado)
                        throw new HttpException('Se há Término e Duração planejado, deve existir um Início.', 400);
                }

                const numero = await this.utils.incrementaNumero(dto, prismaTx, tarefaCronoId);

                const tarefa = await prismaTx.tarefa.create({
                    data: {
                        tarefa_cronograma_id: tarefaCronoId,
                        orgao_id: dto.orgao_id,
                        descricao: dto.descricao,
                        nivel: dto.nivel,
                        tarefa: dto.tarefa,
                        recursos: dto.recursos,
                        tarefa_pai_id: dto.tarefa_pai_id,

                        inicio_planejado: dto.inicio_planejado,
                        termino_planejado: dto.termino_planejado,
                        duracao_planejado: dto.duracao_planejado,
                        custo_estimado: dto.custo_estimado,

                        inicio_real: dto.inicio_real,
                        termino_real: dto.termino_real,
                        duracao_real: dto.duracao_real,

                        custo_real: dto.custo_real,
                        eh_marco: dto.eh_marco,

                        numero: numero,

                        duracao_planejado_calculado,
                        inicio_planejado_calculado,
                        termino_planejado_calculado,
                        ordem_topologica_inicio_planejado: calcDependencias.ordem_topologica_inicio_planejado,
                        ordem_topologica_termino_planejado: calcDependencias.ordem_topologica_termino_planejado,
                    },
                });

                if (dto.dependencias && dto.dependencias.length > 0) {
                    await prismaTx.tarefaDependente.createMany({
                        data: dto.dependencias.map((d) => {
                            return {
                                tarefa_id: tarefa.id,
                                dependencia_tarefa_id: d.dependencia_tarefa_id,
                                latencia: d.latencia,
                                tipo: d.tipo,
                            };
                        }),
                    });
                }

                return { id: tarefa.id };
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 50000,
            }
        );

        return { id: created.id };
    }

    private async verificaPaiTemDependencias(pai: { id: number; tarefa: string; numero: number; nivel: number }) {
        const qtdeDeps = await this.prisma.tarefaDependente.count({
            where: { tarefa_id: pai.id },
        });
        if (qtdeDeps > 0)
            throw new BadRequestException(
                `Não é possível criar a tarefa. Remova primeiro as dependências da tarefa "${pai.tarefa}" (nível ${pai.nivel}, número ${pai.numero}) antes de criar tarefas subordinadas.`
            );
    }

    private async calcInfereDataPeloPeriodo(
        prismaTx: Prisma.TransactionClient,
        dto: {
            inicio_planejado?: Date | null;
            termino_planejado?: Date | null;
            duracao_planejado?: number | null;
        },
        dataDependencias: DependenciasDatasDto
    ): Promise<InferenciaDatasDto> {
        const json = JSON.stringify({
            inicio_planejado_corrente: dto.inicio_planejado,
            termino_planejado_corrente: dto.termino_planejado,
            duracao_planejado_corrente: dto.duracao_planejado,

            inicio_planejado_calculado: dataDependencias.inicio_planejado,
            termino_planejado_calculado: dataDependencias.termino_planejado,
            duracao_planejado_calculado: dataDependencias.duracao_planejado,

            inicio_planejado_calculado_flag: dataDependencias.inicio_planejado_calculado,
            termino_planejado_calculado_flag: dataDependencias.termino_planejado_calculado,
        });

        const res = (await prismaTx.$queryRaw`select infere_data_inicio_ou_termino(${json}::jsonb)`) as any;
        this.logger.debug(JSON.stringify(res));
        return plainToInstance(InferenciaDatasDto, res[0]['infere_data_inicio_ou_termino']);
    }

    async findAll(
        tarefaCronoInput: TarefaCronogramaInput,
        user: PessoaFromJwt,
        _filter: FilterPPTarefa
    ): Promise<ListTarefaGenericoDto> {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        const linhas = tarefaCronoId !== 0 ? (await this.buscaLinhasRecalcProjecao(tarefaCronoId, user)).linhas : [];

        // sempre carregando o projeto depois, pois as triggers tbm só vão carregar os dados após o update da projeção
        // antes os dados eram atualizados no banco e tbm diretamente na referencia que seria retornada
        // agora fica com essa carga e verificação "atrasada" em relação ao outros endpoints que geralmente carregam o
        // projeto primeiro
        const projeto = tarefaCronoInput.projeto_id
            ? await this.projetoService.findOne('AUTO', tarefaCronoInput.projeto_id, user, 'ReadOnly')
            : null;

        const cabecalhoTransferencia = tarefaCronoInput.transferencia_id
            ? await this.transferenciaService.getCronogramaCabecalho(tarefaCronoInput.transferencia_id)
            : null;

        return {
            linhas: linhas,
            projeto: projeto,
            cabecalho: cabecalhoTransferencia,
        };
    }

    async buscaLinhasRecalcProjecao(tarefaCronoId: number, user: PessoaFromJwt | null) {
        const antesQuery = Date.now();
        const rows = await this.findAllRows(tarefaCronoId);
        this.logger.warn(`query took ${Date.now() - antesQuery} ms`);
        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');
        const rowsWithAtraso = rows.map((r) => {
            return {
                ...r,
                ...this.calcPodeEditar(r, user),
                atraso: CalculaAtraso.emDias(hoje, r.termino_planejado, r.termino_real),
            };
        });

        const antesCalc = Date.now();
        const ret = await this.calculaAtrasoCronograma(rowsWithAtraso, tarefaCronoId);
        this.logger.warn(`calculaAtrasoCronograma took ${Date.now() - antesCalc} ms`);
        return ret;
    }

    private calcPodeEditar(
        r: {
            orgao: { id: number } | null;
        },
        user: PessoaFromJwt | null
    ): { pode_editar: boolean; pode_editar_realizado: boolean } {
        if (user !== null) {
            const pode_editar_realizado = r.orgao !== null;
            // se o órgão estiver null,
            // a tela do realizado não tem esse campo, portanto ainda não terminaram de configurar o cronograma
            // que pode ter sido clonado ou puxado de um workflow

            if (
                user.hasSomeRoles([
                    // tudo igual para quem é de projetos, fica sempre true, e segue a regra do frontend
                    'Projeto.administrador',
                    'Projeto.administrador_no_orgao',
                    'SMAE.gestor_de_projeto',
                    'SMAE.colaborador_de_projeto',
                    // para quem é de transferência, só pode editar quem é administrador
                    'CadastroTransferencia.administrador',

                    'ProjetoMDO.administrador',
                    'ProjetoMDO.administrador_no_orgao',
                    'MDO.gestor_de_projeto',
                    'MDO.colaborador_de_projeto',
                ])
            ) {
                return {
                    pode_editar: true,
                    pode_editar_realizado: pode_editar_realizado,
                };
            }

            // Caso seja Gestor de distribuição de recurso
            // Por mais que tenha o mesmo órgão que a tarefa, não pode editar.
            if (user.hasSomeRoles(['SMAE.gestor_distribuicao_recurso'])) {
                return {
                    pode_editar: false,
                    pode_editar_realizado: false,
                };
            }

            // TODO passar o tipo do projeto da cá, pra conseguir liberar o acesso total de editação
            // para quem é do MDO, não há nenhum

            return {
                pode_editar: !!r.orgao && !!user.orgao_id && r.orgao.id == user.orgao_id,
                pode_editar_realizado: pode_editar_realizado,
            };
        }

        return {
            pode_editar: false,
            pode_editar_realizado: false,
        };
    }

    private async findAllRows(tarefa_cronograma_id: number) {
        return await this.prisma.tarefa.findMany({
            where: {
                tarefa_cronograma_id,
                removido_em: null,
            },
            orderBy: [{ nivel: 'desc' }, { numero: 'asc' }, { id: 'desc' }],
            select: {
                id: true,
                orgao: { select: { id: true, sigla: true, descricao: true } },
                nivel: true,
                numero: true,
                tarefa_pai_id: true,
                tarefa: true,
                inicio_planejado: true,
                termino_planejado: true,
                duracao_planejado: true,
                inicio_real: true,
                termino_real: true,
                duracao_real: true,
                custo_estimado: true,
                custo_real: true,
                n_filhos_imediatos: true,
                n_dep_inicio_planejado: true,
                n_dep_termino_planejado: true,
                percentual_concluido: true,
                eh_marco: true,
                dependencias: {
                    select: {
                        dependencia_tarefa_id: true,
                        tipo: true,
                        latencia: true,
                    },
                },

                db_projecao_atraso: true,
                db_projecao_inicio: true,
                db_projecao_termino: true,
                recursos: true,
            },
        });
    }

    private async calculaAtrasoCronograma(
        tarefasOrig: TarefaItemDbDto[],
        tarefaCronoId: number
    ): Promise<ListApenasTarefaListDto> {
        const ret: ListApenasTarefaListDto = { linhas: [] };

        const tarefaCronograma = await this.prisma.tarefaCronograma.findFirstOrThrow({
            where: { id: tarefaCronoId },
        });

        // nesse caso, vai usar UTC, pois o javascript e o Prisma volta o Date como UTC.
        const hoje = DateTime.local({ zone: 'UTC' }).startOf('day');
        const tarefas = plainToInstance(TarefaItemProjetadoDto, <any[]>JSON.parse(JSON.stringify(tarefasOrig)));

        const orig_tarefas_por_id: Record<number, (typeof tarefasOrig)[0]> = {};
        for (const tarefa of tarefasOrig) {
            orig_tarefas_por_id[tarefa.id] = tarefa;
        }

        const tarefas_por_id: Record<number, (typeof tarefas)[0]> = {};
        for (const tarefa of tarefas) {
            // pula quem não tiver dependencias como array (nao na spec do TarefaItemProjetadoDto)
            if (Array.isArray(tarefa.dependencias) == false) continue;

            tarefas_por_id[tarefa.id] = tarefa;
        }

        let max_term_planjeado: Date | undefined = undefined;
        let max_term_proj: DateTime | undefined = undefined;

        // Recursive function to calculate projections
        const jaPassou = new Set<number>();
        const calculaProjecoes = (tarefa: TarefaItemProjetadoDto) => {
            if (jaPassou.has(tarefa.id)) return;
            jaPassou.add(tarefa.id);

            // a tarefa tem que ter todas as datas de planejamento para funcionar
            if (!tarefa.inicio_planejado || !tarefa.duracao_planejado || !tarefa.termino_planejado) {
                console.warn(
                    `tarefa ${tarefa.id} sem inicio_planejado|duracao_planejado|termino_planejado, não será calculado projeção`
                );
                return;
            }

            if (tarefa.nivel == 1) {
                if (
                    !max_term_planjeado ||
                    (max_term_planjeado && tarefa.termino_planejado.valueOf() > max_term_planjeado.valueOf())
                )
                    max_term_planjeado = tarefa.termino_planejado;
            }

            // se já tem uma data de termino, vamos colocar ela na projeção,
            // pra mais tarde saber se essa tarefa vai ter um atraso no parent ou não
            if (tarefa.termino_real) {
                if (!tarefa.inicio_real)
                    this.logger.error(
                        `tarefa.inicio_real da tarefa ID ${tarefa.id} está nulo mas deveria existir (pois há data de termino), assumindo data corrente.`
                    );
                tarefa.projecao_inicio = tarefa.inicio_real
                    ? DateTime.fromJSDate(tarefa.inicio_real, { zone: 'UTC' })
                    : hoje;
                tarefa.projecao_termino = DateTime.fromJSDate(tarefa.termino_real, { zone: 'UTC' });

                this.logger.debug(`tarefa ${tarefa.id} já finalizou`);
                return;
            }

            // se não tem filhos (é folha, mesmo se for no nivel 1) OU
            // se a tarefa tem dependência, mas já iniciou, ela entra no algorítimo normal (soma da duração planejada)
            //if (tarefa.n_filhos_imediatos == 0 && (tarefa.dependencias.length == 0 || tarefa.inicio_real)) {
            if (tarefa.dependencias.length == 0 || tarefa.inicio_real) {
                // se não tem inicio real preenchido, considera que começou hj
                tarefa.projecao_inicio = tarefa.inicio_real
                    ? DateTime.fromJSDate(tarefa.inicio_real, { zone: 'UTC' })
                    : hoje;

                tarefa.projecao_termino = tarefa.projecao_inicio.plus({ days: tarefa.duracao_planejado - 1 });
                this.logger.debug(
                    `tarefa ${tarefa.id} não tem dependência, projecao_inicio=${Date2YMD.toString(
                        tarefa.projecao_inicio.toJSDate()
                    )}, projecao_termino=${Date2YMD.toString(tarefa.projecao_termino.toJSDate())}`
                );
                return;
            }

            // If the task has dependencies, recursively calculate the projections of its dependencies
            for (const dependencia of tarefa.dependencias) {
                const depTarefa = tarefas_por_id[dependencia.dependencia_tarefa_id];
                if (!depTarefa) continue;

                calculaProjecoes(depTarefa);
            }

            // After calculating the projections of the dependencies, calculate the projections of the current task
            let dataInicioMax: DateTime | undefined;
            let dataTerminoMax: DateTime | undefined;

            for (const dependencia of tarefa.dependencias) {
                const depTarefa = tarefas_por_id[dependencia.dependencia_tarefa_id];
                if (!depTarefa) continue;

                let depDateInicio: DateTime | undefined;
                let depDateTermino: DateTime | undefined;

                switch (dependencia.tipo) {
                    case TarefaDependenteTipo.termina_pro_inicio:
                        depDateInicio = depTarefa.termino_real
                            ? DateTime.fromJSDate(depTarefa.termino_real, { zone: 'UTC' })
                            : depTarefa.projecao_termino;
                        break;
                    case TarefaDependenteTipo.inicia_pro_inicio:
                        depDateInicio = depTarefa.inicio_real
                            ? DateTime.fromJSDate(depTarefa.inicio_real, { zone: 'UTC' })
                            : depTarefa.projecao_inicio;
                        break;
                    case TarefaDependenteTipo.inicia_pro_termino:
                        depDateTermino = depTarefa.inicio_real
                            ? DateTime.fromJSDate(depTarefa.inicio_real, { zone: 'UTC' })
                            : depTarefa.projecao_inicio;
                        break;
                    case TarefaDependenteTipo.termina_pro_termino:
                        depDateTermino = depTarefa.termino_real
                            ? DateTime.fromJSDate(depTarefa.termino_real, { zone: 'UTC' })
                            : depTarefa.projecao_termino;
                        break;
                }

                // então vamos setar o inicio estimado, usando o máximo (pois o inicio é após o termino de todas as deps)
                // se a data de termino ficar menor que hoje, usar hoje
                if (depDateInicio) {
                    depDateInicio = depDateInicio.plus({ days: dependencia.latencia });

                    if (!dataInicioMax || (dataInicioMax && depDateInicio.valueOf() > dataInicioMax.valueOf())) {
                        dataInicioMax = depDateInicio;
                    }
                }

                if (depDateTermino) {
                    depDateTermino = depDateTermino.plus({ days: dependencia.latencia });

                    if (!dataTerminoMax || (dataTerminoMax && dataTerminoMax.valueOf() > depDateTermino.valueOf())) {
                        dataTerminoMax = depDateTermino;
                    }
                }
            }

            // se deu pra chegar numa data de termino, usa ela
            // de preferencia com a data de inicio calculada tbm
            if (dataTerminoMax) {
                // só pode usar a data de inicio, se for maior que a data corrente
                tarefa.projecao_inicio =
                    dataInicioMax && dataInicioMax.valueOf() > hoje.valueOf() ? dataInicioMax : hoje;
                tarefa.projecao_termino = dataTerminoMax;
                this.logger.debug(
                    `tarefa ${tarefa.id} calculado com base nas dependências, usando término=data de término máxima das dependências`
                );
            } else {
                // se não encontrou de termino, mas tem data de inicio, usa o inicio projetado com a duração, se tiver disponível

                if (tarefa.duracao_planejado) {
                    this.logger.debug(
                        `tarefa ${tarefa.id} calculado com base nas dependências, usando término=data projeção de inicio + soma da duração planejada`
                    );
                    // só pode usar a data de inicio, se for maior que a data corrente
                    tarefa.projecao_inicio =
                        dataInicioMax && dataInicioMax.valueOf() > hoje.valueOf() ? dataInicioMax : hoje;
                    tarefa.projecao_termino = tarefa.projecao_inicio.plus({ days: tarefa.duracao_planejado - 1 });
                } else {
                    this.logger.warn(
                        `tarefa ${tarefa.id} não tem duração planejada e não foi possível projeção a duração pelas dependências`
                    );
                }
            }
        };

        // Calculate projections for all tasks
        for (const tarefa of tarefas) {
            calculaProjecoes(tarefa);
        }

        // calculando projeção de quem tem filhos
        for (const tarefa of tarefas) {
            // filha quem não tem filho
            if (tarefa.n_filhos_imediatos == 0) continue;

            // a tarefa tem que ter todas as datas de planejamento para funcionar
            if (!tarefa.inicio_planejado || !tarefa.duracao_planejado || !tarefa.termino_planejado) {
                console.warn(
                    `tarefa ${tarefa.id} sem inicio_planejado|duracao_planejado|termino_planejado, não será calculado projeção pelos filhos`
                );
                continue;
            }

            const filhos = tarefas.filter((r) => {
                return r.tarefa_pai_id == tarefa.id;
            });

            let projecao_inicio_min: DateTime | undefined = undefined;
            let atraso_max = -1;
            for (const filho of filhos) {
                if (!filho.projecao_termino) {
                    console.debug(`tarefa ${tarefa.id}.filho.${filho.id}: projecao_termino vazia, pulando...`);
                    continue;
                }

                if (
                    filho.projecao_inicio &&
                    (!projecao_inicio_min ||
                        (projecao_inicio_min && filho.projecao_inicio.valueOf() < projecao_inicio_min.valueOf()))
                )
                    projecao_inicio_min = filho.projecao_inicio;

                // pula quem terminou na hr de fazer projecao do atraso
                // mas tem que ficar calculado a projecao do inicio
                if (filho.termino_real) continue;

                // vai setando a projeção de termino do parent de acordo com o max do filhos
                if (
                    !tarefa.projecao_termino ||
                    (tarefa.projecao_termino && filho.projecao_termino.valueOf() > tarefa.projecao_termino.valueOf())
                )
                    tarefa.projecao_termino = filho.projecao_termino;

                const d = filho.projecao_termino
                    .diff(DateTime.fromJSDate(tarefa.termino_planejado, { zone: 'UTC' }))
                    .as('days');

                if (d > 0) {
                    console.debug(
                        `tarefa ${tarefa.id}.filho.${filho.id}: projecao_termino: ${Date2YMD.toString(
                            filho.projecao_termino.toJSDate()
                        )}, tarefa(pai).termino_planejado: ${Date2YMD.toString(
                            tarefa.termino_planejado
                        )} => ${d} dias de atraso`
                    );
                    filho.projecao_atraso = d;

                    if (atraso_max < d) atraso_max = d;
                } else {
                    console.debug(
                        `tarefa ${tarefa.id}.filho.${filho.id}: projecao_termino: ${Date2YMD.toString(
                            filho.projecao_termino.toJSDate()
                        )}, tarefa(pai).termino_planejado: ${Date2YMD.toString(tarefa.termino_planejado)} => sem atraso`
                    );
                }
            }

            if (atraso_max > 0) {
                console.debug(`tarefa ${tarefa.id} - atraso estimado: ${atraso_max}`);

                tarefa.projecao_atraso = atraso_max;
            } else {
                console.debug(`tarefa ${tarefa.id} - sem atraso`);
                tarefa.projecao_atraso = 0;
            }

            if (projecao_inicio_min) {
                tarefa.projecao_inicio = projecao_inicio_min;
            } else {
                console.warn(`tarefa ${tarefa.id} - faltando projeção de inicio`);
            }

            if (tarefa.projecao_termino)
                console.debug(
                    `tarefa ${tarefa.id} - max projeção termino: ${Date2YMD.toString(
                        tarefa.projecao_termino.toJSDate()
                    )}`
                );
        }

        // mais um loop, agora pra pegar o max da projeção do nivel 1
        // e tbm passar o atraso dos parent pro objeto do retorno
        // e tbm conferir quem precisa atualizar as projeções no banco de dados
        const updates: Promise<any>[] = [];
        for (const tarefa of tarefas) {
            if (tarefa.projecao_atraso && tarefa.n_filhos_imediatos > 0) {
                this.logger.debug(
                    `calculando atraso dos filhos: tarefas_por_id[${tarefa.id}].atraso = ${tarefa.projecao_atraso}`
                );
                tarefa.atraso = tarefa.projecao_atraso;
            }

            const tarefa_orig = orig_tarefas_por_id[tarefa.id];
            if (tarefa_orig) {
                if (
                    tarefa_orig.db_projecao_atraso != tarefa.projecao_atraso ||
                    (tarefa_orig.db_projecao_inicio === null && tarefa.projecao_inicio) ||
                    tarefa_orig.db_projecao_inicio?.valueOf() !== tarefa.projecao_inicio?.valueOf() ||
                    (tarefa_orig.db_projecao_termino === null && tarefa.projecao_termino) ||
                    tarefa_orig.db_projecao_termino?.valueOf() !== tarefa.projecao_termino?.valueOf()
                ) {
                    console.log('----------------------' + tarefa.id);
                    console.log(
                        'Debug: tarefa_orig.db_projecao_atraso !== tarefa.projecao_atraso:',
                        tarefa_orig.db_projecao_atraso != tarefa.projecao_atraso,
                        tarefa_orig.db_projecao_atraso,
                        tarefa.projecao_atraso
                    );
                    console.log(
                        'Debug: tarefa_orig.db_projecao_inicio === null && tarefa.projecao_inicio:',
                        tarefa_orig.db_projecao_inicio === null && tarefa.projecao_inicio,
                        tarefa_orig.db_projecao_inicio,
                        tarefa.projecao_inicio
                    );
                    console.log(
                        'Debug: tarefa_orig.db_projecao_inicio?.valueOf() !== tarefa.projecao_inicio?.valueOf():',
                        tarefa_orig.db_projecao_inicio?.valueOf() !== tarefa.projecao_inicio?.valueOf(),
                        tarefa_orig.db_projecao_inicio?.valueOf(),
                        tarefa.projecao_inicio?.valueOf()
                    );
                    console.log(
                        'Debug: tarefa_orig.db_projecao_termino === null && tarefa.projecao_termino:',
                        tarefa_orig.db_projecao_termino === null && tarefa.projecao_termino,
                        tarefa_orig.db_projecao_termino,
                        tarefa.projecao_termino
                    );
                    console.log(
                        'Debug: tarefa_orig.db_projecao_termino?.valueOf() !== tarefa.projecao_termino?.valueOf():',
                        tarefa_orig.db_projecao_termino?.valueOf() !== tarefa.projecao_termino?.valueOf(),
                        tarefa_orig.db_projecao_termino?.valueOf(),
                        tarefa.projecao_termino?.valueOf()
                    );

                    updates.push(
                        this.prisma.tarefa.update({
                            where: { id: tarefa.id },
                            data: {
                                db_projecao_atraso:
                                    tarefa.projecao_atraso === undefined ? null : tarefa.projecao_atraso,
                                db_projecao_inicio: tarefa.projecao_inicio?.toJSDate() || null,
                                db_projecao_termino: tarefa.projecao_termino?.toJSDate() || null,
                            },
                        })
                    );
                }
            }

            (tarefa as any).db_projecao_atraso = undefined; //tira do retorno pro frontend não receber
            (tarefa as any).db_projecao_inicio = undefined; //tira do retorno pro frontend não receber
            (tarefa as any).db_projecao_termino = undefined; //tira do retorno pro frontend não receber

            // a tarefa tem que ter todas as datas de planejamento para funcionar
            if (!tarefa.projecao_termino || tarefa.nivel !== 1) continue;

            if (!max_term_proj || (max_term_proj && tarefa.projecao_termino.valueOf() > max_term_proj.valueOf()))
                max_term_proj = tarefa.projecao_termino;
        }

        if (updates.length) {
            this.logger.debug(`aguardando sincronização do banco...`);
            await Promise.all(updates);
        }

        await this.recalcCronogramaStatus(tarefaCronograma, max_term_planjeado, max_term_proj, tarefaCronoId);

        ret.linhas = tarefas;

        return ret;
    }

    private async recalcCronogramaStatus(
        tarefaCronograma: TarefaCronograma,
        max_term_planjeado: Date | undefined,
        max_term_proj: DateTime | undefined,
        tarefaCronoId: number
    ) {
        let atraso_projeto: number | null = null;
        let percentual_atraso: number | null = null;
        let projecao_termino: Date | null = null;
        let em_atraso = false;

        // TODO ver como pensar se ta concluído, provavelmente contar se todas as tarefas tem data de termino,
        // ou se o status do projeto é fechado
        let status_cronograma = 'Em dia';
        if (tarefaCronograma.realizado_termino != null) {
            status_cronograma = 'Concluído';
        } else {
            if (tarefaCronograma.projeto_id) {
                this.logger.verbose(
                    `Há projeto no cronograma, verificando se está projetoAcompanhamento está pausado...`
                );
                const estaPausado = await this.prisma.projetoAcompanhamento.findFirst({
                    where: {
                        removido_em: null,
                        projeto_id: tarefaCronograma.projeto_id,
                    },
                    orderBy: [{ data_registro: 'desc' }],
                    take: 1,
                });
                if (estaPausado && estaPausado.cronograma_paralisado) status_cronograma = 'Paralisado';
            }
        }

        if (max_term_planjeado && max_term_proj) {
            const d = max_term_proj.diff(DateTime.fromJSDate(max_term_planjeado, { zone: 'UTC' })).as('days');
            this.logger.debug(
                `projeto max projecao_termino: ${Date2YMD.toString(
                    max_term_proj.toJSDate()
                )}, max termino_planejado: ${Date2YMD.toString(max_term_planjeado)} => ${d} dias de atraso`
            );

            if (d > 0) atraso_projeto = d;
            projecao_termino = max_term_proj.toJSDate();
        }

        if (atraso_projeto && tarefaCronograma.previsao_duracao && tarefaCronograma.previsao_duracao > 0) {
            percentual_atraso = Math.round((atraso_projeto / tarefaCronograma.previsao_duracao) * 100);
            em_atraso = percentual_atraso >= tarefaCronograma.tolerancia_atraso;

            // se por acaso, tiver atraso e ao mesmo tempo já Concluído, manter o Concluído!
            if (em_atraso && status_cronograma != 'Paralisado' && status_cronograma != 'Concluído')
                status_cronograma = 'Atrasado';
        }

        if (
            tarefaCronograma.atraso !== atraso_projeto ||
            tarefaCronograma.projecao_termino !== projecao_termino ||
            tarefaCronograma.em_atraso !== em_atraso ||
            tarefaCronograma.percentual_atraso !== percentual_atraso ||
            tarefaCronograma.status_cronograma !== status_cronograma
        ) {
            this.logger.debug(`iniciando sincronização do status do tarefa cronograma...`);
            await this.prisma.tarefaCronograma.update({
                where: { id: tarefaCronoId },
                data: {
                    atraso: atraso_projeto,
                    projecao_termino,
                    em_atraso,
                    percentual_atraso,
                    status_cronograma,
                },
            });
        }
    }

    async findOne(tarefaCronoInput: TarefaCronogramaInput, id: number, user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        const projeto = tarefaCronoInput.projeto_id
            ? await this.projetoService.findOne('AUTO', tarefaCronoInput.projeto_id, user, 'ReadOnly')
            : null;

        const row = await this.prisma.tarefa.findFirstOrThrow({
            where: {
                tarefa_cronograma_id: tarefaCronoId,
                id: id,
                removido_em: null,
            },
            orderBy: [{ tarefa_pai_id: 'asc' }],
            select: {
                id: true,
                orgao: { select: { id: true, sigla: true, descricao: true } },
                nivel: true,
                numero: true,
                tarefa_pai_id: true,
                tarefa: true,
                inicio_planejado: true,
                termino_planejado: true,
                duracao_planejado: true,
                inicio_real: true,
                termino_real: true,
                duracao_real: true,
                custo_estimado: true,
                custo_real: true,

                inicio_planejado_calculado: true,
                termino_planejado_calculado: true,
                duracao_planejado_calculado: true,

                n_dep_inicio_planejado: true,
                n_dep_termino_planejado: true,

                descricao: true,
                recursos: true,
                n_filhos_imediatos: true,
                percentual_concluido: true,
                dependencias: {
                    select: {
                        dependencia_tarefa_id: true,
                        tipo: true,
                        latencia: true,
                    },
                },
                eh_marco: true,
            },
        });

        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');
        return {
            ...row,
            ...this.calcPodeEditar(row, user),
            atraso: CalculaAtraso.emDias(hoje, row.termino_planejado, row.termino_real),
            projeto: projeto,
        };
    }

    async update(
        tarefaCronoInput: TarefaCronogramaInput,
        id: number,
        dto: UpdateTarefaDto | UpdateTarefaRealizadoDto,
        user: PessoaFromJwt,
        prismaTx?: Prisma.TransactionClient
    ): Promise<RecordWithId> {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        const update = async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const now = new Date(Date.now());

            await this.utils.lockTarefaCrono(prismaTx, tarefaCronoId);

            const tarefa = await prismaTx.tarefa.findFirst({
                where: {
                    removido_em: null,
                    tarefa_cronograma_id: tarefaCronoId,
                    id: id,
                },
                select: {
                    id: true,
                    tarefa_pai_id: true,
                    nivel: true,
                    numero: true,
                    n_filhos_imediatos: true,
                    inicio_planejado: true,
                    termino_planejado: true,
                    duracao_planejado: true,

                    inicio_real: true,
                    termino_real: true,
                    orgao: { select: { id: true } },
                },
            });
            if (!tarefa) throw new HttpException('Tarefa não encontrada.', 404);

            if (
                'duracao_planejado' in dto &&
                !isNaN(dto.duracao_planejado!) &&
                !('inicio_planejado' in dto) &&
                !('termino_planejado' in dto)
            ) {
                dto.inicio_planejado = tarefa.inicio_planejado;
                dto.termino_planejado = tarefa.termino_planejado;
            }

            if (
                'duracao_real' in dto &&
                !isNaN(dto.duracao_real!) &&
                !('inicio_real' in dto) &&
                !('termino_real' in dto)
            ) {
                dto.inicio_real = tarefa.inicio_real;
                dto.termino_real = tarefa.termino_real;
            }

            this.checkIntervalosPlanejado(dto);
            this.checkIntervalosRealizado(dto);

            const permissoes = this.calcPodeEditar(tarefa, user);

            if (!permissoes.pode_editar && dto instanceof UpdateTarefaDto)
                throw new HttpException('Usuário não tem permissão para editar esta tarefa.', 403);

            if (!permissoes.pode_editar_realizado && dto instanceof UpdateTarefaRealizadoDto)
                throw new HttpException('Usuário não tem permissão para editar esta tarefa.', 403);

            if ('dependencias' in dto && dto.dependencias !== undefined && tarefa.n_filhos_imediatos == 0) {
                const calcDependencias = await this.calcDataDependencias(tarefaCronoId, prismaTx, {
                    tarefa_corrente_id: tarefa.id,
                    dependencias: dto.dependencias,
                });
                const dataDependencias = calcDependencias!.dependencias_datas;

                let duracao_planejado_calculado = false;
                let inicio_planejado_calculado = false;
                let termino_planejado_calculado = false;

                if (dataDependencias != null) {
                    duracao_planejado_calculado = dataDependencias.duracao_planejado_calculado;
                    inicio_planejado_calculado = dataDependencias.inicio_planejado_calculado;
                    termino_planejado_calculado = dataDependencias.termino_planejado_calculado;

                    // aqui talvez seja melhor mudar pra undefined, pro front só deixar disabled
                    // mas ai no create ficaria diferente, ou tbm teria que deixar opcional e criar mais checks
                    if (duracao_planejado_calculado && dto.duracao_planejado !== null) {
                        //throw new HttpException("Duração não pode ser enviada, pois será calculada automaticamente pelas dependências.", 400);
                        dto.duracao_planejado = dataDependencias.duracao_planejado;
                    } else if (duracao_planejado_calculado) {
                        dto.duracao_planejado = dataDependencias.duracao_planejado;
                    }

                    if (inicio_planejado_calculado && dto.inicio_planejado !== null) {
                        //throw new HttpException("Início planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                        dto.inicio_planejado = dataDependencias.inicio_planejado;
                    } else if (inicio_planejado_calculado) {
                        dto.inicio_planejado = dataDependencias.inicio_planejado;
                    }

                    if (termino_planejado_calculado && dto.termino_planejado !== null) {
                        //throw new HttpException("Término planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                        dto.termino_planejado = dataDependencias.termino_planejado;
                    } else if (termino_planejado_calculado) {
                        dto.termino_planejado = dataDependencias.termino_planejado;
                    }

                    // achei melhor do que colocar os campos lá no DTO e botar pra esconder no swagger
                    (dto as any).duracao_planejado_calculado = duracao_planejado_calculado;
                    (dto as any).inicio_planejado_calculado = inicio_planejado_calculado;
                    (dto as any).termino_planejado_calculado = termino_planejado_calculado;
                    (dto as any).ordem_topologica_inicio_planejado = calcDependencias.ordem_topologica_inicio_planejado;
                    (dto as any).ordem_topologica_termino_planejado =
                        calcDependencias.ordem_topologica_termino_planejado;

                    // usa a função do banco, que sabe fazer conta muito melhor que duplicar o código aqui no JS
                    const patched = await this.calcInfereDataPeloPeriodo(
                        prismaTx,
                        {
                            inicio_planejado:
                                dto.inicio_planejado === undefined ? tarefa.inicio_planejado : dto.inicio_planejado,
                            termino_planejado:
                                dto.termino_planejado === undefined ? tarefa.termino_planejado : dto.termino_planejado,
                            duracao_planejado:
                                dto.duracao_planejado === undefined ? tarefa.duracao_planejado : dto.duracao_planejado,
                        },
                        dataDependencias
                    );
                    dto.inicio_planejado = patched.inicio_planejado;
                    dto.termino_planejado = patched.termino_planejado;
                    dto.duracao_planejado = patched.duracao_planejado;
                }

                await prismaTx.tarefaDependente.deleteMany({ where: { tarefa_id: tarefa.id } });

                if (dto.dependencias && dto.dependencias.length) {
                    await prismaTx.tarefaDependente.createMany({
                        data: dto.dependencias.map((d) => {
                            return {
                                tarefa_id: tarefa.id,
                                dependencia_tarefa_id: d.dependencia_tarefa_id,
                                latencia: d.latencia,
                                tipo: d.tipo,
                            };
                        }),
                    });
                }
            }

            if (tarefa.n_filhos_imediatos !== 0) {
                if (dto.percentual_concluido !== undefined)
                    throw new HttpException(
                        'Percentual Concluído não pode ser alterado diretamente nesta tarefa.',
                        400
                    );
                if (dto.inicio_real !== undefined)
                    throw new HttpException('Início Real não pode ser alterado diretamente nesta tarefa.', 400);
                if (dto.termino_real !== undefined)
                    throw new HttpException('Término Real não pode ser alterado diretamente nesta tarefa.', 400);
                if (dto.duracao_real !== undefined)
                    throw new HttpException('Duração Real não pode ser alterada diretamente nesta tarefa.', 400);

                if ('dependencias' in dto) {
                    if (dto.inicio_planejado !== undefined)
                        throw new HttpException(
                            'Início Planejado não pode ser alterado diretamente nesta tarefa.',
                            400
                        );
                    if (dto.termino_planejado !== undefined)
                        throw new HttpException(
                            'Término Planejado não pode ser alterado diretamente nesta tarefa.',
                            400
                        );
                    if (dto.duracao_planejado !== undefined)
                        throw new HttpException(
                            'Duração Planejada não pode ser alterada diretamente nesta tarefa.',
                            400
                        );
                    if (dto.custo_estimado !== undefined)
                        throw new HttpException('Custo Estimado não pode ser alterado diretamente nesta tarefa.', 400);
                    if (dto.custo_real !== undefined)
                        throw new HttpException('Custo Real não pode ser alterado diretamente nesta tarefa.', 400);
                    if (
                        dto.dependencias !== undefined &&
                        Array.isArray(dto.dependencias) &&
                        dto.dependencias.length > 0
                    )
                        throw new HttpException('Não podem existir dependencias nesta tarefa, pois há filhos.', 400);
                }
            }

            if (
                'dependencias' in dto &&
                ((dto.tarefa_pai_id !== undefined && dto.tarefa_pai_id !== tarefa.tarefa_pai_id) ||
                    (dto.numero !== undefined && dto.numero !== tarefa.numero))
            ) {
                if (dto.tarefa_pai_id === undefined) dto.tarefa_pai_id = tarefa.tarefa_pai_id;
                if (dto.nivel === undefined) dto.nivel = tarefa.nivel;
                if (dto.numero === undefined) dto.numero = tarefa.numero;

                if (dto.tarefa_pai_id !== tarefa.tarefa_pai_id) {
                    this.logger.debug(
                        `Mudança da tarefa pai detectada: ${JSON.stringify({
                            novoPaiDesejado: dto.tarefa_pai_id,
                            antigoPai: tarefa.tarefa_pai_id,
                        })}`
                    );

                    if (dto.tarefa_pai_id === null && dto.nivel > 1)
                        throw new HttpException('Tarefas com nível maior que 1 necessitam de uma tarefa pai', 400);

                    const novoPai = dto.tarefa_pai_id
                        ? await this.prisma.tarefa.findFirst({
                              where: {
                                  removido_em: null,
                                  id: dto.tarefa_pai_id,
                                  tarefa_cronograma_id: tarefaCronoId,
                              },
                              select: { nivel: true, id: true, numero: true, tarefa: true },
                          })
                        : null;

                    if (novoPai) await this.verificaPaiTemDependencias(novoPai);

                    if (dto.tarefa_pai_id && novoPai == null)
                        throw new HttpException(
                            `Tarefa pai (${dto.tarefa_pai_id}) não foi encontrada no projeto.`,
                            400
                        );

                    if (novoPai && novoPai.nivel != dto.nivel - 1)
                        throw new HttpException(
                            `Nível (${dto.nivel}) inválido para ser filho imediato da tarefa pai enviada (nível ${novoPai.nivel}).`,
                            400
                        );

                    if (novoPai && tarefaCronoInput.projeto_id) {
                        await this.verifica_nivel_maximo_e_filhos_portfolio(
                            tarefa,
                            prismaTx,
                            tarefaCronoInput.projeto_id,
                            novoPai
                        );
                    }
                    // abaixa o numero de onde era
                    await this.utils.decrementaNumero(
                        {
                            numero: tarefa.numero,
                            tarefa_pai_id: tarefa.tarefa_pai_id,
                        },
                        prismaTx,
                        tarefaCronoId
                    );

                    // aumenta o numero de onde vai entrar
                    dto.numero = await this.utils.incrementaNumero(
                        {
                            numero: dto.numero,
                            tarefa_pai_id: dto.tarefa_pai_id,
                        },
                        prismaTx,
                        tarefaCronoId
                    );
                } else {
                    // mudou apenas o numero
                    this.logger.debug('Apenas mudança de número foi detectada');

                    // abaixa o numero de onde era
                    await this.utils.decrementaNumero(
                        {
                            numero: tarefa.numero,
                            tarefa_pai_id: tarefa.tarefa_pai_id,
                        },
                        prismaTx,
                        tarefaCronoId
                    );

                    // aumenta o numero de onde vai entrar
                    dto.numero = await this.utils.incrementaNumero(
                        {
                            numero: dto.numero,
                            tarefa_pai_id: tarefa.tarefa_pai_id,
                        },
                        prismaTx,
                        tarefaCronoId
                    );
                }
            } else if ('dependencias' in dto) {
                // nao deixar nem o nivel sem passar o pai
                // pq as validações estão apenas acima
                this.logger.warn('removendo campos numero, nivel e tarefa_pai_id da atualização');

                delete dto.numero;
                delete dto.nivel;
                delete dto.tarefa_pai_id;
            }

            const updatedSelf = await prismaTx.tarefa.update({
                where: {
                    id: tarefa.id,
                },
                data: {
                    ...dto,
                    dependencias: undefined,
                    atualizado_em: now,
                },
                select: {
                    transferencia_fase_id: true,
                    transferencia_tarefa_id: true,
                    orgao_id: true,
                    tarefa_cronograma: {
                        select: {
                            transferencia_id: true,
                        },
                    },
                },
            });

            // Caso seja uma tarefa que vem do Workflow.
            // E o termino_real for definido.
            // As mudanças devem refletir no workflow.
            if (dto.termino_real != undefined && updatedSelf.tarefa_cronograma.transferencia_id) {
                if (updatedSelf.transferencia_fase_id) {
                    // TODO? tratar casos de data_inicio null em transferencia_andamento
                    await prismaTx.transferenciaAndamento.update({
                        where: { id: updatedSelf.transferencia_fase_id },
                        data: {
                            data_termino: dto.termino_real ?? null,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });
                } else if (updatedSelf.transferencia_tarefa_id) {
                    await prismaTx.transferenciaAndamentoTarefa.update({
                        where: { id: updatedSelf.transferencia_tarefa_id },
                        data: {
                            feito: dto.termino_real != null ? true : false,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });
                }
            }

            if (updatedSelf.transferencia_tarefa_id != null) {
                const tarefaWorkflow = await prismaTx.transferenciaAndamentoTarefa.findFirstOrThrow({
                    where: { id: updatedSelf.transferencia_tarefa_id },
                    select: {
                        orgao_responsavel_id: true,
                    },
                });

                if (updatedSelf.orgao_id != tarefaWorkflow.orgao_responsavel_id) {
                    await prismaTx.transferenciaAndamentoTarefa.update({
                        where: { id: updatedSelf.transferencia_tarefa_id },
                        data: {
                            orgao_responsavel_id:
                                updatedSelf.orgao_id != tarefaWorkflow.orgao_responsavel_id
                                    ? updatedSelf.orgao_id
                                    : undefined,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });
                }
            }

            if (updatedSelf.transferencia_fase_id != null) {
                const tarefaWorkflow = await prismaTx.transferenciaAndamento.findFirstOrThrow({
                    where: { id: updatedSelf.transferencia_fase_id },
                    select: {
                        orgao_responsavel_id: true,
                    },
                });
                console.log(tarefaWorkflow);

                if (updatedSelf.orgao_id != tarefaWorkflow.orgao_responsavel_id) {
                    await prismaTx.transferenciaAndamento.update({
                        where: { id: updatedSelf.transferencia_fase_id },
                        data: {
                            orgao_responsavel_id: updatedSelf.orgao_id,
                            atualizado_em: new Date(Date.now()),
                            atualizado_por: user.id,
                        },
                    });
                }
            }

            return { id: tarefa.id };
        };

        if (prismaTx) {
            console.log('tem tx');
            return update(prismaTx);
        } else {
            return this.prisma.$transaction(update, {
                isolationLevel: 'Serializable',
                maxWait: 20000,
                timeout: 50000,
            });
        }
    }

    private checkIntervalosPlanejado(dto: UpdateTarefaDto) {
        if (
            ('inicio_planejado' in dto || 'termino_planejado' in dto || 'duracao_planejado' in dto) &&
            !('inicio_planejado' in dto && 'termino_planejado' in dto && 'duracao_planejado' in dto)
        ) {
            throw new BadRequestException(
                'Todas as três propriedades (inicio_planejado, termino_planejado, duracao_planejado) devem estar presentes ou nenhuma delas'
            );
        }

        if ('inicio_planejado' in dto && 'termino_planejado' in dto && 'duracao_planejado' in dto) {
            if (dto.duracao_planejado == null && dto.inicio_planejado !== null && dto.termino_planejado !== null) {
                throw new BadRequestException(
                    'Se a duração planejada é nula, então as datas de início e término planejadas devem ser nulas'
                );
            }

            if (dto.inicio_planejado && dto.termino_planejado && dto.inicio_planejado > dto.termino_planejado) {
                throw new BadRequestException(
                    'Data de início planejado não pode ser maior que a data de término planejado'
                );
            }

            if (
                dto.inicio_planejado &&
                dto.termino_planejado &&
                dto.duracao_planejado !== undefined &&
                dto.duracao_planejado !== null
            ) {
                const duracao = dto.duracao_planejado;
                // tira 1 por regra do sistema, o primeiro dia não conta (é o mesmo dia da atividade)
                const termino = DateTime.fromJSDate(dto.inicio_planejado).plus({ days: duracao - 1 });

                if (termino.valueOf() !== dto.termino_planejado.valueOf()) {
                    throw new BadRequestException(
                        'Data de término planejado não corresponde à duração e data de início planejado'
                    );
                }
            }
        }
    }

    private checkIntervalosRealizado(dto: UpdateTarefaDto) {
        if (
            ('inicio_real' in dto || 'termino_real' in dto || 'duracao_real' in dto) &&
            !('inicio_real' in dto && 'termino_real' in dto && 'duracao_real' in dto)
        ) {
            throw new BadRequestException(
                'Todas as três propriedades (inicio_real, termino_real, duracao_real) devem estar presentes ou nenhuma delas'
            );
        }

        if ('inicio_real' in dto && 'termino_real' in dto && 'duracao_real' in dto) {
            if (dto.duracao_real == null && dto.inicio_real !== null && dto.termino_real !== null) {
                throw new BadRequestException(
                    'Se a duração real é nula, então as datas de início e término realizado também devem ser nulas'
                );
            }

            if (dto.inicio_real && dto.termino_real && dto.inicio_real > dto.termino_real) {
                throw new BadRequestException('Data de início real não pode ser maior que a data de término real');
            }

            if (dto.inicio_real && dto.termino_real && dto.duracao_real !== undefined && dto.duracao_real !== null) {
                const duracao = dto.duracao_real;
                // tira 1 por regra do sistema, o primeiro dia não conta (é o mesmo dia da atividade)
                const termino = DateTime.fromJSDate(dto.inicio_real).plus({ days: duracao - 1 });

                if (termino.valueOf() !== dto.termino_real.valueOf()) {
                    throw new BadRequestException(
                        'Data de término real não corresponde à duração e data de início real'
                    );
                }
            }
        }
    }

    private async verifica_nivel_maximo_e_filhos_portfolio(
        tarefa: { id: number; nivel: number; tarefa_pai_id: number | null; numero: number; n_filhos_imediatos: number },
        prismaTx: Prisma.TransactionClient,
        projetoId: number,
        novoPai: { nivel: number; id: number }
    ) {
        // conta quantos números de níveis que existem abaixo dessa tarefa atualmente
        const buscaFilhos: { numero_de_niveis: number; filhas: number[] }[] = await prismaTx.$queryRaw`
            WITH RECURSIVE tarefa_path AS (
                SELECT id, tarefa_pai_id, nivel::int
                FROM tarefa m
                WHERE m.id = ${tarefa.id}
                and m.removido_em is null
            UNION ALL
                SELECT t.id, t.tarefa_pai_id, t.nivel
                FROM tarefa t
                JOIN tarefa_path tp ON tp.id = t.tarefa_pai_id
                and t.removido_em is null
          )
          SELECT
            max(nivel) - min(nivel) as numero_de_niveis,
            array_agg(id) as filhas
          FROM tarefa_path;`;
        const numero_de_niveis = buscaFilhos[0].numero_de_niveis ?? 0;

        if (buscaFilhos[0].filhas?.includes(novoPai.id))
            throw new HttpException(
                `A nova tarefa-mãe não pode ser uma subordinada da tarefa atual (e nem a própria tarefa)`,
                400
            );

        const portConfig = await prismaTx.projeto.findFirstOrThrow({
            where: { id: projetoId },
            select: { portfolio: { select: { nivel_maximo_tarefa: true } } },
        });

        if (novoPai.nivel + numero_de_niveis > portConfig.portfolio.nivel_maximo_tarefa)
            throw new HttpException(
                `A nova tarefa-mãe não pode ser usada no momento, pois o número de subníveis da tarefa (tarefa-mãe tem nível ${novoPai.nivel} + ${numero_de_niveis}) ultrapassa o configurado no portfólio (${portConfig.portfolio.nivel_maximo_tarefa}).`,
                400
            );
    }

    async remove(tarefaCronoInput: TarefaCronogramaInput, id: number, user: PessoaFromJwt) {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const now = new Date(Date.now());

                await this.utils.lockTarefaCrono(prismaTx, tarefaCronoId);
                const tarefa = await prismaTx.tarefa.findFirst({
                    where: {
                        removido_em: null,
                        tarefa_cronograma_id: tarefaCronoId,
                        id: id,
                    },
                    select: { id: true, tarefa_pai_id: true, nivel: true, numero: true, n_filhos_imediatos: true },
                });
                if (!tarefa) throw new HttpException('Tarefa não encontrada.', 404);
                if (tarefa.n_filhos_imediatos > 0) throw new HttpException('Apague primeiro as tarefas filhas.', 400);

                const tenhoDependencia = await prismaTx.tarefaDependente.findFirst({
                    where: {
                        dependencia_tarefa_id: id,
                    },
                    select: {
                        tarefa: { select: { nivel: true, numero: true, tarefa: true } },
                    },
                });
                if (tenhoDependencia)
                    throw new HttpException(
                        `Tarefa não pode ser removida, remova primeiro a dependência na tarefa "${tenhoDependencia.tarefa.tarefa}", no nível ${tenhoDependencia.tarefa.nivel} número ${tenhoDependencia.tarefa.numero}.`,
                        400
                    );

                const dto = {
                    numero: tarefa.numero,
                    tarefa_pai_id: tarefa.tarefa_pai_id,
                };

                await this.utils.decrementaNumero(dto, prismaTx, tarefaCronoId);

                await prismaTx.tarefa.update({
                    where: {
                        id: tarefa.id,
                    },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                    },
                });

                await prismaTx.tarefaDependente.deleteMany({
                    where: {
                        tarefa_id: tarefa.id,
                    },
                });

                return { id: tarefa.id };
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 15000,
                timeout: 50000,
            }
        );
    }

    private async calcDataDependencias(
        tarefa_cronograma_id: number,
        prismaTx: Prisma.TransactionClient,
        dto: CheckDependenciasDto
    ): Promise<ValidacaoDatas> {
        const deps = dto.dependencias;
        if (!deps || (Array.isArray(deps) && deps.length == 0))
            return {
                dependencias_datas: null,
                ordem_topologica_inicio_planejado: [],
                ordem_topologica_termino_planejado: [],
            };

        const tarefa_corrente_id = dto.tarefa_corrente_id ?? 0;

        // um pouco menos simples, mas ainda que o grafo não pega!
        const buscaParents: { parents: number[] }[] = await prismaTx.$queryRaw`
        WITH RECURSIVE tarefa_path AS (
            SELECT id, tarefa_pai_id, nivel::int, m.tarefa
            FROM tarefa m
            WHERE m.id = ${tarefa_corrente_id}::int
            and m.removido_em is null
            UNION ALL
            SELECT t.id, t.tarefa_pai_id, t.nivel, t.tarefa
            FROM tarefa t
            JOIN tarefa_path tp ON tp.tarefa_pai_id = t.id
            and t.removido_em is null
          )
          SELECT array_agg(tp.id) as parents
          FROM tarefa_path tp;
        `;

        for (const dep of deps) {
            // começando pelo simples, sem query alguma
            if (dep.dependencia_tarefa_id === tarefa_corrente_id)
                throw new HttpException('Você não pode ter como dependência a própria tarefa', 400);

            if (buscaParents[0].parents?.includes(dep.dependencia_tarefa_id))
                throw new HttpException('Você não pode ter como dependência uma tarefa superior a sua tarefa', 400);
        }
        console.log('calcDataDependencias');

        // carrega todas as dependencias, exceto as da tarefa correte (ou nova tarefa, no caso do zero)
        const tarefaDepsProj = await prismaTx.tarefaDependente.findMany({
            where: {
                tarefa: { tarefa_cronograma_id: tarefa_cronograma_id, removido_em: null },
                tarefa_id: { not: tarefa_corrente_id },
            },
        });

        const selfTasks = deps.map((d) => ({ ...d, id: 0, tarefa_id: dto.tarefa_corrente_id ?? 0 }));

        const { ordem_topologica_inicio_planejado: ordemInicio, ordem_topologica_termino_planejado: ordemTermino } =
            await this.valida_grafo_dependencias([...tarefaDepsProj, ...selfTasks], deps, tarefa_corrente_id);

        const json = JSON.stringify(deps);
        const res = (await prismaTx.$queryRaw`select calcula_dependencias_tarefas(${json}::jsonb)`) as any;

        const resp = plainToInstance(DependenciasDatasDto, res[0]['calcula_dependencias_tarefas']);

        // <= 0 pois 0 dias já é negativo nessa situação do smae
        // onde 1 dia de duração o inicio e termino são os mesmos
        // Fica de melhoria pra melhorar essa mensagem, da pra tentar ir refazendo
        // as regras até descobrir qual foi a dependência que causou a data ficar negativa
        // embora seja difícil descobrir exatamente, pois pode ser que uma puxa pro fim, enquanto outra puxa o inicio...
        if (resp.duracao_planejado != null && resp.duracao_planejado <= 0) {
            throw new HttpException(
                {
                    message:
                        'Não é possível utilizar a configuração atual de dependencias, pois o intervalo ficou negativo.',
                    statusCode: 400,
                    extra: resp,
                },
                400
            );
        }

        return {
            dependencias_datas: resp,
            ordem_topologica_inicio_planejado: ordemInicio,
            ordem_topologica_termino_planejado: ordemTermino,
        };
    }

    async calcula_dependencias_tarefas(
        tarefaCronoInput: TarefaCronogramaInput,
        dto: CheckDependenciasDto,
        user: PessoaFromJwt
    ): Promise<DependenciasDatasDto | null> {
        const tarefaCronoId = await this.loadOrCreateByInput(tarefaCronoInput, user);

        const resp = await this.calcDataDependencias(tarefaCronoId, this.prisma, dto);
        if (!resp) return null;

        return resp.dependencias_datas;
    }

    private async valida_grafo_dependencias(
        todasTarefaDepsProj: TarefaDependente[],
        todasDeps: TarefaDependenciaDto[] | undefined | null,
        tarefa_corrente_id: number
    ): Promise<{ ordem_topologica_inicio_planejado: number[]; ordem_topologica_termino_planejado: number[] }> {
        if (!todasDeps || !Array.isArray(todasDeps))
            return {
                ordem_topologica_inicio_planejado: [],
                ordem_topologica_termino_planejado: [],
            };

        const grafo: Graph = new graphlib.Graph({ directed: true });

        // Auxiliar para criar IDs de nó para horários de início e término
        const genInicioId = (taskId: number) => `${taskId}_start`;
        const genTerminoId = (taskId: number) => `${taskId}_end`;

        // Adicionar dependência implícita entre o início e o fim da mesma tarefa
        const addImplicitDep = (taskId: number) => {
            grafo.setEdge(genInicioId(taskId), genTerminoId(taskId));
        };

        const todasTarefasIds = new Set<number>();
        todasTarefasIds.add(tarefa_corrente_id);
        for (const dep of todasTarefaDepsProj) {
            todasTarefasIds.add(dep.tarefa_id);
            todasTarefasIds.add(dep.dependencia_tarefa_id);
        }

        for (const dep of todasDeps) {
            todasTarefasIds.add(dep.dependencia_tarefa_id);
        }

        for (const taskId of todasTarefasIds) {
            grafo.setNode(genInicioId(taskId));
            grafo.setNode(genTerminoId(taskId));
            addImplicitDep(taskId);
        }

        // Cria a conexão das dependências apontando para os nós de início ou término, de acordo com o tipo
        const adicionaDependencia = (fromTaskId: number, toTaskId: number, tipo: TarefaDependenteTipo) => {
            switch (tipo) {
                case TarefaDependenteTipo.termina_pro_inicio:
                    grafo.setEdge(genTerminoId(fromTaskId), genInicioId(toTaskId));
                    break;
                case TarefaDependenteTipo.inicia_pro_inicio:
                    grafo.setEdge(genInicioId(fromTaskId), genInicioId(toTaskId));
                    break;
                case TarefaDependenteTipo.inicia_pro_termino:
                    grafo.setEdge(genInicioId(fromTaskId), genTerminoId(toTaskId));
                    break;
                case TarefaDependenteTipo.termina_pro_termino:
                    grafo.setEdge(genTerminoId(fromTaskId), genTerminoId(toTaskId));
                    break;
            }
        };

        // Adiciona os já existentes
        for (const dep of todasTarefaDepsProj) {
            adicionaDependencia(dep.dependencia_tarefa_id, dep.tarefa_id, dep.tipo);
        }

        // Adiciona as novas
        for (const dep of todasDeps) {
            adicionaDependencia(dep.dependencia_tarefa_id, tarefa_corrente_id, dep.tipo);
        }

        this.logger.debug(`Iniciando validação do grafo...`);
        try {
            // Check for cycles in the combined graph
            if (!graphlib.alg.isAcyclic(grafo)) {
                // há alguns bugs na lib do grafo, que acredito que não ocorrem no nosso caso simples
                // mas essa função, o mais correto seria ser chamada de findSomeCycles
                // pois ela pode não encontrar todos os ciclos que podem existir.
                // de qualquer forma, se um dia existir um bug no isAcyclic (da mesma forma que existe no findCycles)
                // o toposort nunca iria deixar passar, pois é realmente impossível fazer o toposort com um loop
                // ai vai dar erro 500 na hora de validar/salvar

                const cycles = graphlib.alg.findCycles(grafo);
                const tarefasDb = await this.prisma.tarefa.findMany({
                    where: { id: { in: Array.from(todasTarefasIds) } },
                    select: {
                        nivel: true,
                        numero: true,
                        tarefa: true,
                        id: true,
                        tarefa_cronograma_id: true,
                    },
                });
                if (!tarefasDb.length) throw new HttpException('Tarefas não encontradas', 500);

                const tarefasHierarquia = await this.tarefasHierarquia(tarefasDb[0].tarefa_cronograma_id);

                let textoFormatado = 'Há uma ou mais referências circulares nas dependências:\n';
                let encontrouExemplos = false;
                for (const cycle of cycles) {
                    textoFormatado +=
                        cycle
                            .map((nodeId: string) => {
                                const [tarefa_id, tipo] = nodeId.split('_');

                                const tarefa = tarefasDb.filter((t) => t.id == +tarefa_id)[0];
                                let titulo;
                                if (!tarefa) {
                                    titulo = `Nova tarefa corrente`;
                                } else {
                                    titulo = `Tarefa ${tarefasHierarquia[tarefa.id]} "${tarefa.tarefa}"`;
                                }

                                return `${tipo == 'start' ? 'Início' : 'Término'} da tarefa ${titulo}`;
                            })
                            .join(' dependência do ') + '\n';
                    encontrouExemplos = true;
                    break;
                }

                if (!encontrouExemplos) textoFormatado += 'Ciclo sem exemplo';

                throw new HttpException(textoFormatado, 400);
            }

            // faz a ordem topológica para todo o gráfico duma vez
            const ordemTopologica = graphlib.alg.topsort(grafo);

            // cria um index com a posição de cada tarefa em cada lista
            // usa um map para garantir que a ordem seja mantida,
            // o ultimo item é o que tem o maior index ganha, já que pode aparecer mais de uma vez
            const iniNodes = new Map<number, number>();
            const termNodes = new Map<number, number>();

            for (const [index, nodeId] of ordemTopologica.entries()) {
                const [tarefa_id, type] = nodeId.split('_');
                const tarefa_id_number = parseInt(tarefa_id);

                if (type === 'start') {
                    iniNodes.set(tarefa_id_number, index);
                } else {
                    termNodes.set(tarefa_id_number, index);
                }
            }

            return {
                ordem_topologica_inicio_planejado: Array.from(iniNodes.keys()),
                ordem_topologica_termino_planejado: Array.from(termNodes.keys()),
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;
            console.error(error);
            throw new HttpException('Erro na validação das dependências', 500);
        }
    }

    @Cron('15 * * * *')
    async handleCron() {
        if (process.env['DISABLE_TAREFA_CRONTAB']) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para tick do atraso e projeções dos projetos`);
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_PP_TAREFA_ATRASO_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                await this.verificaAtrasoTarefaCronograma();
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    async verificaAtrasoTarefaCronograma() {
        // order by random pra se tiver algum projeto com erro 500, ainda vai eventualmente
        // processar a maioria eventualmente, limite pra não pra não estourar o tempo do lock
        const projetosOuTransf: { id: number; projeto_id: number | null; transferencia_id: number | null }[] =
            await this.prisma.$queryRaw`
        SELECT id, projeto_id, transferencia_id
        from tarefa_cronograma
        WHERE tarefas_proximo_recalculo < NOW() and removido_em is null ORDER BY random() LIMIT 10`;

        const amanha = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day').plus({ day: 1 });
        for (const item of projetosOuTransf) {
            this.logger.debug(`Recalculando atraso e projeções das tarefas crongorama ${JSON.stringify(item)}`);

            await this.buscaLinhasRecalcProjecao(item.id, null);
            await this.prisma.tarefaCronograma.update({
                where: { id: item.id },
                data: {
                    tarefas_proximo_recalculo: amanha.toJSDate(),
                },
            });
        }
    }

    async getEap(
        tarefaCronoId: number,
        tarefaCronoInput: TarefaCronogramaInput,
        format: GraphvizServiceFormat
    ): Promise<NodeJS.ReadableStream> {
        let rootName: string = '';
        if (tarefaCronoInput.projeto_id) {
            const projeto = await this.projetoService.findOne(
                'AUTO',
                tarefaCronoInput.projeto_id,
                undefined,
                'ReadOnly'
            );
            rootName = projeto.nome;
        }

        const rows = await this.findAllRows(tarefaCronoId);

        const graphvizString = this.dotTemplate.buildGraphvizString(rootName, rows);

        const imgStream = await this.graphvizService.generateImage(graphvizString, format);
        return imgStream;
    }

    async tarefasHierarquia(tarefaCronoId: number): Promise<Record<string, string>> {
        const rows = await this.findAllRows(tarefaCronoId);

        const filhosPeloPai: Record<number, typeof rows> = {};
        rows.forEach((row) => {
            const paiId = row.tarefa_pai_id;
            if (paiId !== null) {
                filhosPeloPai[paiId] = filhosPeloPai[paiId] || [];
                filhosPeloPai[paiId].push(row);
            }
        });

        function buscaFilhos(paiId: number, prefix: string): Record<string, string> {
            const result: Record<number, string> = {};
            const filhos = filhosPeloPai[paiId] || [];
            filhos.forEach((filho) => {
                const newPrefix = `${prefix}${prefix ? '.' : ''}${filho.numero}`;
                result[filho.id] = newPrefix;
                const childResults = buscaFilhos(filho.id, newPrefix);
                Object.assign(result, childResults);
            });
            return result;
        }

        const nivel1 = rows.filter((row) => row.tarefa_pai_id === null);
        const resul: Record<string, string> = {};
        nivel1.forEach((r) => {
            resul[r.id] = `${r.numero}`;
            Object.assign(resul, buscaFilhos(r.id, `${r.numero}`));
        });

        return resul;
    }
}
