import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilAcessoDto, PerfilAcessoSimplesDto, UpdatePerfilAcessoDto } from './models/PerfilAcesso.dto';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class PerfilAcessoService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreatePerfilAcessoDto, user: PessoaFromJwt) {
        const similarExists = await this.prisma.perfilAcesso.count({
            where: {
                nome: { endsWith: dto.nome, mode: 'insensitive' },
                removido_em: null,
            },
        });
        if (similarExists > 0)
            throw new HttpException('fonte| Nome igual ou semelhante já existe em outro registro ativo', 400);

        const created = await this.prisma.perfilAcesso.create({
            data: {
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                nome: dto.nome,
                autogerenciavel: false,
                perfil_privilegio: {
                    createMany: {
                        data: dto.privilegios.map((p) => {
                            return { privilegio_id: p };
                        }),
                    },
                },
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(): Promise<PerfilAcessoSimplesDto[]> {
        const listActive = await this.prisma.perfilAcesso.findMany({
            where: {
                removido_em: null,
                nome: { not: 'SYSADMIN' },
            },
            select: {
                id: true,
                nome: true,
                autogerenciavel: true,
                perfil_privilegio: true,
            },
            orderBy: { nome: 'asc' },
        });
        return listActive.map((r) => {
            return {
                id: r.id,
                nome: r.nome,
                autogerenciavel: r.autogerenciavel,
                privilegios: r.perfil_privilegio.map((x) => x.privilegio_id),
            };
        });
    }

    async update(id: number, dto: UpdatePerfilAcessoDto, user: PessoaFromJwt) {
        if (dto.nome !== undefined) {
            const similarExists = await this.prisma.perfilAcesso.count({
                where: {
                    nome: { endsWith: dto.nome, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException('fonte| Nome igual ou semelhante já existe em outro registro ativo', 400);
        }

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                await prismaTx.perfilAcesso.update({
                    where: {
                        id: id,
                        autogerenciavel: false,
                    },
                    data: {
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                        nome: dto.nome,
                    },
                });

                if (Array.isArray(dto.privilegios) && dto.privilegios) {
                    const currentPrivileges = await prismaTx.perfilAcesso
                        .findUnique({
                            where: { id: id },
                            include: {
                                perfil_privilegio: { select: { privilegio_id: true } },
                            },
                        })
                        .then((profile) => profile?.perfil_privilegio.map((p) => p.privilegio_id) || []);

                    const privilegesToRemove = currentPrivileges.filter((p) => !dto.privilegios!.includes(p));
                    const privilegesToAdd = dto.privilegios.filter((p) => !currentPrivileges.includes(p));

                    if (privilegesToRemove.length)
                        await prismaTx.perfilPrivilegio.deleteMany({
                            where: {
                                perfil_acesso_id: id,
                                privilegio_id: {
                                    in: privilegesToRemove,
                                },
                            },
                        });

                    if (privilegesToAdd.length)
                        await prismaTx.perfilPrivilegio.createMany({
                            data: privilegesToAdd.map((p) => ({
                                perfil_acesso_id: id,
                                privilegio_id: p,
                            })),
                        });
                }
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return { id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                const peopleUsing = await prismaTx.pessoaPerfil.findMany({
                    where: {
                        perfil_acesso_id: id,
                    },
                    select: {
                        pessoa: { select: { nome_exibicao: true } },
                    },
                });
                if (peopleUsing.length)
                    throw new BadRequestException(
                        `Não é passível remover o perfil, há ${peopleUsing.length} pessoa(s) com o perfil em uso. Utilizando por: ${peopleUsing.map((r) => r.pessoa.nome_exibicao).join(', ')}`
                    );

                await prismaTx.perfilAcesso.updateMany({
                    where: {
                        id: id,
                        autogerenciavel: false,
                    },
                    data: {
                        removido_por: user.id,
                        removido_em: new Date(Date.now()),
                    },
                });
            },
            {
                isolationLevel: 'Serializable',
            }
        );

        return;
    }
}
