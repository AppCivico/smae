import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoAditivoDto, FilterTipoAditivoDto, UpdateTipoAditivoDto } from './dto/tipo-aditivo.dto';

@Injectable()
export class ProjetoTipoAditivoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateTipoAditivoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.tipoAditivo.count({
            where: {
                nome: { equals: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.tipoAditivo.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
                habilita_valor: dto.habilita_valor,
                habilita_valor_data_termino: dto.habilita_valor_data_termino,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterTipoAditivoDto) {
        const listActive = await this.prisma.tipoAditivo.findMany({
            where: {
                removido_em: null,
                id: filters.id,
            },
            select: {
                id: true,
                nome: true,
                habilita_valor: true,
                habilita_valor_data_termino: true,
            },
            orderBy: { nome: 'asc' },
        });

        return listActive;
    }

    async update(id: number, dto: UpdateTipoAditivoDto, user: PessoaFromJwt) {
        const self = await this.prisma.tipoAditivo.findFirstOrThrow({
            where: { id: id },
            select: { id: true, habilita_valor: true, habilita_valor_data_termino: true },
        });

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.tipoAditivo.count({
                where: {
                    nome: { equals: dto.nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: self.id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        const contratosAditivos = await this.prisma.contratoAditivo.count({
            where: {
                tipo_aditivo_id: id,
                removido_em: null,
            },
        });

        if (contratosAditivos > 0) {
            if (
                (dto.habilita_valor !== undefined && dto.habilita_valor !== self.habilita_valor) ||
                (dto.habilita_valor_data_termino !== undefined &&
                    dto.habilita_valor_data_termino !== self.habilita_valor_data_termino)
            ) {
                throw new HttpException(
                    'Existem contratos com aditivos desse tipo. Não é possível alterar os checkboxes.',
                    400
                );
            }

            if (dto.nome !== undefined) {
                await this.prisma.tipoAditivo.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        nome: dto.nome, // Apenas o nome é atualizado
                    },
                });
            }

            return { id };
        }

        await this.prisma.tipoAditivo.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                habilita_valor: dto.habilita_valor,
                habilita_valor_data_termino: dto.habilita_valor_data_termino,
                nome: dto.nome,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const contratosAditivos = await this.prisma.contratoAditivo.count({
            where: {
                tipo_aditivo_id: id,
                removido_em: null,
            },
        });

        if (contratosAditivos > 0)
            throw new HttpException('Existem contratos com aditivos desse tipo. Não é possível remover.', 400);

        const created = await this.prisma.tipoAditivo.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
