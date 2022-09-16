import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FilterVariavelDto } from 'src/variavel/dto/filter-variavel.dto';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';

@Injectable()
export class VariavelService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async buildVarResponsaveis(variableId: number, responsaveis: number[]): Promise<Prisma.VariavelResponsavelCreateManyInput[]> {
        const arr: Prisma.VariavelResponsavelCreateManyInput[] = [];
        for (const pessoaId of responsaveis) {
            arr.push({
                variavel_id: variableId,
                pessoa_id: pessoaId
            });
        }
        return arr;
    }

    async create(createVariavelDto: CreateVariavelDto, user: PessoaFromJwt) {
        // TODO: verificar se o indicador existe e esta ativo
        // TODO: verificar se todos os membros de createVariavelDto.responsaveis estão ativos e sao realmente do orgão createVariavelDto.orgao_id
        // TODO: verificar se o createVariavelDto.periodicidade é a mesma do indicador (por enquanto)
        // TODO: verificar se veio região:
        // se a região existe e está ativa, se é do mesmo nível que foi escolhido no indicador
        // se não vier, conferir se o indicador realmente não é por região

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient): Promise<RecordWithId> => {
            let responsaveis = createVariavelDto.responsaveis!;
            delete createVariavelDto.responsaveis;

            let indicador_id = createVariavelDto.indicador_id!;
            delete createVariavelDto.indicador_id;

            const variavel = await prisma.variavel.create({
                data: {
                    ...createVariavelDto,
                    indicador_variavel: {
                        create: {
                            indicador_id: indicador_id,
                        }
                    }
                },
                select: { id: true }
            });

            await prisma.variavelResponsavel.createMany({
                data: await this.buildVarResponsaveis(variavel.id, responsaveis),
            });

            return variavel;
        });

        return { id: created.id };
    }

    async findAll(filters: FilterVariavelDto | undefined = undefined) {
        let filterQuery: any = {};

        let removidoStatus = filters?.remover_desativados == true ? false : undefined;

        if (filters?.indicador_id && filters?.meta_id) {
            throw new HttpException('Apenas filtrar por meta_id ou indicador_id por vez', 400);
        }

        if (filters?.indicador_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        desativado: removidoStatus,
                        indicador_id: filters?.indicador_id
                    }
                }
            };
        } else if (filters?.meta_id) {
            filterQuery = {
                indicador_variavel: {
                    some: {
                        indicador: {
                            desativado: removidoStatus,
                            meta_id: filters?.meta_id
                        }
                    }
                }
            }
        }

        let listActive = await this.prisma.variavel.findMany({
            where: {
                ...filterQuery,
            },
            select: {
                id: true,
                titulo: true,
                acumulativa: true,
                unidade_medida: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    }
                },
                valor_base: true,
                periodicidade: true,
                peso: true,
                orgao: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    }
                },
                regiao: {
                    select: {
                        id: true,
                        nivel: true,
                        descricao: true,
                        parente_id: true,
                        codigo: true,
                    }
                },
                indicador_variavel: {
                    select: {
                        desativado: true,
                        indicador: {
                            select: {
                                id: true,
                                titulo: true,
                                meta_id: true,
                            },
                        }
                    }
                },
            }
        });


        return listActive;
    }
}
