import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ListEleicaoDto } from './entity/eleicao.entity';
import { CreateEleicaoDto } from './dto/create-eleicao.dto';
import { Eleicao } from '@prisma/client';
import { FilterEleicaoDto } from './dto/filter-eleicao.dto';
import { UpdateEleicaoDto } from './dto/update-eleicao.dto';
import { LoggerWithLog } from 'src/common/LoggerWithLog';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';

@Injectable()
export class EleicaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createEleicaoDto: CreateEleicaoDto, user: PessoaFromJwt): Promise<Eleicao> {
        const logger = LoggerWithLog('Eleição: Criação');
        try {
            const created = await this.prisma.$transaction(async (tx) => {
                logger.log(`Criando eleição do tipo ${createEleicaoDto.tipo}, ano ${createEleicaoDto.ano}`);
                const record = await tx.eleicao.create({
                    data: createEleicaoDto,
                    select: {
                        id: true,
                        tipo: true,
                        ano: true,
                        atual_para_mandatos: true,
                        removido_em: true,
                    },
                });
                await logger.saveLogs(tx, user.getLogData());
                return record;
            });
            return created;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new BadRequestException('Já existe uma eleição deste tipo para este ano');
                }
            }
            throw error;
        }
    }

    async findAll(filters: FilterEleicaoDto): Promise<ListEleicaoDto[]> {
        const eleicoes = await this.prisma.eleicao.findMany({
            where: {
                removido_em: null,
                tipo: filters?.tipo,
                ano: filters?.ano,
                atual_para_mandatos: filters?.atual_para_mandatos,
            },
            select: {
                id: true,
                tipo: true,
                ano: true,
                atual_para_mandatos: true,
                removido_em: true,
            },
            orderBy: [{ ano: 'desc' }, { tipo: 'asc' }],
        });
        return [{ linhas: eleicoes }];
    }

    async findOne(id: number): Promise<Eleicao> {
        const eleicao = await this.prisma.eleicao.findFirst({
            where: {
                id: id,
                removido_em: null,
            },
            select: {
                id: true,
                tipo: true,
                ano: true,
                atual_para_mandatos: true,
                removido_em: true,
            },
        });

        if (!eleicao) {
            throw new BadRequestException('Eleição não encontrada');
        }

        return eleicao;
    }

    async update(id: number, dto: UpdateEleicaoDto, user: PessoaFromJwt): Promise<Eleicao> {
        const logger = LoggerWithLog('Eleição: Atualização');

        if (dto.tipo !== undefined && dto.ano !== undefined) {
            const conflito = await this.prisma.eleicao.count({
                where: {
                    tipo: dto.tipo,
                    ano: dto.ano,
                    removido_em: null,
                    NOT: { id },
                },
            });
            if (conflito > 0) {
                throw new BadRequestException('Já existe uma eleição deste tipo para este ano');
            }
        }

        const updated = await this.prisma.$transaction(async (tx) => {
            logger.log(
                `Atualizando eleição ${id}: novo tipo=${dto.tipo ?? 'sem alteração'}, novo ano=${dto.ano ?? 'sem alteração'}`
            );

            const record = await tx.eleicao.update({
                where: { id },
                data: dto,
                select: {
                    id: true,
                    tipo: true,
                    ano: true,
                    atual_para_mandatos: true,
                    removido_em: true,
                },
            });

            await logger.saveLogs(tx, user.getLogData());

            return record;
        });

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        const logger = LoggerWithLog('Eleição: Remoção');
        logger.log(`Removendo eleição ${id}`);
        await this.findOne(id); // Verifica se existe

        // Verifica se tem relacionamentos antes de remover
        const mandatos = await this.prisma.parlamentarMandato.count({
            where: { eleicao_id: id },
        });

        const comparecimentos = await this.prisma.eleicaoComparecimento.count({
            where: { eleicao_id: id },
        });

        if (mandatos > 0 || comparecimentos > 0) {
            throw new BadRequestException(
                'Não é possível remover esta eleição pois ela possui mandatos ou comparecimentos associados'
            );
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            logger.log(`Eleição: ${id}`);
            await prismaTx.eleicao.update({
                where: { id: id },
                data: { removido_em: new Date() },
            });
            await logger.saveLogs(prismaTx, user.getLogData());
        });
    }
}
