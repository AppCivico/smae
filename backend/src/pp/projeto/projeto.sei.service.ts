import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

import { TipoProjeto } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjetoSeiDto } from './dto/create-projeto.dto';
import { UpdateProjetoRegistroSeiDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoSeiDto } from './entities/projeto.entity';

@Injectable()
export class ProjetoSeiService {
    constructor(private readonly prisma: PrismaService) {}

    async append_sei(tipo: TipoProjeto, projeto: ProjetoDetailDto, dto: CreateProjetoSeiDto, user: PessoaFromJwt) {
        dto.processo_sei = dto.processo_sei.replace(/[^0-9]/g, '');

        this.validaSeiSinproc(dto, tipo);

        const existenteProjetoSei = await this.prisma.projetoRegistroSei.count({
            where: {
                projeto_id: projeto.id,
                processo_sei: dto.processo_sei,
                removido_em: null,
                projeto: { tipo: tipo, id: projeto.id },
            },
        });

        if (existenteProjetoSei > 0)
            throw new HttpException(
                `processo_sei| Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`,
                400
            );

        const projetoSei = await this.prisma.projetoRegistroSei.create({
            data: {
                projeto_id: projeto.id,
                ...dto,
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                categoria: 'Manual',
            },
            select: { id: true },
        });

        return { id: projetoSei.id };
    }

    private validaSeiSinproc(dto: CreateProjetoSeiDto | UpdateProjetoRegistroSeiDto, tipo: string) {
        // SINPROC só pode ser cadastrado em MDO
        if (dto.processo_sei && dto.processo_sei.length == 12 && tipo !== 'MDO')
            throw new BadRequestException('O processo SEI informado não é válido.');
    }

    async list_sei(
        tipo: TipoProjeto,
        projeto: ProjetoDetailDto,
        user: PessoaFromJwt,
        filterId: number | undefined = undefined
    ): Promise<ProjetoSeiDto[]> {
        const projetosSei = await this.prisma.projetoRegistroSei.findMany({
            where: {
                projeto_id: projeto.id,
                projeto: { tipo: tipo, id: projeto.id },
                removido_em: null,
                id: filterId,
            },
            select: {
                id: true,
                categoria: true,
                processo_sei: true,
                descricao: true,
                link: true,
                comentarios: true,
                observacoes: true,
                criador: { select: { id: true, nome_exibicao: true } },
            },
            orderBy: [{ criado_em: 'desc' }],
        });

        return projetosSei;
    }

    async update_sei(
        tipo: TipoProjeto,
        projeto: ProjetoDetailDto,
        seiID: number,
        dto: UpdateProjetoRegistroSeiDto,
        user: PessoaFromJwt
    ) {
        if (dto.processo_sei) {
            dto.processo_sei = dto.processo_sei.replace(/[^0-9]/g, '');

            this.validaSeiSinproc(dto, tipo);

            const existenteProjetoSei = await this.prisma.projetoRegistroSei.count({
                where: {
                    projeto_id: projeto.id,
                    projeto: { tipo: tipo, id: projeto.id },
                    processo_sei: dto.processo_sei,
                    removido_em: null,
                    id: {
                        not: seiID,
                    },
                },
            });

            if (existenteProjetoSei > 0)
                throw new HttpException(
                    `processo_sei| Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`,
                    400
                );
        }

        const self = await this.prisma.projetoRegistroSei.findFirstOrThrow({
            where: {
                projeto_id: projeto.id,
                projeto: { tipo: tipo, id: projeto.id },
                id: seiID,
                removido_em: null,
            },
        });
        if (self.categoria !== 'Manual')
            throw new HttpException(
                `processo_sei| Processo SEI não pode ser alterado, pois foi criado pelo sistema.`,
                400
            );

        await this.prisma.projetoRegistroSei.updateMany({
            where: {
                projeto_id: projeto.id,
                id: seiID,
            },
            data: {
                ...dto,
                atualizado_em: new Date(Date.now()),
                atualizado_por: user.id,
            },
        });

        return { id: seiID };
    }

    async remove_sei(tipo: TipoProjeto, projeto: ProjetoDetailDto, seiID: number, user: PessoaFromJwt) {
        const self = await this.prisma.projetoRegistroSei.findFirstOrThrow({
            where: {
                projeto_id: projeto.id,
                projeto: { tipo: tipo, id: projeto.id },
                id: seiID,
                removido_em: null,
            },
        });
        if (self.categoria !== 'Manual')
            throw new HttpException(
                `processo_sei| Processo SEI não pode ser removido, pois foi criado pelo sistema.`,
                400
            );

        await this.prisma.projetoRegistroSei.update({
            where: {
                id: seiID,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }
}
