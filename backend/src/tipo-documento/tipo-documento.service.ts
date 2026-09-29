import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipoDocumentoDto } from './dto/create-tipo-documento.dto';
import { UpdateTipoDocumentoDto } from './dto/update-tipo-documento.dto';

@Injectable()
export class TipoDocumentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(createTipoDocumentoDto: CreateTipoDocumentoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.tipoDocumento.count({
            where: {
                descricao: { endsWith: createTipoDocumentoDto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.tipoDocumento.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                ...createTipoDocumentoDto,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.tipoDocumento.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                descricao: true,
                extensoes: true,
                titulo: true,
                codigo: true,
            },
            orderBy: { codigo: 'asc' },
        });
        return listActive;
    }

    async update(id: number, updateTipoDocumentoDto: UpdateTipoDocumentoDto, user: PessoaFromJwt) {
        if (updateTipoDocumentoDto.descricao !== undefined) {
            const similarExists = await this.prisma.tipoDocumento.count({
                where: {
                    descricao: { endsWith: updateTipoDocumentoDto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        await this.prisma.tipoDocumento.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...updateTipoDocumentoDto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const emUso: Prisma.ArquivoWhereInput = {
            tipo_documento_id: id,
            OR: [
                { Pdm: { some: { removido_em: null } } },
                { VariavelGlobalCicloDocumento: { some: { removido_em: null } } },
                { projeto_documentos: { some: { removido_em: null } } },
            ],
        };

        const documentos = await this.prisma.arquivo.count({ where: emUso });
        if (documentos > 0) {
            const arquivo = await this.prisma.arquivo.findFirst({
                where: emUso,
                orderBy: { id: 'asc' },
                select: {
                    Pdm: {
                        where: { removido_em: null },
                        select: { id: true, nome: true, tipo: true },
                    },
                    VariavelGlobalCicloDocumento: {
                        where: { removido_em: null },
                        select: { id: true, variavel: { select: { codigo: true, titulo: true } } },
                    },
                    projeto_documentos: {
                        where: { removido_em: null },
                        select: { id: true, projeto: { select: { codigo: true, nome: true, tipo: true } } },
                    },
                },
            });

            const usageDetails: string[] = [];

            if (arquivo) {
                if (arquivo.Pdm?.length) {
                    usageDetails.push(
                        `${arquivo.Pdm.map(
                            (pdm) => `${pdm.tipo === 'PDM' ? 'Programa de Meta' : 'Plano Setorial'} ${pdm.nome}`
                        ).join(', ')}`
                    );
                }

                if (arquivo.VariavelGlobalCicloDocumento?.length) {
                    usageDetails.push(
                        `${arquivo.VariavelGlobalCicloDocumento.map(
                            (v) => `Variável ${v.variavel.codigo} - ${v.variavel.titulo}`
                        ).join(', ')}`
                    );
                }

                if (arquivo.projeto_documentos?.length) {
                    usageDetails.push(
                        `${arquivo.projeto_documentos
                            .map(
                                (p) =>
                                    `${
                                        p.projeto.tipo == 'MDO' ? 'Obra' : 'Projeto'
                                    } ${p.id} (${p.projeto.codigo} - ${p.projeto.nome})`
                            )
                            .join(', ')}`
                    );
                }
            }

            const errorMessage = 'O Tipo de Documento não pode ser removido pois está em uso';
            throw new HttpException(
                usageDetails.length > 0
                    ? `${errorMessage} nos seguintes registros: ${usageDetails.join('; ')}.`
                    : `${errorMessage}.`,
                400
            );
        }

        const created = await this.prisma.tipoDocumento.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
