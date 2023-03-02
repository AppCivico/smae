import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjetoDetailDto } from '../projeto/entities/projeto.entity';
import { CheckDependenciasDto, CreateTarefaDto, TarefaDependenciaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { DependenciasDatasDto, TarefaDetailDto, TarefaItemDto } from './entities/tarefa.entity';
import { TarefaUtilsService } from './tarefa.service.utils';


export class InferenciaDatasDto {
    inicio_planejado: Date | null
    termino_planejado: Date | null
    duracao_planejado: number | null
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

            const dataDependencias = await this.calcDataDependencias(prismaTx, dto.dependencias);

            let duracao_planejado_calculado = false;
            let inicio_planejado_calculado = false;
            let termino_planejado_calculado = false;

            if (dataDependencias != null) {
                duracao_planejado_calculado = dataDependencias.duracao_planejado_calculado;
                inicio_planejado_calculado = dataDependencias.inicio_planejado_calculado;
                termino_planejado_calculado = dataDependencias.termino_planejado_calculado;

                if (duracao_planejado_calculado && dto.duracao_planejado) {
                    throw new HttpException("Duração não é aceita, pois será calculada automaticamente pelas dependências.", 400);
                } else if (duracao_planejado_calculado) {
                    dto.duracao_planejado = dataDependencias.duracao_planejado;
                }

                if (inicio_planejado_calculado && dto.inicio_planejado) {
                    throw new HttpException("Início planejado não é aceita, pois será calculado automaticamente pelas dependências.", 400);
                } else if (inicio_planejado_calculado) {
                    dto.inicio_planejado = dataDependencias.inicio_planejado;
                }

                if (termino_planejado_calculado && dto.termino_planejado) {
                    throw new HttpException("Término planejado não é aceita, pois será calculado automaticamente pelas dependências.", 400);
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

        const resp = (res[0]['infere_data_inicio_ou_termino']) as InferenciaDatasDto;
        return resp;
    }

    async calcDataDependencias(prismaTx: Prisma.TransactionClient, deps: TarefaDependenciaDto[] | null | undefined): Promise<DependenciasDatasDto | null> {
        if (!deps) return null;

        const json = JSON.stringify(deps);
        const res = await prismaTx.$queryRaw`select calcula_dependencias_tarefas(${json}::jsonb)` as any;

        const resp = plainToInstance(DependenciasDatasDto, res[0]['calcula_dependencias_tarefas']);

        if (resp.duracao_planejado != null && resp.duracao_planejado < 0) {
            throw new HttpException("Não é possivel utilizar a configuração atual de dependencias, pois o intervalo calculado ficou negativo.", 400);
        }

        resp.duracao_planejado

        return resp
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

        return rows.map((r) => {
            return {
                ...r,
                atraso: null,
            }
        });
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

        return {
            ...row,
            atraso: null,
            projeto: projeto,
        };
    }

    async update(projetoId: number, id: number, dto: UpdateTarefaDto, user: PessoaFromJwt): Promise<RecordWithId> {

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

            if (dto.dependencias !== undefined) {
                const dataDependencias = await this.calcDataDependencias(prismaTx, dto.dependencias);

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
                if (dto.dependencias !== undefined)
                    throw new HttpException("Não pode existir dependencias nesta tarefa, pois há filhos.", 400);
            }

            if (
                (dto.tarefa_pai_id !== undefined && dto.tarefa_pai_id !== tarefa.tarefa_pai_id)
                ||
                (dto.numero !== undefined && dto.numero !== tarefa.numero)
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

            } else {
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

    async calcula_dependencias_tarefas(projetoId: number, dto: CheckDependenciasDto, user: PessoaFromJwt): Promise<DependenciasDatasDto> {
        const json = JSON.stringify(dto.dependencias);
        const res = await this.prisma.$queryRaw`select calcula_dependencias_tarefas(${json}::jsonb)` as any;

        const resp = (res[0]['calcula_dependencias_tarefas']) as DependenciasDatasDto;

        if (resp.duracao_planejado != null && resp.duracao_planejado <= 0) {
            // fica de TODO melhorar essa msg de erro, pra tentar ir refazendo as regras até descobrir qual foi a dependência que fez isso
            // embora seja difícil descobrir, pois pode ser que uma estica o fim, enquanto outra puxa o inicio...
            throw new HttpException(
                {
                    message: "Não é possível utilizar a configuração atual de dependencias, pois o intervalo ficou negativo.",
                    statusCode: 400,
                    extra: resp
                }, 400);
        }

        return resp;
    }


}
