import { HttpException, Injectable, Logger } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTipoAcompanhamentoDto } from './dto/create-acompanhamento-tipo.dto';
import { UpdateAcompanhamentoTipoDto } from './dto/update-acompanhamento-tipo.dto';
import { AcompanhamentoTipo } from './entities/acompanhament-tipo.entities.dto';
import { TipoProjeto } from 'src/generated/prisma/client';

@Injectable()
export class AcompanhamentoTipoService {
    private readonly logger = new Logger(AcompanhamentoTipoService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(tipo: TipoProjeto, dto: CreateTipoAcompanhamentoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const tipoJaExiste = await this.prisma.acompanhamentoTipo.count({
            where: { nome: dto.nome, removido_em: null, tipo_projeto: tipo },
        });
        if (tipoJaExiste) throw new Error('Já existe um tipo de acompanhamento com este nome.');

        const acompanhamentoTipo = await this.prisma.acompanhamentoTipo.create({
            data: {
                nome: dto.nome,
                tipo_projeto: tipo,
                criado_em: new Date(Date.now()),
                criado_por: user.id,
            },
            select: { id: true },
        });

        return { id: acompanhamentoTipo.id };
    }

    async findAll(tipo: TipoProjeto, user: PessoaFromJwt): Promise<AcompanhamentoTipo[]> {
        const acompanhamentoTipoRows = await this.prisma.acompanhamentoTipo.findMany({
            where: { removido_em: null, tipo_projeto: tipo },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
            },
        });

        return acompanhamentoTipoRows;
    }

    async update(
        tipo: TipoProjeto,
        id: number,
        dto: UpdateAcompanhamentoTipoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.prisma.acompanhamentoTipo.update({
            where: { id, tipo_projeto: tipo },
            data: {
                nome: dto.nome,
                atualizado_em: new Date(Date.now()),
                atualizado_por: user.id,
            },
            select: { id: true },
        });
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt): Promise<void> {
        await this.prisma.$transaction(async (prismaTx) => {
            // Se o tipo de acompanhamento estiver associado a algum projeto, não pode ser removido
            const tipoAcompanhamentoAssociado = await prismaTx.projetoAcompanhamento.count({
                where: { acompanhanmento_tipo_id: id, removido_em: null },
            });
            if (tipoAcompanhamentoAssociado) {
                throw new HttpException('Tipo de acompanhamento associado à um projeto, não pode ser removido.', 400);
            }

            return await prismaTx.acompanhamentoTipo.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });

        return;
    }
}
