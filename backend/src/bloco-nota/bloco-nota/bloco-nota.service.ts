import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { BlocoNotaItem, CreateBlocoNotaDto, UpdateBlocoNotaDto } from './dto/bloco-nota.dto';
import { JwtService } from '@nestjs/jwt';

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

    async getTokenFor(dto: CreateBlocoNotaDto, user: PessoaFromJwt): Promise<string> {
        const found = await this.prisma.blocoNota.findFirst({
            where: {
                removido_em: null,
                bloco: dto.bloco,
            },
            select: { id: true },
        });

        if (found) return this.getToken(found.id);

        const created = await this.prisma.blocoNota.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                bloco: dto.bloco,
            },
            select: { id: true },
        });

        return this.getToken(created.id);
    }

    async create(dto: CreateBlocoNotaDto, user: PessoaFromJwt) {
        const created = await this.prisma.blocoNota.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                bloco: dto.bloco,
            },
            select: { id: true },
        });

        return created;
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

    async update(id: number, dto: UpdateBlocoNotaDto, user: PessoaFromJwt) {
        await this.prisma.blocoNota.findFirstOrThrow({
            where: { id: id, removido_em: null },
        });

        await this.prisma.blocoNota.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                bloco: dto.bloco,
            },
        });

        return { id };
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
