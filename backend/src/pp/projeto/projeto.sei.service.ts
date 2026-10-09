import { BadRequestException, HttpException, Injectable } from '@nestjs/common';

import { Prisma, TipoProjeto } from '@prisma/client';
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
            throw new HttpException(`Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`,
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

        const contratoSei = projetosSei.length ? await this.contratoSeiDoProjeto(this.prisma, projeto.id) : [];

        return projetosSei.map((registro) => {
            return {
                ...registro,
                contratos: contratoSei
                    .filter((r) => r.processo_sei === registro.processo_sei)
                    .map((r) => r.contrato)
                    // o mesmo número pode constar duas vezes no contrato (com e sem máscara)
                    .filter((contrato, idx, lista) => lista.findIndex((c) => c.id === contrato.id) === idx),
            };
        });
    }

    /**
     * Processos SEI em uso nos contratos ativos vinculados ao projeto/obra.
     *
     * `contrato_sei.numero_sei` é texto livre, sem FK para `projeto_registro_sei`, e há linhas antigas
     * gravadas com máscara (`6012.2023/0019359-0`); por isso a comparação é sempre feita só pelos dígitos.
     */
    private async contratoSeiDoProjeto(prismaTx: Prisma.TransactionClient, projeto_id: number) {
        const linhas = await prismaTx.contratoSei.findMany({
            where: {
                contrato: {
                    removido_em: null,
                    ContratoProjeto: { some: { projeto_id: projeto_id, removido_em: null } },
                },
            },
            orderBy: [{ contrato: { numero: 'asc' } }],
            select: {
                id: true,
                numero_sei: true,
                contrato: { select: { id: true, numero: true } },
            },
        });

        return linhas.map((linha) => {
            return {
                id: linha.id,
                processo_sei: linha.numero_sei.replace(/[^0-9]/g, ''),
                contrato: linha.contrato,
            };
        });
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
                throw new HttpException(`Já existe um registro do processo SEI ${dto.processo_sei} para este projeto`,
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
            throw new HttpException(`Processo SEI não pode ser alterado, pois foi criado pelo sistema.`,
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
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            const self = await prismaTx.projetoRegistroSei.findFirstOrThrow({
                where: {
                    projeto_id: projeto.id,
                    projeto: { tipo: tipo, id: projeto.id },
                    id: seiID,
                    removido_em: null,
                },
            });
            if (self.categoria !== 'Manual')
                throw new HttpException(`Processo SEI não pode ser removido, pois foi criado pelo sistema.`,
                    400
                );

            await prismaTx.projetoRegistroSei.update({
                where: {
                    id: seiID,
                },
                data: {
                    removido_em: new Date(Date.now()),
                    removido_por: user.id,
                },
            });

            // O formulário do contrato só oferece os processos cadastrados no projeto/obra. Se o número
            // continuasse no contrato, apareceria na lista/resumo sem poder ser retirado pela edição.
            // Em contrato compartilhado a remoção vale para todas as obras/projetos, como qualquer
            // outra alteração feita no contrato.
            const emUso = (await this.contratoSeiDoProjeto(prismaTx, projeto.id)).filter(
                (r) => r.processo_sei === self.processo_sei
            );
            if (emUso.length)
                await prismaTx.contratoSei.deleteMany({ where: { id: { in: emUso.map((r) => r.id) } } });
        });
    }
}
