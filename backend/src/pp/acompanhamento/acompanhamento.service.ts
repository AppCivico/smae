import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateProjetoAcompanhamentoDto } from './dto/create-acompanhamento.dto';
import { DetailProjetoAcompanhamentoDto, ProjetoAcompanhamento } from './entities/acompanhamento.entity';
import { UpdateProjetoAcompanhamentoDto } from './dto/update-acompanhamento.dto';

@Injectable()
export class AcompanhamentoService {
    private readonly logger = new Logger(AcompanhamentoService.name);
    constructor(private readonly prisma: PrismaService) { }

    async create(projetoId: number, dto: CreateProjetoAcompanhamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {

        const acompanhamento = await this.prisma.projetoAcompanhamento.create({
            data: {
                projeto_id: projetoId,
                ...dto,

                criado_em: new Date(Date.now()),
                criado_por: user.id
            },
            select: {id: true}
        });

        return {id: acompanhamento.id}
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<ProjetoAcompanhamento[]> {
        const projetoAcompanhamento = await this.prisma.projetoAcompanhamento.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null
            },
            orderBy: [{criado_em: 'desc'}],
            select: {
                id: true,
                data_registro: true,
                participantes: true,
                responsavel: true,
                detalhamento: true,
                encaminhamento: true,

                ProjetoAcompanhamentoRisco: {
                    select: {
                        projeto_risco: {
                            select: {
                                id: true,
                                codigo: true
                            }
                        }
                    }
                }
            }
        });

        return projetoAcompanhamento.map(a => {
            return {
                id: a.id,
                data_registro: a.data_registro,
                participantes: a.participantes,
                responsavel: a.responsavel,
                detalhamento: a.detalhamento,
                encaminhamento: a.encaminhamento,

                risco: a.ProjetoAcompanhamentoRisco.map(r => {
                    return {
                        id: r.projeto_risco.id,
                        codigo: r.projeto_risco.codigo
                    }
                })
            }
        });
    }

    async findOne(projetoId: number, id: number, user: PessoaFromJwt): Promise<DetailProjetoAcompanhamentoDto> {
        const projetoAcompanhamento = await this.prisma.projetoAcompanhamento.findFirst({
            where: {
                id,
                projeto_id: projetoId,
                removido_em: null
            },
            select: {
                id: true,
                data_registro: true,
                participantes: true,
                responsavel: true,
                prazo_encaminhamento: true,
                detalhamento: true,
                encaminhamento: true,
                observacao: true,
                detalhamento_status: true,
                pontos_atencao: true,
                prazo_realizado: true,

                ProjetoAcompanhamentoRisco: {
                    select: {
                        projeto_risco: {
                            select: {
                                id: true,
                                codigo: true
                            }
                        }
                    }
                }
            }
        });
        if (!projetoAcompanhamento) throw new HttpException('Não foi possível encontrar o Acompanhamento', 400);

        
        return {
            id: projetoAcompanhamento.id,
            data_registro: projetoAcompanhamento.data_registro,
            participantes: projetoAcompanhamento.participantes,
            responsavel: projetoAcompanhamento.responsavel,
            prazo_encaminhamento: projetoAcompanhamento.prazo_encaminhamento,
            detalhamento: projetoAcompanhamento.detalhamento,
            encaminhamento: projetoAcompanhamento.encaminhamento,
            observacao: projetoAcompanhamento.observacao,
            detalhamento_status: projetoAcompanhamento.detalhamento_status,
            pontos_atencao: projetoAcompanhamento.pontos_atencao,
            prazo_realizado: projetoAcompanhamento.prazo_realizado,

            risco: projetoAcompanhamento.ProjetoAcompanhamentoRisco.map(r => {
                return {
                    id: r.projeto_risco.id,
                    codigo: r.projeto_risco.codigo
                }
            })
        }
    }

    async update(projeto_id: number, id: number, dto: UpdateProjetoAcompanhamentoDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
        
            return await this.prisma.projetoAcompanhamento.update({
                where: {
                    id,
                },
                data: {
                    ...dto
                },
                select: {id: true}
            });
        });

        return updated;
    }

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        return await this.prisma.projetoAcompanhamento.updateMany({
            where: {
                id,
                projeto_id: projeto_id
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id
            }
        })
    }

}
