import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateAssessorDto, CreateMandatoDto, CreateParlamentarDto, CreateMandatoBancadaDto, CreateMandatoRepresentatividadeDto, CreateMandatoSuplenteDto } from './dto/create-parlamentar.dto';
import { DadosEleicaoNivel, Prisma } from '@prisma/client';
import { ParlamentarDetailDto, ParlamentarDto } from './entities/parlamentar.entity';
import { UpdateAssessorDto, UpdateParlamentarDto } from './dto/update-parlamentar.dto';
import { RemoveMandatoDepsDto } from './dto/remove-mandato-deps.dto';

@Injectable()
export class ParlamentarService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateParlamentarDto, user?: PessoaFromJwt): Promise<RecordWithId> {

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.create({
                    data: {
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return parlamentar;
            }
        );

        return created;
    }

    async findAll(): Promise<ParlamentarDto[]> {
        const listActive = await this.prisma.parlamentar.findMany({
            where: {
                // TODO: filtros.
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                em_atividade: true
            },
            orderBy: [{ nome: 'asc' }],
        });

        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ParlamentarDetailDto> {
        const parlamentar = await this.prisma.parlamentar.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                biografia: true,
                nascimento: true,
                email: true,
                atuacao: true,
                em_atividade: true,

                assessores: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        email: true,
                        nome: true,
                        telefone: true
                    }
                },

                mandatos: {
                    where: { removido_em: null },
                    select: {
                        id: true,
                        gabinete: true,
                        eleito: true,
                        cargo: true,
                        uf: true,
                        suplencia: true,
                        endereco: true,
                        votos_estado: true,
                        votos_capital: true,
                        votos_interior: true,

                        partido_atual: {
                            select: {
                                id: true,
                                nome: true,
                                sigla: true,
                                numero: true
                            }
                        },

                        partido_candidatura: {
                            select: {
                                id: true,
                                nome: true,
                                sigla: true,
                                numero: true
                            }
                        },

                        suplentes: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                suplencia: true,
                                parlamentar: {
                                    select: {
                                        id: true,
                                        nome: true
                                    }
                                }
                            }
                        },

                        bancadas: {
                            select: {
                                bancada: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        nome: true
                                    }
                                }
                            }
                        },

                        representatividade: {
                            where: { removido_em: null },
                            select: {
                                id: true,
                                nivel: true,
                                municipio_tipo: true,
                                numero_votos: true,
                                pct_participacao: true,

                                regiao: {
                                    select: {
                                        id: true,
                                        nivel: true,
                                        codigo: true,
                                        
                                        eleicoesComparecimento: {
                                            where: { removido_em: null },
                                            take: 1,
                                            select: {
                                                id: true,
                                                valor: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                    }
                },


            }
        });

        return {
            ...parlamentar,

            mandatos: parlamentar.mandatos.map(m => {
                return {
                    ...m,

                    suplentes: m.suplentes.map(s => {
                        return {...s.parlamentar}
                    }),

                    bancadas: m.bancadas.map(b => {
                        return { ...b.bancada }
                    }),

                    representatividade: m.representatividade.map(r => {
                        return {
                            ...r,

                            regiao: {
                                ...r.regiao,
                                comparecimento: {...r.regiao.eleicoesComparecimento[0]}
                            }
                        }
                    })
                }
            })
        };
    }

    async update(id: number, dto: UpdateParlamentarDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const parlamentar = await prismaTxn.parlamentar.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                });

                return parlamentar;
            }
        );
    
        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO verificar dependentes

        const deleted = await this.prisma.parlamentar.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }

    async createAssessor(parlamentarId: number, dto: CreateAssessorDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const parlamentar = await this.prisma.parlamentar.count({
            where: { id: parlamentarId, removido_em: null }
        });
        if (!parlamentar) throw new HttpException('parlamentar_id| Parlamentar inválido.', 400);

        const created = await this.prisma.parlamentarAssessor.create({
            data: {
                ...dto,
                parlamentar_id: parlamentarId,
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
            },
            select: { id: true }
        });

        return created;
    }

    async updateAssessor(id: number, dto: UpdateAssessorDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const assessor = await this.prisma.parlamentarAssessor.count({
            where: { id, removido_em: null}
        });
        if (!assessor) throw new HttpException('id| Assessor inválido.', 400);

        await this.prisma.parlamentarAssessor.update({
            where: {id},
            data: {
                ...dto,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            }
        });

        return { id }
    }

    async removeAssessor(id: number, user: PessoaFromJwt) {
        await this.prisma.parlamentarAssessor.update({
            where: {id},
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });
    }

    async createMandato(parlamentarId: number, dto: CreateMandatoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const mandatoExists = await this.prisma.parlamentarMandato.count({
            where: {
                parlamentar_id: parlamentarId,
                eleicao_id: dto.eleicao_id,
                removido_em: null
            }
        });
        if (mandatoExists) throw new HttpException('eleicao_id| Parlamentar já possui mandato para esta eleição', 400);

        const partidoCandidaturaExists = await this.prisma.partido.count({
            where: { id: dto.partido_candidatura_id, removido_em: null }
        });
        if (!partidoCandidaturaExists) throw new HttpException('partido_candidatura_id| Partido de candidatura inválido', 400);

        const partidoAtualExists = await this.prisma.partido.count({
            where: { id: dto.partido_atual_id, removido_em: null }
        });
        if (!partidoAtualExists) throw new HttpException('partido_atual_id| Partido atual inválido', 400);

        if ((dto.suplencia && !dto.mandato_principal_id) || (!dto.suplencia && dto.mandato_principal_id))
            throw new HttpException('Para mandatos de suplentes, deve ser informado o grau de suplência e o mandato principal', 400);

        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const mandato = await prismaTxn.parlamentarMandato.create({
                    data: {
                        parlamentar_id: parlamentarId,
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true }
                });

                return mandato;
            }
        );

        return created;
    }

    async createMandatoRepresentatividade(parlamentarId: number, dto: CreateMandatoRepresentatividadeDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const mandato = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_id,
                parlamentar_id: parlamentarId,
                removido_em: null
            }
        });
        if (!mandato) throw new HttpException('mandato_id| Não foi possível encontrar este mandato', 404);

        if (dto.nivel == DadosEleicaoNivel.Estado && dto.municipio_tipo != undefined)
          throw new HttpException('municipio_tipo| Não deve ser enviado para eleição de nível estadual.', 400);
        
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const dadosEleicao = await prismaTxn.eleicaoComparecimento.findFirst({
                    where: {
                        eleicao_id: mandato.eleicao_id,
                        regiao_id: dto.regiao_id,
                        removido_em: null
                    },
                    select: {valor: true}
                });
                
                let pct_participacao: number | null = null;
                if (dadosEleicao) {
                    pct_participacao = (dto.numero_votos / dadosEleicao.valor) * 100;
                }

                const representatividade = await prismaTxn.mandatoRepresentatividade.create({
                    data: {
                        pct_participacao: pct_participacao,
                        ...dto,
                        criado_por: user ? user.id : undefined,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true }
                });

                return representatividade;
            }
        );

        return created;
    }

    async removeMandatoRepresentatividade(representatividadeId: number, dto: RemoveMandatoDepsDto, user: PessoaFromJwt) {
        return await this.prisma.mandatoRepresentatividade.updateMany({
            where: {
                id: representatividadeId,
                mandato_id: dto.mandato_id
            },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        })
    }

    async createMandatoBancada (parlamentarId: number, dto: CreateMandatoBancadaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const exists = await this.prisma.mandatoBancada.count({
            where: {
                mandato: {
                    id: dto.mandato_id,
                    parlamentar_id: parlamentarId
                },
                bancada_id: dto.bancada_id
            }
        });
        if (exists) throw new HttpException('Bancada já vinculada ao mandato', 400);

        return await this.prisma.mandatoBancada.create({
            data: {
                mandato_id: dto.mandato_id,
                bancada_id: dto.bancada_id
            },
            select: {id: true}
        })
    }

    async removeMandatoBancada(bancadaId: number, dto: RemoveMandatoDepsDto, user: PessoaFromJwt) {
        return await this.prisma.mandatoBancada.delete({
            where: {
                mandato_id_bancada_id: {
                    bancada_id: bancadaId,
                    mandato_id: dto.mandato_id
                }
            }
        });
    }

    async createSuplente(parlamentarId: number, dto: CreateMandatoSuplenteDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const mandatoPrincipal = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_id,
                parlamentar_id: parlamentarId,
                removido_em: null,
                mandato_principal_id: null
            },
            select: {
                id: true
            }
        });
        if (!mandatoPrincipal) throw new HttpException('mandato_id| Mandato principal inválido', 400);

        const mandatoSuplente = await this.prisma.parlamentarMandato.findFirst({
            where: {
                id: dto.mandato_suplente_id,
                removido_em: null,
            },
            select: {
                id: true,
                mandato_principal_id: true,
                suplencia: true,
            }
        });
        if (!mandatoSuplente) throw new HttpException('mandato_id| Mandato suplente não encontrado', 400);

        if (mandatoSuplente.mandato_principal_id && mandatoSuplente.mandato_principal_id != dto.mandato_id)
            throw new HttpException('mandato_suplente_id| Mandato suplente já é suplente de outro mandato distinto', 400);

        if (!mandatoSuplente.suplencia && !dto.suplencia)
            throw new HttpException('suplencia| Grau de suplente deve ser informado', 400);

        await this.prisma.parlamentarMandato.updateMany({
            where: {
                id: mandatoSuplente.id,
            },
            data: {
                suplencia: dto.suplencia,
                mandato_principal_id: dto.mandato_id
            }
        });
        
        return { id: mandatoSuplente.id }
    }

    async removeSuplente(mandatoSuplenteId: number, dto: RemoveMandatoDepsDto, user: PessoaFromJwt) {
        return await this.prisma.parlamentarMandato.updateMany({
            where: {
                id: mandatoSuplenteId,
                mandato_principal_id: dto.mandato_id
            },
            data: {
                mandato_principal_id: null,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            }
        });
    }
}
