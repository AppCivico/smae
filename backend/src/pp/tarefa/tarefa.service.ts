import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma, TarefaDependente, TarefaDependenteTipo } from '@prisma/client';
import { plainToInstance, Type } from 'class-transformer';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoDetailDto } from '../projeto/entities/projeto.entity';
import { CheckDependenciasDto, CreateTarefaDto, TarefaDependenciaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto, UpdateTarefaRealizadoDto } from './dto/update-tarefa.dto';
import { DependenciasDatasDto, TarefaDetailDto, TarefaItemDto } from './entities/tarefa.entity';
import { TarefaUtilsService } from './tarefa.service.utils';

// ta os types de da lib "graphlib" que é por enquanto pure-js
import { Graph } from 'graphlib';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from '../../common/date2ymd';
// e temos um fork mais atualizado por esse projeto, @dagrejs
const graphlib = require('@dagrejs/graphlib');

class LoopError extends Error {
    constructor() {
        super();
    }
}

export class InferenciaDatasDto {
    @Type(() => Date)
    inicio_planejado: Date | null
    @Type(() => Date)
    termino_planejado: Date | null
    @Type(() => Number)
    duracao_planejado: number | null
}



export class ValidacaoDatas {
    dependencias_datas: DependenciasDatasDto | null
    ordem_topologica_inicio_planejado: number[]
    ordem_topologica_termino_planejado: number[]
}


@Injectable()
export class TarefaService {
    private readonly logger = new Logger(TarefaService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly utils: TarefaUtilsService,
    ) { }

    async create(projetoId: number, dto: CreateTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        await this.utils.verifica_nivel_maximo(projetoId, dto.nivel);
        await this.utils.verifica_orgao(dto.orgao_id);

        if (
            dto.tarefa_pai_id === null && dto.nivel > 1
        ) {
            throw new HttpException('Tarefas com nível maior que 1 necessitam de uma tarefa pai', 400);
        } else if (dto.tarefa_pai_id !== null) {
            const pai = await this.prisma.tarefa.findFirst({ where: { removido_em: null, id: dto.tarefa_pai_id, projeto_id: projetoId }, select: { nivel: true } });
            if (!pai) throw new HttpException(`Tarefa pai (${dto.tarefa_pai_id}) não foi encontrada no projeto.`, 400);
            if (pai.nivel != dto.nivel - 1) throw new HttpException(`Nível (${dto.nivel}) inválido para ser filho imediato da tarefa pai enviada (nível ${pai.nivel}).`, 400);
        }

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {

            await this.utils.lockProjeto(prismaTx, projetoId);

            const calcDependencias = await this.calcDataDependencias(projetoId, prismaTx, {
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
                    throw new HttpException("Se há Início e Término planejado, deve existir uma duração.", 400);

                if (dto.duracao_planejado && dto.inicio_planejado && !dto.termino_planejado)
                    throw new HttpException("Se há Início e Duração planejado, deve existir um Término.", 400);

                if (dto.duracao_planejado && dto.termino_planejado && !dto.inicio_planejado)
                    throw new HttpException("Se há Término e Duração planejado, deve existir um Início.", 400);
            }

            const numero = await this.utils.incrementaNumero(dto, prismaTx, projetoId);

            const tarefa = await prismaTx.tarefa.create({
                data: {
                    projeto_id: projetoId,
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

                    numero: numero,

                    duracao_planejado_calculado,
                    inicio_planejado_calculado,
                    termino_planejado_calculado,
                    ordem_topologica_inicio_planejado: calcDependencias.ordem_topologica_inicio_planejado,
                    ordem_topologica_termino_planejado: calcDependencias.ordem_topologica_termino_planejado,
                }
            });

            if (dto.dependencias && dto.dependencias.length > 0) {
                await prismaTx.tarefaDependente.createMany({
                    data: dto.dependencias.map(d => {
                        return {
                            tarefa_id: tarefa.id,
                            dependencia_tarefa_id: d.dependencia_tarefa_id,
                            latencia: d.latencia,
                            tipo: d.tipo,
                        }
                    })
                });
            }

            return { id: tarefa.id }
        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 50000,
        });

        return { id: created.id }
    }

    async calcInfereDataPeloPeriodo(prismaTx: Prisma.TransactionClient,
        dto: {
            inicio_planejado?: Date | null,
            termino_planejado?: Date | null,
            duracao_planejado?: number | null
        },
        dataDependencias: DependenciasDatasDto): Promise<InferenciaDatasDto> {

        const json = JSON.stringify({
            inicio_planejado_corrente: dto.inicio_planejado,
            termino_planejado_corrente: dto.termino_planejado,
            duracao_planejado_corrente: dto.duracao_planejado,

            inicio_planejado_calculado: dataDependencias.inicio_planejado,
            termino_planejado_calculado: dataDependencias.termino_planejado,
            duracao_planejado_calculado: dataDependencias.duracao_planejado,
        });

        const res = await prismaTx.$queryRaw`select infere_data_inicio_ou_termino(${json}::jsonb)` as any;
        this.logger.debug(JSON.stringify(res));
        return plainToInstance(InferenciaDatasDto, res[0]['infere_data_inicio_ou_termino']);
    }


    async findAll(projetoId: number, user: PessoaFromJwt): Promise<TarefaItemDto[]> {

        const rows = await this.prisma.tarefa.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null,
            },
            orderBy: [
                { tarefa_pai_id: 'asc' }
            ],
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
                percentual_concluido: true
            }
        });

        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');
        return rows.map((r) => {
            return {
                ...r,
                atraso: this.calculaAtraso(hoje, r.termino_planejado, r.termino_real),
            }
        });
    }

    private calculaAtraso(hoje: DateTime, termino_planejado: Date | null, termino_real: Date | null): number | null {
        // se sabe quando começa, não ta atrasado
        if (termino_planejado == null) return null;
        // se já acabou, não ta atrasado
        if (termino_real != null) return null;

        const d = DateTime.fromJSDate(termino_planejado).diff(hoje).as('days');
        // se ta positivo, ta no futuro, não ta atrasado ainda
        return d >= 0 ? null : Math.floor(Math.abs(d));
    }

    async findOne(projeto: ProjetoDetailDto, id: number, user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const row = await this.prisma.tarefa.findFirstOrThrow({
            where: {
                projeto_id: projeto.id,
                id: id,
                removido_em: null,
            },
            orderBy: [
                { tarefa_pai_id: 'asc' }
            ],
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
                    }
                }
            }
        });

        const hoje = DateTime.local({ zone: SYSTEM_TIMEZONE }).startOf('day');
        return {
            ...row,
            atraso: this.calculaAtraso(hoje, row.termino_planejado, row.termino_real),
            projeto: projeto,
        };
    }

    async update(projetoId: number, id: number, dto: UpdateTarefaDto | UpdateTarefaRealizadoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const tarefa = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const now = new Date(Date.now());

            await this.utils.lockProjeto(prismaTx, projetoId);
            const tarefa = await prismaTx.tarefa.findFirst({
                where: {
                    removido_em: null,
                    projeto_id: projetoId,
                    id: id
                },
                select: {
                    id: true, tarefa_pai_id: true, nivel: true, numero: true,
                    n_filhos_imediatos: true,
                    inicio_planejado: true,
                    termino_planejado: true,
                    duracao_planejado: true
                }
            });
            if (!tarefa) throw new HttpException("Tarefa não encontrada.", 404);

            if ("dependencias" in dto && dto.dependencias !== undefined && tarefa.n_filhos_imediatos == 0) {
                const calcDependencias = await this.calcDataDependencias(projetoId, prismaTx, {
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
                    (dto as any).ordem_topologica_termino_planejado = calcDependencias.ordem_topologica_termino_planejado;

                    // usa a função do banco, que sabe fazer conta muito melhor que duplicar o código aqui no JS
                    const patched = await this.calcInfereDataPeloPeriodo(prismaTx, {
                        inicio_planejado: dto.inicio_planejado === undefined ? tarefa.inicio_planejado : dto.inicio_planejado,
                        termino_planejado: dto.termino_planejado === undefined ? tarefa.termino_planejado : dto.termino_planejado,
                        duracao_planejado: dto.duracao_planejado === undefined ? tarefa.duracao_planejado : dto.duracao_planejado,
                    }, dataDependencias);
                    dto.inicio_planejado = patched.inicio_planejado;
                    dto.termino_planejado = patched.termino_planejado;
                    dto.duracao_planejado = patched.duracao_planejado;
                }

                await prismaTx.tarefaDependente.deleteMany({ where: { tarefa_id: tarefa.id } });

                if (dto.dependencias && dto.dependencias.length) {
                    await prismaTx.tarefaDependente.createMany({
                        data: dto.dependencias.map(d => {
                            return {
                                tarefa_id: tarefa.id,
                                dependencia_tarefa_id: d.dependencia_tarefa_id,
                                latencia: d.latencia,
                                tipo: d.tipo,
                            }
                        })
                    });
                }

            }

            if (tarefa.n_filhos_imediatos !== 0) {
                if (dto.percentual_concluido !== undefined)
                    throw new HttpException("Percentual Concluído não pode ser alterado diretamente nesta tarefa.", 400);
                if (dto.inicio_real !== undefined)
                    throw new HttpException("Início Real não pode ser alterado diretamente nesta tarefa.", 400);
                if (dto.termino_real !== undefined)
                    throw new HttpException("Término Real não pode ser alterado diretamente nesta tarefa.", 400);
                if (dto.duracao_real !== undefined)
                    throw new HttpException("Duração Real não pode ser alterada diretamente nesta tarefa.", 400);

                if ("dependencias" in dto) {
                    if (dto.inicio_planejado !== undefined)
                        throw new HttpException("Início Planejado não pode ser alterado diretamente nesta tarefa.", 400);
                    if (dto.termino_planejado !== undefined)
                        throw new HttpException("Término Planejado não pode ser alterado diretamente nesta tarefa.", 400);
                    if (dto.duracao_planejado !== undefined)
                        throw new HttpException("Duração Planejada não pode ser alterada diretamente nesta tarefa.", 400);
                    if (dto.custo_estimado !== undefined)
                        throw new HttpException("Custo Estimado não pode ser alterado diretamente nesta tarefa.", 400);
                    if (dto.custo_real !== undefined)
                        throw new HttpException("Custo Real não pode ser alterado diretamente nesta tarefa.", 400);
                    if (dto.dependencias !== undefined && Array.isArray(dto.dependencias) && dto.dependencias.length > 0)
                        throw new HttpException("Não podem existir dependencias nesta tarefa, pois há filhos.", 400);
                }
            }

            if (
                "dependencias" in dto &&
                (
                    (dto.tarefa_pai_id !== undefined && dto.tarefa_pai_id !== tarefa.tarefa_pai_id)
                    ||
                    (dto.numero !== undefined && dto.numero !== tarefa.numero)
                )
            ) {
                if (dto.tarefa_pai_id === undefined) dto.tarefa_pai_id = tarefa.tarefa_pai_id;
                if (dto.nivel === undefined) dto.nivel = tarefa.nivel;
                if (dto.numero === undefined) dto.numero = tarefa.numero;

                if (dto.tarefa_pai_id !== tarefa.tarefa_pai_id) {
                    this.logger.debug(`Mudança da tarefa pai detectada: ${JSON.stringify({ novoPaiDesejado: dto.tarefa_pai_id, antigoPai: tarefa.tarefa_pai_id })}`);

                    if (dto.tarefa_pai_id === null
                        && dto.nivel > 1
                    ) throw new HttpException('Tarefas com nível maior que 1 necessitam de uma tarefa pai', 400);

                    const novoPai = dto.tarefa_pai_id ? await this.prisma.tarefa.findFirst({
                        where: {
                            removido_em: null, id: dto.tarefa_pai_id,
                            projeto_id: projetoId
                        }, select: { nivel: true, id: true }
                    }) : null;

                    if (dto.tarefa_pai_id && novoPai == null)
                        throw new HttpException(`Tarefa pai (${dto.tarefa_pai_id}) não foi encontrada no projeto.`, 400);

                    if (novoPai && novoPai.nivel != dto.nivel - 1)
                        throw new HttpException(`Nível (${dto.nivel}) inválido para ser filho imediato da tarefa pai enviada (nível ${novoPai.nivel}).`, 400);

                    if (novoPai) {
                        await this.verifica_nivel_maximo_e_filhos(tarefa, prismaTx, projetoId, novoPai);
                    }
                    // abaixa o numero de onde era
                    await this.utils.decrementaNumero({
                        numero: tarefa.numero,
                        tarefa_pai_id: tarefa.tarefa_pai_id
                    }, prismaTx, projetoId);

                    // aumenta o numero de onde vai entrar
                    dto.numero = await this.utils.incrementaNumero({
                        numero: dto.numero,
                        tarefa_pai_id: dto.tarefa_pai_id
                    }, prismaTx, projetoId);
                } else {
                    // mudou apenas o numero
                    this.logger.debug('Apenas mudança de número foi detectada');

                    // abaixa o numero de onde era
                    await this.utils.decrementaNumero({
                        numero: tarefa.numero,
                        tarefa_pai_id: tarefa.tarefa_pai_id
                    }, prismaTx, projetoId);

                    // aumenta o numero de onde vai entrar
                    dto.numero = await this.utils.incrementaNumero({
                        numero: dto.numero,
                        tarefa_pai_id: tarefa.tarefa_pai_id
                    }, prismaTx, projetoId);

                }

            } else if ("dependencias" in dto) {
                // nao deixar nem o nivel sem passar o pai
                // pq as validações estão apenas acima
                this.logger.warn('removendo campos numero, nivel e tarefa_pai_id da atualização');

                delete dto.numero;
                delete dto.nivel;
                delete dto.tarefa_pai_id;
            }

            await prismaTx.tarefa.update({
                where: {
                    id: tarefa.id
                },
                data: {
                    ...dto,
                    dependencias: undefined,
                    atualizado_em: now,
                }
            });

            return { id: tarefa.id }
        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 50000,
        });

        return { id: tarefa.id }
    }

    private async verifica_nivel_maximo_e_filhos(tarefa: { id: number; nivel: number; tarefa_pai_id: number | null; numero: number; n_filhos_imediatos: number; }, prismaTx: Prisma.TransactionClient, projetoId: number, novoPai: { nivel: number; id: number }) {

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

        if (buscaFilhos[0].filhas.includes(novoPai.id))
            throw new HttpException(`A nova tarefa-mãe não pode ser uma subordinada da tarefa atual (e nem a própria tarefa)`, 400);

        const portConfig = await prismaTx.projeto.findFirstOrThrow({
            where: { id: projetoId },
            select: { portfolio: { select: { nivel_maximo_tarefa: true } } }
        });

        if (novoPai.nivel + numero_de_niveis > portConfig.portfolio.nivel_maximo_tarefa)
            throw new HttpException(`A nova tarefa-mãe não pode ser usada no momento, pois o número de subníveis da tarefa (tarefa-mãe tem nível ${novoPai.nivel} + ${numero_de_niveis}) ultrapassa o configurado no portfólio (${portConfig.portfolio.nivel_maximo_tarefa}).`, 400);
    }

    async remove(projetoId: number, id: number, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const now = new Date(Date.now());

            await this.utils.lockProjeto(prismaTx, projetoId);
            const tarefa = await prismaTx.tarefa.findFirst({
                where: {
                    removido_em: null,
                    projeto_id: projetoId,
                    id: id
                },
                select: { id: true, tarefa_pai_id: true, nivel: true, numero: true, n_filhos_imediatos: true }
            });
            if (!tarefa) throw new HttpException("Tarefa não encontrada.", 404);
            if (tarefa.n_filhos_imediatos > 0) throw new HttpException("Apague primeiro as tarefas filhas.", 400);

            const tenhoDependencia = await prismaTx.tarefaDependente.findFirst({
                where: {
                    dependencia_tarefa_id: id,
                },
                select: {
                    tarefa: { select: { nivel: true, numero: true, tarefa: true } }
                }
            });
            if (tenhoDependencia)
                throw new HttpException(`Tarefa não pode ser removida, remova primeiro a dependência na tarefa "${tenhoDependencia.tarefa.tarefa}", no nível ${tenhoDependencia.tarefa.nivel} número ${tenhoDependencia.tarefa.numero}.`, 400);

            const dto = {
                numero: tarefa.numero,
                tarefa_pai_id: tarefa.tarefa_pai_id
            };

            await this.utils.decrementaNumero(dto, prismaTx, projetoId);

            await prismaTx.tarefa.update({
                where: {
                    id: tarefa.id
                },
                data: {
                    removido_em: now,
                    removido_por: user.id
                }
            });

            await prismaTx.tarefaDependente.deleteMany({
                where: {
                    tarefa_id: tarefa.id
                }
            });

            return { id: tarefa.id }
        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 50000,
        });
    }


    private async calcDataDependencias(
        projetoId: number,
        prismaTx: Prisma.TransactionClient,
        dto: CheckDependenciasDto
    ): Promise<ValidacaoDatas> {
        const deps = dto.dependencias;
        if (!deps) return {
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

            if (buscaParents[0].parents.includes(dep.dependencia_tarefa_id))
                throw new HttpException('Você não pode ter como dependência uma tarefa superior a sua tarefa', 400);
        }

        // carrega todas as dependencias, exceto as da tarefa correte (ou nova tarefa, no caso do zero)
        const tarefaDepsProj = await prismaTx.tarefaDependente.findMany({
            where: {
                tarefa: { projeto_id: projetoId, removido_em: null },
                tarefa_id: { not: tarefa_corrente_id }
            }
        });

        const grafoInicio: Graph = new graphlib.Graph({ directed: true });
        const grafoTermino: Graph = new graphlib.Graph({ directed: true });

        const ordemInicio = await this.valida_grafo_dependencias(grafoInicio, tarefaDepsProj, [
            'termina_pro_inicio',
            'inicia_pro_inicio',
        ], deps, tarefa_corrente_id);

        const ordemTermino = await this.valida_grafo_dependencias(grafoTermino, tarefaDepsProj, [
            'inicia_pro_termino',
            'termina_pro_termino',
        ], deps, tarefa_corrente_id);

        const json = JSON.stringify(deps);
        const res = await prismaTx.$queryRaw`select calcula_dependencias_tarefas(${json}::jsonb)` as any;

        const resp = plainToInstance(DependenciasDatasDto, res[0]['calcula_dependencias_tarefas']);

        // <= 0 pois 0 dias já é negativo nessa situação do smae
        // onde 1 dia de duração o inicio e termino são os mesmos
        // Fica de melhoria pra melhorar essa mensagem, da pra tentar ir refazendo
        // as regras até descobrir qual foi a dependência que causou a data ficar negativa
        // embora seja difícil descobrir exatamente, pois pode ser que uma puxa pro fim, enquanto outra puxa o inicio...
        if (resp.duracao_planejado != null && resp.duracao_planejado <= 0) {
            throw new HttpException(
                {
                    message: "Não é possível utilizar a configuração atual de dependencias, pois o intervalo ficou negativo.",
                    statusCode: 400,
                    extra: resp
                },
                400
            );
        }

        return {
            dependencias_datas: resp,
            ordem_topologica_inicio_planejado: ordemInicio,
            ordem_topologica_termino_planejado: ordemTermino,
        }
    }

    async calcula_dependencias_tarefas(projetoId: number, dto: CheckDependenciasDto, user: PessoaFromJwt): Promise<DependenciasDatasDto | null> {
        const resp = await this.calcDataDependencias(projetoId, this.prisma, dto);
        if (!resp) return null;

        return resp.dependencias_datas;
    }

    private async valida_grafo_dependencias(
        grafo: Graph,
        todasTarefaDepsProj: TarefaDependente[],
        tipos: TarefaDependenteTipo[],
        todasDeps: TarefaDependenciaDto[] | undefined | null,
        tarefa_corrente_id: number
    ): Promise<number[]> {
        if (!todasDeps || !Array.isArray(todasDeps)) return [];

        // se ta vazio, já ta ordenado!
        const dependencias = todasDeps.filter(r => tipos.includes(r.tipo));
        if (dependencias.length === 0) return [];

        // aqui eu já estou com um pouco mais de duvida se tem como criar um loop
        // diretamente só com as deps de um unico POST
        // acredito que não é possivel
        // então se não há nenhuma dependencia do tipo, já retorna
        const repositorioDependencias = todasTarefaDepsProj.filter(r => tipos.includes(r.tipo));
        if (repositorioDependencias.length === 0) return [];

        this.logger.debug(`Iniciando validação do grafo...`);

        const self = this;
        function novaDependencias(tarefaId: string, depsId: string[], recursionLevel: number): void {
            const prefix = '='.repeat(recursionLevel + 1);

            self.logger.debug(`${prefix}> Adicionando ${depsId.length} dependência(s) da tarefa ${tarefaId}`);
            for (const depId of depsId) {
                self.logger.debug(`${prefix}: setEdge (${tarefaId}, ${depId})`);

                grafo = grafo.setEdge(tarefaId, depId);

                const isAcyclic = graphlib.alg.isAcyclic(grafo);
                if (isAcyclic === false) {
                    self.logger.debug(`${prefix}! Loop detectado. Procurando por algum ciclo para ajudar o usuário.`);
                    throw new LoopError();
                }

                const depDeps = repositorioDependencias.filter(r => r.tarefa_id === +depId);
                //console.log({ depDeps, cond: `r.tarefa_id === depId (${depId})` });
                if (depDeps.length > 0) {
                    novaDependencias(depId, depDeps.map(dep => dep.dependencia_tarefa_id.toString()), recursionLevel + 1);
                } else {
                    self.logger.debug(`${prefix}: Não há dependência na tarefa ${depId}`);
                }
            }
        }

        try {
            for (const dependencia of dependencias) {

                this.logger.debug(`=: setEdge ( ${tarefa_corrente_id.toString()}, ${dependencia.dependencia_tarefa_id.toString()})`);
                grafo = grafo.setEdge(tarefa_corrente_id.toString(), dependencia.dependencia_tarefa_id.toString());

                this.logger.debug(`=> Verificando ${dependencia.dependencia_tarefa_id} (${dependencia.tipo} com ${dependencia.latencia} dias)`);

                const depDeps = repositorioDependencias.filter(r => r.tarefa_id === dependencia.dependencia_tarefa_id);
                //console.log({ depDeps, cond: `r.tarefa_id === dependencia.dependencia_tarefa_id (${dependencia.dependencia_tarefa_id})` });

                if (depDeps.length > 0) {
                    novaDependencias(
                        dependencia.dependencia_tarefa_id.toString(),
                        depDeps.map(dep => dep.dependencia_tarefa_id.toString()),
                        1
                    );
                } else {
                    this.logger.debug(`=: Não há nenhuma dependência na tarefa ${dependencia.dependencia_tarefa_id}`);
                }
            }
        } catch (error) {
            if (error instanceof LoopError) {

                // há alguns bugs, que acredito que não ocorrem no nosso caso simples
                // mas essa função, o mais correto seria ser chamada de findSomeCycles,
                // pois ela pode não encontrar todos os ciclos que podem existir.
                const cilosDetectados = graphlib.alg.findCycles(grafo) as string[][];
                console.log(cilosDetectados);
                let textoFormatado = '';

                if (cilosDetectados.length > 0) {

                    const tarefasDb = await this.prisma.tarefa.findMany({
                        where: {
                            id: {
                                in: cilosDetectados[0].map(n => parseInt(n, 10))
                            }
                        },
                        select: {
                            nivel: true,
                            numero: true,
                            tarefa: true,
                            id: true,
                        }
                    });

                    for (const tarefaId of cilosDetectados[0]) {
                        const tarefa = tarefasDb.filter(t => t.id == +tarefaId)[0];
                        // se não encontrou no banco, 99% de chance que é o id 0 e não um delete sem where sem rollback
                        if (!tarefa) {
                            textoFormatado += `Nova tarefa corrente => `;
                        } else {
                            textoFormatado += `Tarefa "${tarefa.tarefa}" número (${tarefa.numero}) => `;
                        }
                    }

                    textoFormatado = textoFormatado.slice(0, -4) + '.\n\nDependência circulares não são suportadas.';
                } else {
                    textoFormatado = 'Não foi possível encontrar um exemplo do ciclo com a biblioteca utilizada no momento.'
                }

                throw new HttpException(
                    `Há uma ou mais referências circulares nas dependências do tipo ${tipos.join(' ou ')}.\nCiclos detectados: ${textoFormatado}`,
                    400
                );

            } else {
                throw error;
            }
        }

        // de qualquer forma, se um dia existir um bug no isAcyclic (da mesma forma que existe no findCycles)
        // o toposort nunca iria deixar passar, pois é realmente impossivel fazer o toposort com um loop
        // ai vai dar erro 500 na hora de validar/salvar
        return (graphlib.alg.topsort(grafo) as string[]).map(n => +n);
    }


}
