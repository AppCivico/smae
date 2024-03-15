import { HttpException, Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { Prisma } from '@prisma/client';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { TransferenciaTipoDto } from './entities/transferencia-tipo.dto';
import { CreateTransferenciaDto } from './dto/create-transferencia.dto';

@Injectable()
export class TransferenciaService {
    constructor(private readonly prisma: PrismaService) {}

    async createTransferencia(dto: CreateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const tipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: { id: dto.tipo_id, removido_em: null },
                });
                if (!tipoExiste) throw new HttpException('tipo_id| Tipo não encontrado.', 400);

                if (dto.parlamentar_id != undefined) {
                    const parlamentarExiste = await prismaTxn.parlamentar.count({
                        where: { id: dto.parlamentar_id, removido_em: null },
                    });

                    if (!parlamentarExiste) throw new HttpException('parlamentar_id| Parlamentar não encontrado.', 400);
                }

                if (dto.partido_id != undefined) {
                    const partidoExiste = await prismaTxn.partido.count({
                        where: { id: dto.partido_id, removido_em: null },
                    });

                    if (!partidoExiste) throw new HttpException('partido_id| Partido não encontrado.', 400);
                }

                const transferencia = await prismaTxn.transferencia.create({
                    data: {
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_id: dto.secretaria_concedente_id,
                        partido_id: dto.partido_id,
                        parlamentar_id: dto.parlamentar_id,
                        objeto: dto.objeto,
                        critico: dto.critico,
                        interface: dto.interface,
                        esfera: dto.esfera,
                        identificador: dto.identificador,
                        clausula_suspensiva: dto.clausula_suspensiva,
                        clausula_suspensiva_vencimento: dto.clausula_suspensiva_vencimento,
                        ano: dto.ano,
                        emenda: dto.emenda,
                        demanda: dto.demanda,
                        programa: dto.programa,
                        normativa: dto.normativa,
                        observacoes: dto.observacoes,
                        detalhamento: dto.detalhamento,
                        nome_programa: dto.nome_programa,
                        agencia_aceite: dto.agencia_aceite,
                        emenda_unitaria: dto.emenda_unitaria,
                        numero_identificacao: dto.numero_identificacao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferencia;
            }
        );

        return created;
    }

    async createTransferenciaTipo(dto: CreateTransferenciaTipoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const transferenciaTipo = await prismaTxn.transferenciaTipo.create({
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferenciaTipo;
            }
        );

        return created;
    }

    async findAllTransferenciaTipo(): Promise<TransferenciaTipoDto[]> {
        const rows = await this.prisma.transferenciaTipo.findMany({
            where: { removido_em: null },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                categoria: true,
                esfera: true,
            },
        });

        return rows;
    }

    async updateTransferenciaTipo(
        id: number,
        dto: UpdateTransferenciaTipoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipo = await prismaTxn.transferenciaTipo.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        nome: true,
                        categoria: true,
                        esfera: true,
                    },
                });

                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: transferenciaTipo.nome, mode: 'insensitive' },
                        categoria: transferenciaTipo.categoria,
                        esfera: transferenciaTipo.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 1) throw new HttpException('Já existe um registro com estes campos.', 400);

                return { id };
            }
        );

        return updated;
    }

    async removeTransferenciaTipo(id: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaTipo.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
