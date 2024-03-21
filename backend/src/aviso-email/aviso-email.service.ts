import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvisoEmailDto } from './dto/create-aviso-email.dto';
import { UpdateAvisoEmailDto } from './dto/update-aviso-email.dto';
import { AvisoEmailItemDto, FilterAvisoEamilDto } from './entities/aviso-email.entity';

@Injectable()
export class AvisoEmailService {
    private readonly logger = new Logger(AvisoEmailService.name);
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateAvisoEmailDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const tarefa_cronograma_id = await this.resolveCronoEtapaId(dto);

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const exists = await prismaTx.avisoEmail.create({
                    data: {
                        tarefa_cronograma_id,
                        ativo: dto.ativo,
                        numero: dto.numero,
                        numero_periodo: dto.numero_periodo,
                        tipo: dto.tipo,
                        com_copia: dto.com_copia,
                        recorrencia_dias: dto.recorrencia_dias,
                    },
                });

                return { id: exists.id };
            }
        );

        return { id: created.id };
    }

    private async resolveCronoEtapaId(dto: {
        tarefa_cronograma_id?: number;
        projeto_id?: number;
        transferencia_id?: number;
    }) {
        let tarefa_cronograma_id = dto.tarefa_cronograma_id;
        if (!tarefa_cronograma_id) {
            if (dto.projeto_id) {
                const tmp = await this.prisma.tarefaCronograma.findFirstOrThrow({
                    where: { removido_em: null, projeto_id: dto.projeto_id },
                    select: { id: true },
                });
                tarefa_cronograma_id = tmp.id;
            }
            if (dto.transferencia_id) {
                const tmp = await this.prisma.tarefaCronograma.findFirstOrThrow({
                    where: { removido_em: null, projeto_id: dto.transferencia_id },
                    select: { id: true },
                });
                tarefa_cronograma_id = tmp.id;
            }
        }
        if (!tarefa_cronograma_id) throw new BadRequestException('Faltando tarefa_cronograma_id');
        return tarefa_cronograma_id;
    }

    async findAll(filter: FilterAvisoEamilDto, user: PessoaFromJwt): Promise<AvisoEmailItemDto[]> {
        const tarefa_cronograma_id = filter.id ? undefined : await this.resolveCronoEtapaId(filter);

        const rows = await this.prisma.avisoEmail.findMany({
            where: {
                id: filter.id,
                tarefa_cronograma_id: tarefa_cronograma_id,
                removido_em: null,
            },
            include: {
                tarefa: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },
                tarefa_cronograma: {
                    select: {
                        projeto: {
                            select: { id: true, nome: true },
                        },
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        // os dois any abaixo são por causa que o Prisma não gera a tipagem por causa do ternário do filter.retornar_uso
        return rows.map((r) => {
            return {
                id: r.id,
                ativo: r.ativo,
                com_copia: r.com_copia,
                numero: r.numero,
                numero_periodo: r.numero_periodo,
                recorrencia_dias: r.recorrencia_dias,
                tipo: r.tipo,

                projeto: null,
                tarefa: null,
            };
        });
    }

    async update(id: number, dto: UpdateAvisoEmailDto, user: PessoaFromJwt): Promise<RecordWithId> {
        // TODO: verificar permissões e etc. isso aqui é só o mínimo possível
        const exists = await this.prisma.tarefaCronograma.findFirst({
            where: {
                id,
            },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Item não encontrado');

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.avisoEmail.update({
                where: {
                    id: exists.id,
                },
                data: {
                    ativo: dto.ativo,
                    numero: dto.numero,
                    numero_periodo: dto.numero_periodo,
                    tipo: dto.tipo,
                    com_copia: dto.com_copia,
                    recorrencia_dias: dto.recorrencia_dias,
                },
            });

            return;
        });

        return { id: exists.id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO: verificar permissões e etc. isso aqui é só o mínimo possível
        const exists = await this.prisma.tarefaCronograma.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        if (!exists) return;

        await this.prisma.tarefaCronograma.updateMany({
            where: {
                id,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }
}
