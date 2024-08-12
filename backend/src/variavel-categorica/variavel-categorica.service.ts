import { BadRequestException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateVariavelCategoricaDto,
    CreateVariavelCategoricaValorDto,
    FilterVariavelCategoricaDto,
    UpdateVariavelCategoricaDto,
    VariavelCategoricaItem,
} from './dto/variavel-categorica.dto';

@Injectable()
export class VariavelCategoricaService {
    private readonly logger = new Logger(VariavelCategoricaService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateVariavelCategoricaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        if (dto.tipo == 'Cronograma')
            throw new BadRequestException('Tipo de variável categórica cronograma não pode ser criado.');

        if (dto.valores.length === 0)
            throw new BadRequestException(`Valores de variável categórica binária deve ter pelo menos 1 valor.`);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                if (dto.tipo == 'Binaria') this.checkTipoBinaria(dto);

                return await this.performVariavelSave(prismaTxn, dto, now, user);
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return { id: created.id };
    }

    private checkTipoBinaria(dto: CreateVariavelCategoricaDto | UpdateVariavelCategoricaDto) {
        if (!Array.isArray(dto.valores)) return;

        if (dto.valores.length != 2)
            throw new BadRequestException(`Valores de variável categórica binária deve ter exatamente 2 valores.`);
        dto.valores.sort((a, b) => a.valor_variavel - b.valor_variavel);

        // garante que é 0 e 1
        for (let i = 0; i < dto.valores.length; i++) {
            if (dto.valores[i].valor_variavel != i)
                throw new BadRequestException(`Valores de variável categórica binária deve ser exatamente 0 e 1.`);
        }
    }

    private async performVariavelSave(
        prismaTxn: Prisma.TransactionClient,
        dto: CreateVariavelCategoricaDto,
        now: Date,
        user: PessoaFromJwt
    ) {
        const jaEmUso = await prismaTxn.variavelCategorica.count({
            where: {
                removido_em: null,
                titulo: dto.titulo,
            },
        });

        if (jaEmUso > 0)
            throw new HttpException(`Título ${dto.titulo} já está em uso em outra variável categórica.`, 400);

        const variavelCategorica = await prismaTxn.variavelCategorica.create({
            data: {
                tipo: dto.tipo,
                titulo: dto.titulo,
                criado_em: now,
                criado_por: user.id,
                descricao: dto.descricao,
            },
            select: { id: true },
        });

        await this.upsertValores(variavelCategorica.id, dto.valores, prismaTxn, user, now);

        return variavelCategorica;
    }

    async findAll(filters: FilterVariavelCategoricaDto): Promise<VariavelCategoricaItem[]> {
        const listActive = await this.prisma.variavelCategorica.findMany({
            where: {
                id: filters.id,
                removido_em: null,
                tipo: filters.tipo,
            },
            orderBy: { titulo: 'asc' },
            select: {
                id: true,
                titulo: true,
                descricao: true,
                tipo: true,

                valores: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: {
                        ordem: 'asc',
                    },
                    select: {
                        id: true,
                        titulo: true,
                        descricao: true,
                        valor_variavel: true,
                        ordem: true,
                        criador: { select: { id: true, nome_exibicao: true } },
                        atualizador: { select: { id: true, nome_exibicao: true } },
                        atualizado_em: true,
                        criado_em: true,
                    },
                },
            },
        });

        return listActive.map((v) => {
            return {
                id: v.id,
                titulo: v.titulo,
                descricao: v.descricao,
                tipo: v.tipo,
                valores: v.valores.map((vv) => {
                    return {
                        id: vv.id,
                        titulo: vv.titulo,
                        descricao: vv.descricao,
                        valor_variavel: vv.valor_variavel,
                        ordem: vv.ordem,
                        criador: vv.criador,
                        criado_em: vv.criado_em,
                        atualizador: vv.atualizador,
                        atualizado_em: vv.atualizado_em,
                    };
                }),
                pode_editar: v.tipo != 'Cronograma',
            };
        });
    }

    async update(varCatId: number, dto: UpdateVariavelCategoricaDto, user: PessoaFromJwt) {
        const selfVariavelCat = await this.buscaVariavelCategorica(varCatId);
        if (selfVariavelCat.tipo == 'Cronograma')
            throw new BadRequestException('Tipo de variável categórica cronograma não pode ser editado.');

        if (Array.isArray(dto.valores)) {
            if (dto.valores.length == 0)
                throw new BadRequestException(`Valores de variável categórica deve ter pelo menos 1 valor.`);
            if (selfVariavelCat.tipo == 'Binaria') this.checkTipoBinaria(dto);
        }

        const jaEmUso = await this.prisma.variavelCategorica.count({
            where: {
                removido_em: null,
                titulo: dto.titulo,
                NOT: { id: varCatId },
            },
        });
        if (jaEmUso > 0) throw new HttpException(`Título ${dto.titulo} já está em uso.`, 400);

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            await prismaTxn.variavelCategorica.update({
                where: { id: varCatId },
                data: {
                    titulo: dto.titulo,
                    descricao: dto.descricao,

                    atualizado_em: now,
                    atualizado_por: user.id,
                },
            });

            if (Array.isArray(dto.valores)) await this.upsertValores(varCatId, dto.valores, prismaTxn, user, now);
        });

        return { id: varCatId };
    }

    private async buscaVariavelCategorica(varCatId: number) {
        const selfVariavelCat = await this.prisma.variavelCategorica.findFirst({
            where: { id: varCatId, removido_em: null },
            select: { id: true, tipo: true },
        });
        if (!selfVariavelCat) throw new HttpException('Variavel Categórica não encontrada.', 400);
        return selfVariavelCat;
    }

    async remove(variavelId: number, user: PessoaFromJwt) {
        const selfVariavelCat = await this.buscaVariavelCategorica(variavelId);

        await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient) => {
                const count = await prismaTxn.serieVariavel.count({
                    where: { variavel_categorica_id: selfVariavelCat.id },
                });

                if (count > 0)
                    throw new BadRequestException(
                        `Não é possível remover a variável: em uso em ${count} valores de variáveis.`
                    );

                await prismaTxn.variavelCategorica.update({
                    where: { id: selfVariavelCat.id },
                    data: {
                        removido_em: new Date(Date.now()),
                        removido_por: user.id,
                    },
                    select: { id: true },
                });
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return { id: variavelId };
    }

    private async upsertValores(
        variavel_categorica_id: number,
        sentCatValor: CreateVariavelCategoricaValorDto[],
        prismaTx: Prisma.TransactionClient,
        user: PessoaFromJwt,
        now: Date
    ): Promise<void> {
        const currentCatValor = await prismaTx.variavelCategoricaValor.findMany({
            where: {
                removido_em: null,
                variavel_categorica_id: variavel_categorica_id,
            },
        });

        const updated: CreateVariavelCategoricaValorDto[] = sentCatValor
            .filter((r) => r.id !== undefined)
            .filter((rNew) => {
                const rOld = currentCatValor.find((r) => r.id === rNew.id);
                if (rOld)
                    return (
                        rNew.ordem != rOld.ordem ||
                        rNew.titulo != rOld.titulo ||
                        rNew.descricao != rOld.descricao ||
                        rNew.valor_variavel != rOld.valor_variavel
                    );

                throw new BadRequestException(`Registro anterior com ID ${rNew.id} não encontrado.`);
            });

        const created: CreateVariavelCategoricaValorDto[] = sentCatValor.filter((r) => r.id == undefined);

        const deleted: number[] = currentCatValor
            .filter((r) => {
                return !sentCatValor.filter((rNew) => rNew.id != undefined).find((rNew) => rNew.id == r.id);
            })
            .map((r) => {
                // buscar no serieVariavel se tem algum valor associado, se tiver bloqueia a exclusão
                return r.id!;
            });

        const operations = [];

        for (const r of updated) {
            if (r.id === null) throw new BadRequestException('ID não pode ser nulo na atualização.');

            const rPrev = currentCatValor.find((rr) => rr.id == r.id);
            if (!rPrev) throw new BadRequestException('Registro anterior não encontrado.');

            operations.push(
                prismaTx.variavelCategoricaValor.update({
                    where: {
                        id: r.id,
                        removido_em: null,
                    },
                    data: {
                        titulo: r.titulo,
                        descricao: r.descricao,
                        ordem: r.ordem,
                        valor_variavel: r.valor_variavel,
                        atualizado_em: now,
                        atualizado_por: user.id,
                    },
                })
            );

            // se mudou o valor, atualiza os valores da série-variavel tbm
            if (rPrev.valor_variavel !== r.valor_variavel) {
                operations.push(
                    prismaTx.serieVariavel.updateMany({
                        where: {
                            variavel_categorica_id: variavel_categorica_id,
                            variavel_categorica_valor_id: rPrev.id,
                        },
                        data: {
                            valor_nominal: r.valor_variavel,
                            atualizado_em: now,
                            atualizado_por: user.id,
                        },
                    })
                );
                // todo atualizar o indicador.
            }
        }

        for (const r of created) {
            operations.push(
                prismaTx.variavelCategoricaValor.create({
                    data: {
                        titulo: r.titulo,
                        descricao: r.descricao,
                        ordem: r.ordem,
                        valor_variavel: r.valor_variavel,
                        variavel_categorica_id: variavel_categorica_id,
                        criado_em: now,
                        criado_por: user.id,
                    },
                })
            );
        }

        if (deleted.length > 0) {
            operations.push(
                prismaTx.variavelCategoricaValor.deleteMany({
                    where: {
                        id: { in: deleted },
                        variavel_categorica_id: variavel_categorica_id,
                        removido_em: null,
                    },
                })
            );
        }

        await Promise.all(operations);
        return;
    }
}
