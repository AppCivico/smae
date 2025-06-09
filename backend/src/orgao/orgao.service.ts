import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgaoDto } from './dto/create-orgao.dto';
import { UpdateOrgaoDto } from './dto/update-orgao.dto';
import { FilterOrgaoDto } from './dto/filter-orgao.dto';
import { OrgaoReduzidoDto } from './entities/orgao.entity';

@Injectable()
export class OrgaoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateOrgaoDto, user?: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.orgao.count({
            where: {
                descricao: { endsWith: dto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        if (dto.sigla) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (dto.parente_id === null && dto.nivel > 1) {
            throw new HttpException('Órgãos com nível maior que 1 necessita de um órgão pai', 400);
        } else if (dto.parente_id !== null) {
            const pai = await this.prisma.orgao.findFirst({
                where: { removido_em: null, id: dto.parente_id },
                select: { id: true, nivel: true },
            });
            if (!pai) throw new HttpException(`Órgão (${dto.parente_id}) não foi encontrado.`, 400);
            if (pai.nivel != dto.nivel - 1)
                throw new HttpException(
                    `Nível (${dto.nivel}) inválido para ser filho imediato do órgão pai enviado (nível ${pai.nivel}).`,
                    400
                );
        } else {
            dto.nivel = 1;
        }

        return await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const orgao = await prismaTx.orgao.create({
                data: {
                    criado_por: user ? user.id : undefined,
                    criado_em: new Date(Date.now()),
                    ...dto,
                },
                select: { id: true },
            });

            return orgao;
        });
    }

    async findAll() {
        const listActive = await this.prisma.orgao.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                sigla: true,
                tipo_orgao: {
                    select: { descricao: true, id: true },
                },
                cnpj: true,
                email: true,
                secretario_responsavel: true,
                oficial: true,
                parente_id: true,
                nivel: true,
            },
            orderBy: [{ sigla: 'asc' }],
        });
        return listActive;
    }

    async findReducedOrgao(dto: FilterOrgaoDto): Promise<OrgaoReduzidoDto[]> {
        const { palavra_chave, limit = 10 } = dto;

        return this.prisma.orgao.findMany({
            where: {
                removido_em: null,
                OR: palavra_chave
                    ? [
                          { descricao: { contains: palavra_chave, mode: 'insensitive' } },
                          { sigla: { contains: palavra_chave, mode: 'insensitive' } },
                      ]
                    : undefined,
            },
            select: {
                id: true,
                sigla: true,
                descricao: true,
            },
            orderBy: { descricao: 'asc' },
            take: limit,
        });
    }

    async findOne(id: number) {
        return await this.prisma.orgao.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async update(id: number, dto: UpdateOrgaoDto, user: PessoaFromJwt) {
        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.descricao !== undefined) {
                    const similarExists = await prismaTx.orgao.count({
                        where: {
                            descricao: { equals: dto.descricao, mode: 'insensitive' },
                            removido_em: null,
                            NOT: { id: id },
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                if (dto.sigla) {
                    const similarExists = await prismaTx.orgao.count({
                        where: {
                            sigla: { equals: dto.sigla, mode: 'insensitive' },
                            removido_em: null,
                            NOT: { id: id },
                        },
                    });
                    if (similarExists > 0)
                        throw new HttpException(
                            'sigla| Sigla igual ou semelhante já existe em outro registro ativo',
                            400
                        );
                }

                const self = await prismaTx.orgao.findFirstOrThrow({
                    where: {
                        id: id,
                        removido_em: null,
                    },
                });

                // se enviar um ou o outro, pre-carregar o que faltar do banco, e inicia as validações
                if (dto.parente_id || dto.nivel) {
                    if (dto.parente_id === undefined) dto.parente_id = self.parente_id;
                    if (dto.nivel === undefined) dto.nivel = self.nivel;

                    if (dto.parente_id === null && dto.nivel > 1) {
                        throw new HttpException('Órgãos com nível maior que 1 necessita de um órgão pai', 400);
                    } else if (dto.parente_id !== null) {
                        const pai = await prismaTx.orgao.findFirst({
                            where: { removido_em: null, id: dto.parente_id },
                            select: { id: true, nivel: true },
                        });
                        if (!pai) throw new HttpException(`Órgão (${dto.parente_id}) não foi encontrado.`, 400);
                        if (pai.nivel != dto.nivel - 1)
                            throw new HttpException(
                                `Nível (${dto.nivel}) inválido para ser filho imediato do órgão pai enviado (nível ${pai.nivel}).`,
                                400
                            );
                    } else {
                        dto.nivel = 1;
                    }
                }

                return await prismaTx.orgao.update({
                    where: { id: id },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        ...dto,
                    },
                    select: { id: true },
                });
            },
            { isolationLevel: 'Serializable' }
        );
    }

    async remove(id: number, user: PessoaFromJwt) {
        const countMeta = await this.prisma.meta.count({ where: { meta_orgao: { some: { orgao_id: id } } } });
        if (countMeta > 0)
            throw new HttpException('Não é possível remover o órgão, pois existem Metas associadas.', 400);

        const countIniciativa = await this.prisma.iniciativa.count({
            where: { iniciativa_orgao: { some: { orgao_id: id } } },
        });
        if (countIniciativa > 0)
            throw new HttpException('Não é possível remover o órgão, pois existem Iniciativas associadas.', 400);

        const countAtividade = await this.prisma.atividade.count({
            where: { atividade_orgao: { some: { orgao_id: id } } },
        });
        if (countAtividade > 0)
            throw new HttpException('Não é possível remover o órgão, pois existem Iniciativas associadas.', 400);

        const filhoExiste = await this.prisma.orgao.count({
            where: {
                parente_id: id,
                removido_em: null,
            },
        });
        if (filhoExiste > 0)
            throw new HttpException('Não é possível remover o órgão, pois existem órgãos dependentes.', 400);

        // TODO
        // verificar se há pessoas neste orgao
        const created = await this.prisma.orgao.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
