import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';
import { TarefaDetailDto, TarefaItemDto } from './entities/tarefa.entity';
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

                    duracao_planejado_calculado: false,
                    duracao_real_calculado: false,
                    inicio_real_calculado: false,
                    termino_real_calculado: false,
                    inicio_planejado_calculado: false,
                    termino_planejado_calculado: false,
                }
            });


            return { id: tarefa.id }
        }, {
            isolationLevel: 'Serializable',
            maxWait: 15000,
            timeout: 50000,
        });

        return { id: created.id }
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
            }
        });

        return rows;
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
            }
        });

        return row;
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
                    id: true, tarefa_pai_id: true, nivel: true, numero: true
                }
            });
            if (!tarefa) throw new HttpException("Tarefa não encontrada.", 404);


            console.log({ dto });

            if (
                (dto.tarefa_pai_id !== undefined && dto.tarefa_pai_id !== tarefa.tarefa_pai_id)
                ||
                (dto.numero !== undefined && dto.numero !== tarefa.numero)
            ) {
                // TODO: ao mudar de nível, buscar o nível mais altos dos filhos, o novo nível n pode passar do configurado no port

                if (dto.tarefa_pai_id === undefined) dto.tarefa_pai_id = tarefa.tarefa_pai_id;
                if (dto.nivel === undefined) dto.nivel = tarefa.nivel;
                if (dto.numero === undefined) dto.numero = tarefa.numero;

                // se mudou de pai
                console.log({ novoPaiDesejado: dto.tarefa_pai_id, antigoPai: tarefa.tarefa_pai_id });
                if (dto.tarefa_pai_id !== tarefa.tarefa_pai_id) {
                    console.log('entrou pra mudar o pai');



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
                select: { id: true, tarefa_pai_id: true, nivel: true, numero: true }
            });
            if (!tarefa) throw new HttpException("Tarefa não encontrada.", 404);


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



}
