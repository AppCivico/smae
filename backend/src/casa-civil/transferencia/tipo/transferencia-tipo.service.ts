import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { RecordWithId } from '../../../common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { TransferenciaTipoDto } from './entities/transferencia-tipo.dto';

@Injectable()
export class TransferenciaTipoService {
    constructor(private readonly prisma: PrismaService) {}

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
        await this.prisma.$transaction(async (): Promise<void> => {
            /*
                Valida se existe alguma classificação relacionada ao tipo que está sendo excluído
                para manter integridade referencial
            */
            const existsClassificacaoRelacionada = await this.prisma.classificacao.count({
                where: {
                    transferencia_tipo_id: id,
                    removido_em: null,
                },
            });
            if (existsClassificacaoRelacionada > 0)
                throw new HttpException('Tipo de Transferencia não pode ser removida pois está relacionada a classificações', 400);

            const existsTransferenciaRelacionada = await this.prisma.transferencia.count({
                where:{
                    tipo_id: id,
                    removido_em: null,
                }
            });

            const transferenciaTipo = await this.prisma.transferenciaTipo.findUnique({
                where: { id },
                select: { nome: true },
            });

            if (!transferenciaTipo) {
                throw new HttpException('Não foi possível excluir. Tipo de transferência não encontrado.', 400);
            }

            if(existsTransferenciaRelacionada > 0) {
                throw new HttpException(`Não foi possível excluir "${transferenciaTipo.nome}". Esse tipo já está sendo usado em alguma transferência`, 400);
            }

            await this.prisma.transferenciaTipo.update({
                where: { id },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });
        });
    }

}
