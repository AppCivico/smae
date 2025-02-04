import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoPainelExternoDto } from './dto/create-grupo-externo.dto';
import { FilterGrupoPainelExternoDto, GrupoPainelExternoItemDto } from './entities/grupo-externo.entity';
import { UpdateGrupoPainelExternoDto } from './dto/update-grupo-externo.dto';
import { PessoaPrivilegioService } from '../auth/pessoaPrivilegio.service';

@Injectable()
export class GrupoPainelExternoService {
    private readonly logger = new Logger(GrupoPainelExternoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaPrivService: PessoaPrivilegioService
    ) {}

    async create(dto: CreateGrupoPainelExternoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('criar', 'grupo de painel externo');
        const orgao_id = dto.orgao_id ? dto.orgao_id : user.orgao_id;

        if (!orgao_id) throw new BadRequestException('Não foi possível determinar o órgão');

        if (!user.hasSomeRoles(['CadastroGrupoPainelExterno.administrador'])) {
            if (orgao_id != user.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para criar Grupo de Painel Externo no mesmo órgão.'
                );
        }

        // verificando se órgão não foi removido
        const orgao = await this.prisma.orgao.findFirst({
            where: {
                id: orgao_id,
                removido_em: null,
            },
        });
        if (!orgao) throw new BadRequestException('Órgão não encontrado.');

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const exists = await prismaTx.grupoPainelExterno.count({
                    where: {
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.espectador_de_painel_externo'],
                    dto.participantes
                );
                for (const pessoaId of dto.participantes) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser participante do grupo.`);
                }

                const gp = await prismaTx.grupoPainelExterno.create({
                    data: {
                        orgao_id,
                        titulo: dto.titulo,
                        modulo_sistema: sistema,
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                    },
                    select: { id: true },
                });

                await prismaTx.grupoPainelExternoPessoa.createMany({
                    data: dto.participantes.map((pessoaId) => {
                        const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_painel_externo_id: gp.id,
                            criado_por: user.id,
                            orgao_id: pessoa.orgao_id,
                            pessoa_id: pessoa.pessoa_id,
                        };
                    }),
                });

                return { id: gp.id };
            }
        );

        return { id: created.id };
    }

    async findAll(filter: FilterGrupoPainelExternoDto, user: PessoaFromJwt): Promise<GrupoPainelExternoItemDto[]> {
        const rows = await this.prisma.grupoPainelExterno.findMany({
            where: {
                id: filter.id,
                removido_em: null,
                modulo_sistema: { in: ['SMAE', ...user.modulo_sistema] },
            },
            include: {
                GrupoPainelExternoPessoa: {
                    where: {
                        removido_em: null,
                    },
                    orderBy: [
                        {
                            pessoa: {
                                nome_exibicao: 'asc',
                            },
                        },
                    ],
                    select: {
                        pessoa: {
                            select: {
                                nome_exibicao: true,
                                id: true,
                            },
                        },
                    },
                },
                PainelExternoGrupoPainelExterno: filter.retornar_uso
                    ? {
                          where: {
                              removido_em: null,
                          },
                          include: {
                              PainelExterno: {
                                  select: {
                                      id: true,
                                      titulo: true,
                                  },
                              },
                          },
                      }
                    : undefined,
            },
            orderBy: { titulo: 'asc' },
        });

        // os dois any abaixo são por causa que o Prisma não gera a tipagem por causa do ternário do filter.retornar_uso
        return rows.map((r) => {
            return {
                id: r.id,
                titulo: r.titulo,
                criado_em: r.criado_em,
                orgao_id: r.orgao_id,
                paineis: filter.retornar_uso ? r.PainelExternoGrupoPainelExterno.map((p: any) => p.PainelExterno) : [],
                participantes: r.GrupoPainelExternoPessoa.map((p) => p.pessoa),
            };
        });
    }

    async update(id: number, dto: UpdateGrupoPainelExternoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('editar', 'grupo de painel externo');
        const gp = await this.prisma.grupoPainelExterno.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                orgao_id: true,
            },
        });

        if (!gp) throw new NotFoundException('Grupo Painel Externo não foi encontrado.');

        if (!user.hasSomeRoles(['CadastroGrupoPainelExterno.administrador'])) {
            if (user.orgao_id != gp.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para editar Grupo de Painel Externo no mesmo órgão.'
                );
        }

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            if (dto.orgao_id && dto.orgao_id != gp.orgao_id) {
                // verificando se órgão não foi removido
                const orgao = await this.prisma.orgao.findFirst({
                    where: {
                        id: dto.orgao_id,
                        removido_em: null,
                    },
                });
                if (!orgao) throw new BadRequestException('Órgão não encontrado.');
            }

            if (dto.titulo) {
                const exists = await prismaTx.grupoPainelExterno.count({
                    where: {
                        NOT: { id: gp.id },
                        modulo_sistema: sistema,
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');
            }

            if (dto.participantes) {
                const prevVersion = await prismaTx.grupoPainelExterno.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoPainelExternoPessoa: {
                            where: {
                                removido_em: null,
                            },
                            select: { pessoa_id: true },
                        },
                    },
                });

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.espectador_de_painel_externo'],
                    dto.participantes
                );

                const keptRecord: number[] = prevVersion?.GrupoPainelExternoPessoa.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.participantes.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        this.logger.log(`participante removido: ${pessoaId}`);
                        await prismaTx.grupoPainelExternoPessoa.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_painel_externo_id: gp.id,
                                removido_em: null,
                            },
                            data: {
                                removido_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                for (const pessoaId of dto.participantes) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser participante do grupo.`);

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        this.logger.log(`Novo participante: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoPainelExternoPessoa.create({
                            data: {
                                grupo_painel_externo_id: gp.id,
                                criado_por: user.id,
                                orgao_id: pessoa.orgao_id,
                                pessoa_id: pessoa.pessoa_id,
                            },
                        });
                    } else {
                        this.logger.log(`participante mantido sem alterações: ${pessoaId}`);
                    }
                }
            }

            await prismaTx.grupoPainelExterno.update({
                where: {
                    id: gp.id,
                },
                data: {
                    titulo: dto.titulo,

                    modulo_sistema: sistema,
                    atualizado_em: new Date(Date.now()),
                    atualizado_por: user.id,
                },
                select: { id: true },
            });
        });

        return { id: gp.id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const sistema = user.assertOneModuloSistema('remover', 'grupo de painel externo');
        const exists = await this.prisma.grupoPainelExterno.findFirst({
            where: {
                id,
                modulo_sistema: sistema,
                removido_em: null,
            },
            select: { id: true, orgao_id: true },
        });

        if (!exists) return;

        if (!user.hasSomeRoles(['CadastroGrupoPainelExterno.administrador'])) {
            if (user.orgao_id != exists.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para remover Grupo de Painel Externo no mesmo órgão.'
                );
        }

        await this.prisma.grupoPainelExterno.updateMany({
            where: {
                id,
                modulo_sistema: sistema,
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
