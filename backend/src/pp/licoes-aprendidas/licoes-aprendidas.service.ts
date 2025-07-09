import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateLicoesApreendidasDto } from './dto/create-licoes-aprendidas.dto';
import { UpdateLicoesAprendidasDto } from './dto/update-licoes-aprendidas.dto';
import { LicaoAprendida } from './entities/licoes-aprendidas.entity';

@Injectable()
export class LicoesAprendidasService {
    private readonly logger = new Logger(LicoesAprendidasService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(projetoId: number, dto: CreateLicoesApreendidasDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const projetoPortfolio = await prismaTx.projeto.findFirstOrThrow({
                    where: { id: projetoId },
                    select: {
                        portfolio: {
                            select: { modelo_clonagem: true },
                        },
                    },
                });
                if (projetoPortfolio.portfolio.modelo_clonagem)
                    throw new HttpException('Projeto pertence a Portfolio de modelo de clonagem', 400);

                let sequencial: number | undefined = dto.sequencial;

                // Caso o "sequencial" seja enviado, deve ser checado se não há já um mesmo sequencial para o mesmo projeto.
                if (sequencial) {
                    const exists = await prismaTx.projetoLicaoAprendida.count({
                        where: {
                            projeto_id: projetoId,
                            removido_em: null,
                            sequencial: sequencial,
                        },
                    });

                    if (exists) throw new HttpException('sequencial| Valor já em uso', 400);
                } else {
                    const ultimoSeqRow = await prismaTx.projetoLicaoAprendida.findFirst({
                        take: 1,
                        where: {
                            projeto_id: projetoId,
                            removido_em: null,
                        },
                        orderBy: [{ sequencial: 'desc' }],
                        select: {
                            sequencial: true,
                        },
                    });

                    if (!ultimoSeqRow) {
                        console.log('Não foi encontrada Lição Aprendida (não removida) para projeto_id=' + projetoId);
                        sequencial = 1;
                    } else {
                        sequencial = ultimoSeqRow.sequencial + 1;
                    }
                }

                const licao_aprendida = await prismaTx.projetoLicaoAprendida.create({
                    data: {
                        ...dto,
                        sequencial,

                        projeto_id: projetoId,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                return { id: licao_aprendida.id };
            }
        );

        return { id: created.id };
    }

    async findAll(projetoId: number, user: PessoaFromJwt): Promise<LicaoAprendida[]> {
        const projetoLicoesAprendidas = await this.prisma.projetoLicaoAprendida.findMany({
            where: {
                projeto_id: projetoId,
                removido_em: null,
            },
            orderBy: [{ sequencial: 'asc' }, { projeto_id: 'asc' }],
            select: {
                id: true,
                sequencial: true,
                data_registro: true,
                responsavel: true,
                descricao: true,
                observacao: true,
                contexto: true,
                resultado: true,
            },
        });

        return projetoLicoesAprendidas;
    }

    async findOne(projetoId: number, id: number, user: PessoaFromJwt): Promise<LicaoAprendida> {
        const licaoAprendida = await this.prisma.projetoLicaoAprendida.findFirst({
            where: {
                id,
                projeto_id: projetoId,
                removido_em: null,
            },
            select: {
                id: true,
                sequencial: true,
                data_registro: true,
                responsavel: true,
                descricao: true,
                observacao: true,
                contexto: true,
                resultado: true,
            },
        });
        if (!licaoAprendida) throw new HttpException('Não foi possível encontrar lição aprendida para este ID', 400);

        return licaoAprendida;
    }

    async update(projeto_id: number, id: number, dto: UpdateLicoesAprendidasDto, user: PessoaFromJwt) {
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                // Caso o "sequencial" seja enviado, deve ser checado se não há já um mesmo sequencial para o mesmo projeto.
                if (dto.sequencial) {
                    const exists = await prismaTx.projetoLicaoAprendida.count({
                        where: {
                            projeto_id: projeto_id,
                            removido_em: null,
                            sequencial: dto.sequencial,
                        },
                    });

                    if (exists) throw new HttpException('sequencial| Valor já em uso', 400);
                }

                return await prismaTx.projetoLicaoAprendida.update({
                    where: { id },
                    data: {
                        ...dto,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    async remove(projeto_id: number, id: number, user: PessoaFromJwt) {
        await this.prisma.projetoLicaoAprendida.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
                projeto_id: projeto_id,
            },
            select: { id: true },
        });

        return await this.prisma.projetoLicaoAprendida.updateMany({
            where: {
                id,
                projeto_id: projeto_id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
