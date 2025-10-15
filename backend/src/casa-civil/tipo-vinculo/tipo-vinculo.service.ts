import { HttpException, Injectable } from '@nestjs/common';
import { CreateTipoVinculoDto } from './dto/create-tipo-vinculo.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { FilterPartidoDto } from 'src/partido/dto/filter-partido.dto';
import { UpdatePartidoDto } from 'src/partido/dto/update-partido.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';

@Injectable()
export class TipoVinculoService {
    constructor(private readonly prisma: PrismaService) {}

    async upsert(dto: CreateTipoVinculoDto, user?: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        const similarExists = await this.prisma.tipoVinculo.count({
            where: {
                nome: { endsWith: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

        if (id) {
            const self = await this.prisma.tipoVinculo.findFirst({
                where: { id, removido_em: null },
                select: {
                    nome: true,
                },
            });
            if (!self) throw new HttpException('Tipo de vínculo não encontrado', 404);

            // TODO?: verificar se está em uso.

            await this.prisma.tipoVinculo.updateMany({
                where: { id },
                data: {
                    nome: dto.nome,
                    atualizado_por: user ? user.id : undefined,
                    atualizado_em: new Date(Date.now()),
                },
            });
        } else {
        }

        const created = await this.prisma.tipoVinculo.upsert({
            where: { id: id || 0 },
            create: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
            },
            update: {
                atualizado_por: user ? user.id : undefined,
                atualizado_em: new Date(Date.now()),
                nome: dto.nome,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters?: FilterPartidoDto) {
        const listActive = await this.prisma.tipoVinculo.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
            },
            orderBy: [{ nome: 'asc' }],
        });
        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt) {
        return await this.prisma.tipoVinculo.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO: se estiver em uso, não deixar remover.

        const deleted = await this.prisma.tipoVinculo.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }
}
