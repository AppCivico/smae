import { Injectable, Logger } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoPaineisDto } from './dto/create-grupo-paineis.dto';
import { DetailGrupoPaineisDto } from './dto/detail-grupo-paineis.dto';
import { FilterGrupoPaineisDto } from './dto/filter-grupo-paineis.dto';
import { UpdateGrupoPaineisDto } from './dto/update-grupo-paineis.dto';
import { GrupoPaineis } from './entities/grupo-paineis.entity';

@Injectable()
export class GrupoPaineisService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createGrupoPaineisDto: CreateGrupoPaineisDto, user: PessoaFromJwt) {
        const created = await this.prisma.grupoPainel.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createGrupoPaineisDto,
            },
            select: { id: true, nome: true },
        });

        return created;
    }

    async findAll(filters: FilterGrupoPaineisDto | undefined = undefined) {
        const ativo = filters?.ativo;

        let searchCond;
        if (typeof ativo === undefined) {
            searchCond = { removido_em: null };
        } else {
            searchCond = {
                removido_em: null,
                ativo: ativo,
            };
        }

        const listActive = await this.prisma.grupoPainel.findMany({
            where: { ...searchCond },
            select: {
                id: true,
                nome: true,
                ativo: true,
                pessoas: {
                    select: {
                        pessoa: {
                            select: {
                                id: true,
                                nome_exibicao: true,
                            },
                        },
                    },
                },

                paineis: {
                    select: {
                        painel: {
                            select: {
                                id: true,
                                nome: true,
                                ativo: true,
                            },
                        },
                    },
                },
            },
        });

        const ret: GrupoPaineis[] = listActive.map(g => {
            return {
                id: g.id,
                nome: g.nome,
                ativo: g.ativo,

                pessoa_count: g?.pessoas ? g!.pessoas.length : 0,
                painel_count: g?.paineis ? g!.paineis.length : 0,

                pessoas: g.pessoas.map(p => {
                    return {
                        id: p.pessoa.id,
                        nome_exibicao: p.pessoa.nome_exibicao,
                    };
                }),

                paineis: g.paineis.map(p => {
                    return {
                        id: p.painel.id,
                        nome: p.painel.nome,
                        ativo: p.painel.ativo,
                    };
                }),
            };
        });

        return ret;
    }

    async update(id: number, updateGrupoPaineisDto: UpdateGrupoPaineisDto, user: PessoaFromJwt) {
        await this.prisma.grupoPainel.update({
            where: { id: id },
            data: {
                ...updateGrupoPaineisDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.grupoPainel.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }

    async getDetail(id: number) {
        let ret = <DetailGrupoPaineisDto>{};

        const grupo = await this.prisma.grupoPainel.findFirstOrThrow({
            where: { id: id },
            select: {
                id: true,
                nome: true,
                ativo: true,

                pessoas: {
                    select: {
                        pessoa: {
                            select: {
                                id: true,
                                nome_exibicao: true,
                            },
                        },
                    },
                },

                paineis: {
                    select: {
                        painel: {
                            select: {
                                id: true,
                                nome: true,
                                ativo: true,
                            },
                        },
                    },
                },
            },
        });

        ret = {
            id: grupo.id,
            nome: grupo.nome,
            ativo: grupo.ativo,

            pessoa_count: grupo?.pessoas ? grupo!.pessoas.length : 0,
            painel_count: grupo?.paineis ? grupo!.paineis.length : 0,

            pessoas: grupo.pessoas.map(p => {
                return {
                    id: p.pessoa.id,
                    nome_exibicao: p.pessoa.nome_exibicao,
                };
            }),

            paineis: grupo.paineis.map(p => {
                return {
                    id: p.painel.id,
                    nome: p.painel.nome,
                    ativo: p.painel.ativo,
                };
            }),
        };

        return ret;
    }
}
