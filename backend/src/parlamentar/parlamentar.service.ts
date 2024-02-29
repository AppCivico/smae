import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateAssessorDto, CreateMandatoDto, CreateParlamentarDto, createMandatoRepresentatividadeDto } from './dto/create-parlamentar.dto';
import { DadosEleicaoNivel, Prisma } from '@prisma/client';
import { ParlamentarDetailDto, ParlamentarDto } from './entities/parlamentar.entity';
import { UpdateAssessorDto, UpdateParlamentarDto } from './dto/update-parlamentar.dto';

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
        return await this.prisma.parlamentar.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                nome: true,
                nome_popular: true,
                biografia: true,
                nascimento: true,
                telefone: true,
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
                }
            }
        });

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

    async createMandatoRepresentatividade(parlamentarId: number, dto: createMandatoRepresentatividadeDto, user: PessoaFromJwt): Promise<RecordWithId> {
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
}
