import { HttpException, Injectable } from '@nestjs/common';
import { ModuloSistema, Prisma } from 'src/generated/prisma/client';
import { GetDomainFromUrl } from '../auth/models/GetDomainFromUrl';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePainelExternoDto } from './dto/create-painel-externo.dto';
import { FilterPainelExternoDto } from './dto/filter-painel-externo.dto';
import { UpdatePainelExternoDto } from './dto/update-painel-externo.dto';
import { PainelExternoDto } from './entities/painel-externo.entity';

@Injectable()
export class PainelExternoService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreatePainelExternoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('criar', 'painel externo');
        const similarExists = await this.prisma.painelExterno.count({
            where: {
                modulo_sistema: sistema,
                titulo: { equals: dto.titulo, mode: 'insensitive' },
                removido_em: null,
            },
        });

        if (similarExists > 0)
            throw new HttpException('descricao| Nome igual ou semelhante já existe em outro registro ativo', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const painel = await prismaTx.painelExterno.create({
                    data: {
                        modulo_sistema: sistema,
                        criado_por: user.id,
                        criado_em: now,
                        descricao: dto.descricao,
                        link: dto.link,
                        link_dominio: GetDomainFromUrl(dto.link),
                        titulo: dto.titulo,
                    },
                    select: { id: true },
                });

                if (Array.isArray(dto.grupos) && dto.grupos.length > 0) {
                    for (const grupoPortId of dto.grupos) {
                        const pe = await prismaTx.grupoPainelExterno.findFirstOrThrow({
                            where: {
                                removido_em: null,
                                modulo_sistema: sistema,
                                id: grupoPortId,
                            },
                            select: { id: true },
                        });

                        await prismaTx.painelExternoGrupoPainelExterno.create({
                            data: {
                                painel_externo_id: painel.id,
                                criado_em: now,
                                criado_por: user.id,
                                grupo_painel_externo_id: pe.id,
                            },
                        });
                    }
                }

                return painel;
            }
        );

        return created;
    }

    async findAll(filters: FilterPainelExternoDto, user: PessoaFromJwt): Promise<PainelExternoDto[]> {
        const rows = await this.prisma.painelExterno.findMany({
            where: {
                id: filters.id,
                removido_em: null,
                modulo_sistema: { in: ['SMAE', ...user.modulo_sistema] },
            },
            select: {
                id: true,
                titulo: true,
                descricao: true,
                link: true,
                PainelExternoGrupoPainelExterno: {
                    where: { removido_em: null },
                    select: {
                        grupo_painel_externo_id: true,
                    },
                },
            },
            orderBy: { titulo: 'asc' },
        });

        return rows.map((r) => {
            return {
                ...{ ...r, PainelExternoGrupoPainelExterno: undefined },
                grupos: r.PainelExternoGrupoPainelExterno.map((rr) => rr.grupo_painel_externo_id),
            };
        });
    }

    async update(id: number, dto: UpdatePainelExternoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('editar', 'painel externo');

        if (dto.titulo) {
            const similarExists = await this.prisma.painelExterno.count({
                where: {
                    titulo: { equals: dto.titulo, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });

            if (similarExists > 0)
                throw new HttpException('descricao| Nome igual ou semelhante já existe em outro registro', 400);
        }

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const painel = await prismaTx.painelExterno.update({
                where: {
                    id: id,
                },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    modulo_sistema: sistema,
                    descricao: dto.descricao,
                    link: dto.link,
                    link_dominio: dto.link ? GetDomainFromUrl(dto.link) : undefined,
                    titulo: dto.titulo,
                },
                select: { id: true },
            });

            await this.upsertGruposPainelExterno(prismaTx, painel, dto, now, user, sistema);

            return painel;
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        const sistema = user.assertOneModuloSistema('remover', 'painel externo');

        await this.prisma.painelExterno.updateMany({
            where: { id: id, removido_em: null, modulo_sistema: sistema },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return;
    }

    private async upsertGruposPainelExterno(
        prismaTx: Prisma.TransactionClient,
        row: { id: number },
        dto: UpdatePainelExternoDto,
        now: Date,
        user: PessoaFromJwt,
        sistema: ModuloSistema
    ) {
        if (!Array.isArray(dto.grupos)) return;

        const prevVersions = await prismaTx.painelExternoGrupoPainelExterno.findMany({
            where: {
                removido_em: null,
                painel_externo_id: row.id,
            },
        });

        for (const grupoPainelId of dto.grupos) {
            if (prevVersions.filter((r) => r.grupo_painel_externo_id == grupoPainelId)[0]) continue;

            const gp = await prismaTx.grupoPainelExterno.findFirstOrThrow({
                where: {
                    removido_em: null,
                    modulo_sistema: sistema,
                    id: grupoPainelId,
                },
                select: { id: true },
            });

            await prismaTx.painelExternoGrupoPainelExterno.create({
                data: {
                    grupo_painel_externo_id: gp.id,
                    criado_em: now,
                    criado_por: user.id,
                    painel_externo_id: row.id,
                },
            });
        }

        for (const prevPainelRow of prevVersions) {
            // pula as que continuam na lista
            if (dto.grupos.filter((r) => r == prevPainelRow.grupo_painel_externo_id)[0]) continue;

            // remove o relacionamento
            await prismaTx.painelExternoGrupoPainelExterno.update({
                where: {
                    id: prevPainelRow.id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                    removido_por: user.id,
                },
            });
        }
    }
}
