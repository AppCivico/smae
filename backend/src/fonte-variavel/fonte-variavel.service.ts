import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { CreateFonteVariavelDto, FilterFonteVariavelDto, UpdateFonteVariavelDto } from './dto/fonte-variavel.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class FonteVariavelService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateFonteVariavelDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Fonte Variavel: Criação');
        const similarExists = await this.prisma.fonteVariavel.count({
            where: {
                nome: { equals: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            logger.log(`Fonte Variavel: ${dto.nome}`);
            const r = await prismaTx.fonteVariavel.create({
                data: {
                    criado_em: new Date(Date.now()),
                    nome: dto.nome,
                },
                select: { id: true },
            });
            await logger.saveLogs(prismaTx, user.getLogData());

            return r;
        });

        return created;
    }

    async findAll(filters: FilterFonteVariavelDto) {
        const listActive = await this.prisma.fonteVariavel.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
            },
            orderBy: { nome: 'asc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateFonteVariavelDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Fonte Variavel: Atualização');
        const self = await this.prisma.fonteVariavel.findFirstOrThrow({
            where: { id: id },
            select: { id: true },
        });

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.fonteVariavel.count({
                where: {
                    nome: { equals: dto.nome, mode: 'insensitive' },
                    removido_em: null,

                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            logger.log(`Fonte Variavel: ${JSON.stringify(self)}, novo nome: ${dto.nome}`);
            await prismaTx.fonteVariavel.update({
                where: { id: id },
                data: {
                    atualizado_em: new Date(Date.now()),
                    nome: dto.nome,
                },
            });
            await logger.saveLogs(prismaTx, user.getLogData());
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Fonte Variavel: Remoção');
        const emUso = await this.prisma.variavel.findMany({
            where: {
                fonte_id: id,
            },
            select: {
                id: true,
                titulo: true,
            },
        });

        if (emUso.length)
            throw new BadRequestException('Registro em uso em variáveis: ' + emUso.map((v) => v.titulo).join(', '));

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            logger.log(`Fonte Variavel: ${id}`);

            await prismaTx.fonteVariavel.updateMany({
                where: { id: id },
                data: {
                    removido_em: new Date(Date.now()),
                },
            });
            await logger.saveLogs(prismaTx, user.getLogData());
        });

        return;
    }
}
