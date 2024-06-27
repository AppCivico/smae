import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGrupoTematicoDto } from './dto/create-grupo-tematico.dto';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { UpdateGrupoTematicoDto } from './dto/update-grupo-tematico.dto';
import { GrupoTematico } from './entities/grupo-tematico.entity';

@Injectable()
export class GrupoTematicoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateGrupoTematicoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await prismaTx.grupoTematico.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const grupoTematico = await prismaTx.grupoTematico.create({
                    data: {
                        nome: dto.nome,
                        programa_habitacional: dto.programa_habitacional || false,
                        unidades_habitacionais: dto.unidades_habitacionais || false,
                        familias_beneficiadas: dto.familias_beneficiadas || false,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                });

                return { id: grupoTematico.id };
            }
        );

        return { id: created.id };
    }

    async findAll(user: PessoaFromJwt): Promise<GrupoTematico[]> {
        const gruposTematicos = await this.prisma.grupoTematico.findMany({
            where: {
                removido_em: null,
            },
            orderBy: [{ nome: 'asc' }],
            select: {
                id: true,
                nome: true,
                criado_em: true,
                programa_habitacional: true,
                unidades_habitacionais: true,
                familias_beneficiadas: true,
                criador: { select: { id: true, nome_exibicao: true } },
            },
        });

        return gruposTematicos.map((grupoTematico) => {
            return {
                id: grupoTematico.id,
                nome: grupoTematico.nome,
                programa_habitacional: grupoTematico.programa_habitacional,
                unidades_habitacionais: grupoTematico.unidades_habitacionais,
                familias_beneficiadas: grupoTematico.familias_beneficiadas,
                criado_em: grupoTematico.criado_em,
                criado_por: {
                    id: grupoTematico.criador.id,
                    nome_exibicao: grupoTematico.criador.nome_exibicao,
                },
            } satisfies GrupoTematico;
        });
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<GrupoTematico> {
        const grupoTematico = await this.prisma.grupoTematico.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                criado_em: true,
                programa_habitacional: true,
                unidades_habitacionais: true,
                familias_beneficiadas: true,
                criador: { select: { id: true, nome_exibicao: true } },
            },
        });
        if (!grupoTematico) throw new NotFoundException('Não foi possível encontrar grupoTematico.');

        return {
            id: grupoTematico.id,
            nome: grupoTematico.nome,
            programa_habitacional: grupoTematico.programa_habitacional,
            unidades_habitacionais: grupoTematico.unidades_habitacionais,
            familias_beneficiadas: grupoTematico.familias_beneficiadas,
            criado_em: grupoTematico.criado_em,
            criado_por: {
                id: grupoTematico.criador.id,
                nome_exibicao: grupoTematico.criador.nome_exibicao,
            },
        };
    }

    async update(id: number, dto: UpdateGrupoTematicoDto, user: PessoaFromJwt) {
        const now = new Date(Date.now());
        const updated = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const self = await prismaTx.grupoTematico.findFirstOrThrow({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: { nome: true },
                });

                if (dto.nome && dto.nome != self.nome) {
                    const similarExists = await prismaTx.grupoTematico.count({
                        where: {
                            id: { not: id },
                            nome: { equals: dto.nome, mode: 'insensitive' },
                            removido_em: null,
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'fonte| Nome igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                if (dto.programa_habitacional === null) delete dto.programa_habitacional;
                if (dto.unidades_habitacionais === null) delete dto.unidades_habitacionais;
                if (dto.familias_beneficiadas === null) delete dto.familias_beneficiadas;

                return await prismaTx.grupoTematico.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        programa_habitacional: dto.programa_habitacional,
                        unidades_habitacionais: dto.unidades_habitacionais,
                        familias_beneficiadas: dto.familias_beneficiadas,
                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                    select: { id: true },
                });
            }
        );

        return updated;
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.grupoTematico.findFirstOrThrow({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        const emUso = await this.prisma.projeto.count({
            where: {
                grupo_tematico_id: id,
                removido_em: null,
            },
        });
        if (emUso > 0) throw new HttpException('Grupo temático tem obras vinculadas.', 400);

        return await this.prisma.grupoTematico.updateMany({
            where: {
                id,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
