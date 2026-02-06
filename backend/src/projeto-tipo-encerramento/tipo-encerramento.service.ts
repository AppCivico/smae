import { HttpException, Injectable } from '@nestjs/common';
import { TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateTipoEncerramentoDto,
    FilterTipoEncerramentoDto,
    UpdateTipoEncerramentoDto,
} from './dto/tipo-encerramento.dto';

@Injectable()
export class TipoEncerramentoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoProjeto, dto: CreateTipoEncerramentoDto, user?: PessoaFromJwt) {
        const similarExists = await this.prisma.projetoTipoEncerramento.count({
            where: {
                tipo: tipo,
                descricao: { endsWith: dto.descricao, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.projetoTipoEncerramento.create({
            data: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                descricao: dto.descricao,
                tipo: tipo,
                habilitar_info_adicional: dto.habilitar_info_adicional ?? false,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(tipo: TipoProjeto, filters: FilterTipoEncerramentoDto) {
        const listActive = await this.prisma.projetoTipoEncerramento.findMany({
            where: {
                tipo: tipo,
                removido_em: null,
                id: filters.id,
            },
            select: { id: true, descricao: true, habilitar_info_adicional: true },
            orderBy: { descricao: 'asc' },
        });

        return listActive;
    }

    async update(tipo: TipoProjeto, id: number, dto: UpdateTipoEncerramentoDto, user: PessoaFromJwt) {
        const self = await this.prisma.projetoTipoEncerramento.findFirst({
            where: { id: id, tipo: tipo, removido_em: null },
            select: { id: true, habilitar_info_adicional: true },
        });
        if (!self) throw new HttpException('Tipo de encerramento não encontrado', 404);

        if (dto.descricao !== undefined) {
            const similarExists = await this.prisma.projetoTipoEncerramento.count({
                where: {
                    tipo: tipo,
                    descricao: { endsWith: dto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (self.habilitar_info_adicional && !dto.habilitar_info_adicional) {
            // check if no termoEncaerramento
            const count = await this.prisma.projetoTermoEncerramento.count({
                where: {
                    justificativa_id: id,
                    removido_em: null,
                    ultima_versao: true,
                },
            });
            if (count > 0) {
                throw new HttpException(
                    'Não é possível desabilitar a informação adicional: existem termos de encerramento que a utilizam.',
                    400
                );
            }
        }

        await this.prisma.projetoTipoEncerramento.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...dto,
            },
        });

        return { id };
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.projetoTipoEncerramento.findFirst({
            where: { id: id, tipo: tipo, removido_em: null },
            select: { id: true },
        });
        if (!self) throw new HttpException('Tipo de encerramento não encontrado', 404);

        // aguardar outra tabela de dependência
        //        const existsDown = await this.prisma.orgao.count({
        //            where: { tipo_orgao_id: id, removido_em: null },
        //        });
        //        if (existsDown > 0)
        //            throw new HttpException(`Não é possível remover: Há ${existsDown} órgão(ãos) dependentes.`, 400);

        const created = await this.prisma.projetoTipoEncerramento.updateMany({
            where: { id: id, tipo: tipo, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return created;
    }
}
