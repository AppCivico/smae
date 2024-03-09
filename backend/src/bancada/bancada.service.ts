import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBancadaDto } from './dto/create-bancada.dto';
import { BancadaDto, BancadaOneDto } from './entities/bancada.entity';
import { UpdateBancadaDto } from './dto/update-bancada.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PartidoService } from 'src/partido/partido.service';

@Injectable()
export class BancadaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly partidoService: PartidoService
    ) {}

    async create(dto: CreateBancadaDto, user?: PessoaFromJwt): Promise<RecordWithId> {
        const similarExists = await this.prisma.bancada.count({
            where: {
                nome: { endsWith: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

        if (dto.sigla) {
            const similarExists = await this.prisma.bancada.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (dto.partido_ids && dto.partido_ids.length > 0) await this.checkPartido(dto.partido_ids);

        const created = await this.prisma.bancada.create({
            data: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                ...dto,

                partidos: {
                    createMany: {
                        data:
                            dto.partido_ids && dto.partido_ids.length > 0
                                ? dto.partido_ids.map((p) => {
                                      return {
                                          partido_id: p,
                                      };
                                  })
                                : [],
                    },
                },
            },
            select: { id: true },
        });

        return created;
    }

    private async checkPartido(ids: number[]) {
        if (ids.length > 0) {
            const partidos = await this.partidoService.findAll();

            for (const id of ids) {
                if (!partidos.find((p) => p.id == id))
                    throw new HttpException(`partido_ids| partido ${id} inválido`, 400);
            }
        }
    }

    async findAll(): Promise<BancadaDto[]> {
        const listActive = await this.prisma.bancada.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                sigla: true,
                descricao: true,

                partidos: {
                    select: {
                        partido_id: true,
                    },
                },
            },
            orderBy: [{ sigla: 'asc' }],
        });
        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<BancadaOneDto> {
        const bancada = await this.prisma.bancada.findUniqueOrThrow({
            where: {
                id: id,
            },
            select: {
                id: true,
                nome: true,
                sigla: true,
                descricao: true,

                partidos: {
                    select: {
                        partido: {
                            select: {
                                id: true,
                                nome: true,
                                numero: true,
                                sigla: true,
                            },
                        },
                    },
                },
            },
        });

        return {
            ...bancada,
            partidos: bancada.partidos.map((b) => {
                return { ...b.partido };
            }),
        };
    }

    async update(id: number, dto: UpdateBancadaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const self = await this.findOne(id, user);

        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.bancada.count({
                where: {
                    nome: { endsWith: dto.nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (dto.sigla) {
            const similarExists = await this.prisma.orgao.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        if (dto.partido_ids && dto.partido_ids.length > 0 && dto.partido_ids.length != self.partidos.length) {
            await this.checkPartido(dto.partido_ids);

            await this.prisma.bancadaPartido.deleteMany({ where: { bancada_id: id } });
            await this.prisma.bancadaPartido.createMany({
                data: dto.partido_ids.map((partidoId) => {
                    return {
                        bancada_id: id,
                        partido_id: partidoId,
                    };
                }),
            });
        }

        await this.prisma.bancada.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                ...dto,
            },
        });

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO verificar dependentes

        const deleted = await this.prisma.bancada.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }
}
