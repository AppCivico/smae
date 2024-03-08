import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartidoDto } from './dto/create-partido.dto';
import { UpdatePartidoDto } from './dto/update-partido.dto';
import { BancadaService } from 'src/bancada/bancada.service';

@Injectable()
export class PartidoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly bancadaService: BancadaService
    ) { }

    async create(dto: CreatePartidoDto, user?: PessoaFromJwt) {
        const similarExists = await this.prisma.partido.count({
            where: {
                nome: { endsWith: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

        if (dto.sigla) {
            const similarExists = await this.prisma.partido.count({
                where: {
                    sigla: { endsWith: dto.sigla, mode: 'insensitive' },
                    removido_em: null,
                },
            });
            if (similarExists > 0)
                throw new HttpException('sigla| Sigla igual ou semelhante já existe em outro registro ativo', 400);
        }

        const similarNumeroExists = await this.prisma.partido.count({
            where: {
                numero: dto.numero,
                removido_em: null,
            },
        });
        if (similarNumeroExists > 0)
            throw new HttpException('número| Número igual já existe em outro registro ativo', 400);


        if (dto.bancadas_id != undefined && dto.bancadas_id.length > 0) {
            await this.validarBancadas(dto.bancadas_id);
        }

        const created = await this.prisma.partido.create({
            data: {
                criado_por: user ? user.id : undefined,
                criado_em: new Date(Date.now()),
                ...dto,

                bancadas: {
                    createMany: {
                        data: dto.bancadas_id ? dto.bancadas_id.map(b => { return { bancada_id: b } }) : []
                    }
                }
            },
            select: { id: true },
        });

        return created;
    }

    async findAll() {
        const listActive = await this.prisma.partido.findMany({
            where: {
                removido_em: null,
            },
            select: {
                id: true,
                nome: true,
                sigla: true,
                numero: true
            },
            orderBy: [{ sigla: 'asc' }],
        });
        return listActive;
    }

    async findOne(id: number, user: PessoaFromJwt) {
        return await this.prisma.partido.findUniqueOrThrow({
            where: {
                id: id,
            },
        });
    }

    async update(id: number, dto: UpdatePartidoDto, user: PessoaFromJwt) {
        const self = await this.prisma.partido.findFirst({
            where: { id, removido_em: null },
            select: {
                nome: true,
                numero: true,
                sigla: true,
                bancadas: {
                    select: {
                        bancada: {
                            select: {
                                id: true,
                            }
                        }
                    }
                }
            }
        });
        if (!self) throw new HttpException('Partido não encontrado', 404);

        // if (dto.bancadas_id != undefined && dto.bancadas_id.length > 0 && dto.bancadas_id !=)
        //     await this.validarBancadas(dto.bancadas_id);

        if (dto.nome !== undefined && self.nome !== dto.nome) {
            const similarExists = await this.prisma.partido.count({
                where: {
                    nome: { endsWith: dto.nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException(
                    'nome| Nome igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        if (dto.sigla && dto.sigla != self.sigla) {
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

        if (dto.numero && dto.numero !== self.numero) {
            const similarNumeroExists = await this.prisma.partido.count({
                where: {
                    numero: dto.numero,
                    removido_em: null,
                },
            });
            if (similarNumeroExists > 0)
                throw new HttpException('número| Número igual já existe em outro registro ativo', 400);
        }

        await this.prisma.partido.update({
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

        const deleted = await this.prisma.partido.updateMany({
            where: { id: id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });

        return deleted;
    }

    private async validarBancadas(ids: number[]) {
        for (const id of ids) {
            const existe = await this.bancadaService.bancadaExiste(id);
            if (!existe)
                throw new HttpException(`bancadas| Bancada ${id} inválida.`, 400);
        }
    }
}
