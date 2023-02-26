import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckDependenciasDto, CreateTarefaDto, TarefaDependenciaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { DependenciasDatasDto, TarefaDetailDto, TarefaItemDto } from './entities/tarefa.entity';
import { TarefaUtilsService } from './tarefa.service.utils';

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

                if (duracao_planejado_calculado && dto.duracao_planejado !== null) {
                    throw new HttpException("Duração não pode ser enviada, pois será calculada automaticamente pelas dependências.", 400);
                } else if (duracao_planejado_calculado) {
                    dto.duracao_planejado = dataDependencias.duracao_planejado;
                }

                if (inicio_planejado_calculado && dto.inicio_planejado !== null) {
                    throw new HttpException("Início planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                } else if (inicio_planejado_calculado) {
                    dto.inicio_planejado = dataDependencias.inicio_planejado;
                }

                if (termino_planejado_calculado && dto.termino_planejado !== null) {
                    throw new HttpException("Término planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                } else if (termino_planejado_calculado) {
                    dto.termino_planejado = dataDependencias.termino_planejado;
                }
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

                    duracao_planejado_calculado: duracao_planejado_calculado,
                    inicio_planejado_calculado: inicio_planejado_calculado,
                    termino_planejado_calculado: termino_planejado_calculado,
                    duracao_real_calculado: false,
                    inicio_real_calculado: false,
                    termino_real_calculado: false,
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

    async calcDataDependencias(prismaTx: Prisma.TransactionClient, deps: TarefaDependenciaDto[] | null | undefined): Promise<DependenciasDatasDto | null> {
        if (!deps) return null;

        const json = JSON.stringify(deps);
        const res = await prismaTx.$queryRaw`select calcula_dependencias_tarefas(${json}::jsonb)` as any;

        const resp = (res[0]['calcula_dependencias_tarefas']) as DependenciasDatasDto;

        if (resp.duracao_planejado != null && resp.duracao_planejado < 0) {
            throw new HttpException("Não é possivel utilizar a configuração atual de dependencias, pois o intervalo calculado ficou negativo.", 400);
        }

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

    async findOne(projetoId: number, id: number, user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const row = await this.prisma.tarefa.findFirstOrThrow({
            where: {
                projeto_id: projetoId,
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
                inicio_real_calculado: true,
                termino_real_calculado: true,
                duracao_real_calculado: true,
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
                    // mas ai no create ficaria diferente, ou tbm teria que deixar opicional e criar mais checks
                    if (duracao_planejado_calculado && dto.duracao_planejado !== null) {
                        throw new HttpException("Duração não pode ser enviada, pois será calculada automaticamente pelas dependências.", 400);
                    } else if (duracao_planejado_calculado) {
                        dto.duracao_planejado = dataDependencias.duracao_planejado;
                    }

                    if (inicio_planejado_calculado && dto.inicio_planejado !== null) {
                        throw new HttpException("Início planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                    } else if (inicio_planejado_calculado) {
                        dto.inicio_planejado = dataDependencias.inicio_planejado;
                    }

                    if (termino_planejado_calculado && dto.termino_planejado !== null) {
                        throw new HttpException("Término planejado não pode ser enviado, pois será calculado automaticamente pelas dependências.", 400);
                    } else if (termino_planejado_calculado) {
                        dto.termino_planejado = dataDependencias.termino_planejado;
                    }
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
                    throw new HttpException("Não pode existir dependencias nesta tarefa.", 400);
            }

            if (
                (dto.tarefa_pai_id !== undefined && dto.tarefa_pai_id !== tarefa.tarefa_pai_id)
                ||
                (dto.numero !== undefined && dto.numero !== tarefa.numero)
            ) {
                // TODO: ao mudar de nível, buscar o nível mais altos dos filhos, o novo nível n pode passar do configurado no port

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
                        }, select: { nivel: true }
                    }) : null;

                    if (dto.tarefa_pai_id && novoPai == null)
                        throw new HttpException(`Tarefa pai (${dto.tarefa_pai_id}) não foi encontrada no projeto.`, 400);

                    if (novoPai && novoPai.nivel != dto.nivel - 1)
                        throw new HttpException(`Nível (${dto.nivel}) inválido para ser filho imediato da tarefa pai enviada (nível ${novoPai.nivel}).`, 400);

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

        if (resp.duracao_planejado != null && resp.duracao_planejado < 0) {
            // fica de TODO melhorar essa msg de erro, pra tentar ir refazendo as regras até descobrir qual foi a depedencia que fez isso
            // embora seja dificil descobrir, pois pode ser que uma estica o fim, enquanto outra puxa o inicio...
            throw new HttpException("Não é possivel utilizar a configuração atual de dependencias, pois o intervalo calculado ficou negativo.", 400);
        }

        return resp;
    }


}
