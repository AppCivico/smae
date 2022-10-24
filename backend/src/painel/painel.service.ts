import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePainelConteudoDto, CreateParamsPainelConteudoDto } from './dto/create-painel-conteudo.dto';
import { CreatePainelDto } from './dto/create-painel.dto';
import { FilterPainelDto } from './dto/filter-painel.dto';
import { UpdatePainelDto } from './dto/update-painel.dto';
import { PainelConteudo } from './entities/painel-conteudo-entity';

@Injectable()
export class PainelService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createPainelDto: CreatePainelDto, user: PessoaFromJwt) {

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const painel = await prisma.painel.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    ...createPainelDto,
                },
                select: { id: true }
            });


            return painel;
        });

        return created;
    }

    async findAll(filters: FilterPainelDto | undefined = undefined) {
        let ativo = filters?.ativo;
        if (typeof ativo === undefined) {
            ativo = true;
        }

        return await this.prisma.painel.findMany({
            where: {
                ativo: ativo
            },
            select: {
                id: true,
                nome: true,
                ativo: true,
                periodicidade: true,
                mostrar_planejado_por_padrao: true,
                mostrar_acumulado_por_padrao: true,
                mostrar_indicador_por_padrao: true,

                // TODO: adicionar order by pela coluna 'ordem'
                painel_conteudo: {
                    select: {
                        id: true,
                        meta_id: true,
                        indicador_id: true,
                        mostrar_planejado: true,
                        mostrar_acumulado: true,
                        mostrar_indicador: true,
                        periodicidade: true,
                        periodo: true,
                        periodo_fim: true,
                        periodo_inicio: true,
                        periodo_valor: true,

                        detalhes: {
                            where: {
                                pai_id: null
                            },
                            orderBy: [
                                {ordem: 'asc'}
                            ],
                            select: {
                                tipo: true,
                                mostrar_indicador: true,
                                variavel: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                iniciativa: {
                                    select: {
                                        id: true,
                                        titulo: true,
                                    }
                                },
                                filhos: {
                                    select: {
                                        tipo: true,
                                        mostrar_indicador: true,

                                        variavel: {
                                            select: {
                                                id: true,
                                                titulo: true,
                                            }
                                        },
                                        atividade: {
                                            select: {
                                                id: true,
                                                titulo: true
                                            }
                                        },
                                        filhos: {
                                            select: {
                                                tipo: true,
                                                mostrar_indicador: true,

                                                variavel: {
                                                    select: {
                                                        id: true,
                                                        titulo: true
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    async update(id: number, UpdatePainelDto: UpdatePainelDto, user: PessoaFromJwt) {

        await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {

            const painel = await prisma.painel.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                    ...UpdatePainelDto,
                },
                select: { id: true }
            });

            return painel;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const removed = await this.prisma.painel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });

        return removed;
    }

    
    async createConteudo(painel_id: number, createConteudoDto: CreateParamsPainelConteudoDto, user: PessoaFromJwt) {
        const ret = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId[]>=> {
            const painel = await this.prisma.painel.findFirstOrThrow({
                where: {id: painel_id},
                select: {
                    mostrar_acumulado_por_padrao: true,
                    mostrar_indicador_por_padrao: true,
                    mostrar_planejado_por_padrao: true,

                    periodicidade: true
                }
            });

            const conteudos = [];

            for (const meta of createConteudoDto.metas) {
                conteudos.push(
                    prisma.painelConteudo.create({
                        data: {
                            painel_id: painel_id,
                            meta_id: meta,
                            mostrar_acumulado: painel.mostrar_acumulado_por_padrao,
                            mostrar_indicador: painel.mostrar_indicador_por_padrao,
                            mostrar_planejado: painel.mostrar_planejado_por_padrao,
                            periodicidade: painel.periodicidade
                        },
                        select: {id: true}
                    })
                )
            }

            return await Promise.all(conteudos)
        });
        
        return ret
    }

}
