import { HttpException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { BlocoNotaItem, CreateBlocoNotaDto } from './dto/bloco-nota.dto';

const JWT_AUD = 'bn';
type JwtToken = {
    bloco_id: number;
    aud: string;
};

@Injectable()
export class BlocoNotaService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService
    ) {}

    async getTokenFor(
        dto: CreateBlocoNotaDto,
        user: PessoaFromJwt | { id: number },
        prismaTx: Prisma.TransactionClient = this.prisma
    ): Promise<string> {
        let bloco: string;
        if (dto.projeto_id) {
            bloco = `Proj:${dto.projeto_id}`;
        } else if (dto.transferencia_id) {
            bloco = `Transf:${dto.transferencia_id}`;
        } else if (dto.transfere_gov) {
            bloco = `TransfereGov:${dto.transfere_gov}`;
        } else {
            throw new HttpException('Necessário informar um projeto ou transferência', 400);
        }

        const found = await prismaTx.blocoNota.findFirst({
            where: {
                removido_em: null,
                bloco: bloco,
            },
            select: { id: true },
        });

        if (found) return this.getToken(found.id);

        const created = await prismaTx.blocoNota.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                bloco: bloco,
            },
            select: { id: true },
        });

        return this.getToken(created.id);
    }

    async findAll(): Promise<BlocoNotaItem[]> {
        const listActive = await this.prisma.blocoNota.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                bloco: true,
            },
            orderBy: { bloco: 'asc' },
        });

        return listActive;
    }

    async remove(id: number, user: PessoaFromJwt) {
        const created = await this.prisma.blocoNota.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }

    checkToken(token: string): number {
        let decoded: JwtToken | null = null;
        try {
            decoded = this.jwtService.verify(token) as JwtToken;
        } catch (error) {
            console.log(error);
        }
        if (!decoded || ![JWT_AUD].includes(decoded.aud)) throw new HttpException('bloco_nota inválido', 400);

        return decoded.bloco_id;
    }

    getToken(id: number): string {
        return this.jwtService.sign(
            {
                bloco_id: id,
                aud: JWT_AUD,
            } satisfies JwtToken,
            { expiresIn: '30d' }
        );
    }
}
