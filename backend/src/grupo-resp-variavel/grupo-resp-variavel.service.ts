import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PessoaPrivilegioService } from '../auth/pessoaPrivilegio.service';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrupoRespVariavelDto } from './dto/create-grupo-resp-variavel.dto';
import { UpdateGrupoRespVariavelDto } from './dto/update-grupo-resp-variavel.dto';
import { FilterGrupoRespVariavelDto, GrupoRespVariavelItemDto } from './entities/grupo-resp-variavel.entity';

@Injectable()
export class GrupoRespVariavelService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaPrivService: PessoaPrivilegioService
    ) {}

    async create(dto: CreateGrupoRespVariavelDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const logger = LoggerWithLog('Grupo Repensável de Variáveis: Criação');
        const orgao_id = dto.orgao_id ? dto.orgao_id : user.orgao_id;

        if (!orgao_id) throw new BadRequestException('Não foi possível determinar o órgão');

        if (!user.hasSomeRoles(['CadastroGrupoVariavel.administrador'])) {
            // assume que CadastroGrupoVariavel.administrador_no_orgao já foi validado na controller
            if (orgao_id != user.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para criar Grupo de Responsavel de Variável no mesmo órgão.'
                );
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                logger.log(`Dados: ${JSON.stringify(dto)}`);

                const exists = await prismaTx.grupoResponsavelVariavel.count({
                    where: {
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.participante'],
                    dto.participantes
                );
                for (const pessoaId of dto.participantes) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser participante do grupo.`);

                    if (pessoa.orgao_id != orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo em outro órgão.`
                        );
                }

                const pComPriv2 = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.colaborador'],
                    dto.colaboradores
                );
                for (const pessoaId of dto.colaboradores) {
                    const pessoa = pComPriv2.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser colaborador do grupo.`);
                    if (pessoa.orgao_id != orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo em outro órgão.`
                        );
                }

                const gp = await prismaTx.grupoResponsavelVariavel.create({
                    data: {
                        orgao_id,
                        titulo: dto.titulo,
                        perfil: dto.perfil,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                await prismaTx.grupoResponsavelVariavelPessoa.createMany({
                    data: dto.participantes.map((pessoaId) => {
                        const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_responsavel_variavel_id: gp.id,
                            orgao_id: pessoa.orgao_id,
                            pessoa_id: pessoa.pessoa_id,
                        };
                    }),
                });
                await prismaTx.grupoResponsavelVariavelColaborador.createMany({
                    data: dto.colaboradores.map((pessoaId) => {
                        const pessoa = pComPriv2.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_responsavel_variavel_id: gp.id,
                            orgao_id: pessoa.orgao_id,
                            pessoa_id: pessoa.pessoa_id,
                        };
                    }),
                });

                await logger.saveLogs(prismaTx, user.getLogData());

                return { id: gp.id };
            }
        );

        return { id: created.id };
    }

    async findAll(filter: FilterGrupoRespVariavelDto): Promise<GrupoRespVariavelItemDto[]> {
        const rows = await this.prisma.grupoResponsavelVariavel.findMany({
            where: {
                id: filter.id,
                removido_em: null,
            },
            include: {
                orgao: { select: { id: true, sigla: true, descricao: true } },
                GrupoResponsavelVariavelPessoa: {
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
                GrupoResponsavelVariavelColaborador: {
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
                VariavelGrupoResponsavelVariavel: filter.retornar_uso
                    ? {
                          where: {
                              removido_em: null,
                          },
                          include: {
                              variavel: {
                                  select: {
                                      id: true,
                                      titulo: true,
                                      codigo: true,
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
                perfil: r.perfil,
                criado_em: r.criado_em,
                orgao: r.orgao,
                orgao_id: r.orgao_id,
                variaveis: filter.retornar_uso ? r.VariavelGrupoResponsavelVariavel.map((p: any) => p.variavel) : [],
                participantes: r.GrupoResponsavelVariavelPessoa.map((p) => p.pessoa),
                colaboradores: r.GrupoResponsavelVariavelColaborador.map((p) => p.pessoa),
            };
        });
    }

    async update(id: number, dto: UpdateGrupoRespVariavelDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const logger = LoggerWithLog('Grupo Repensável de Variáveis: Atualização');
        const gp = await this.prisma.grupoResponsavelVariavel.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                orgao_id: true,
                GrupoResponsavelVariavelColaborador: {
                    where: { removido_em: null },
                    select: {
                        pessoa_id: true,
                    },
                },
            },
        });

        if (!gp) throw new NotFoundException('Grupo Responsavel de Variável não foi encontrado.');

        if (!user.hasSomeRoles(['CadastroGrupoVariavel.administrador'])) {
            if (user.orgao_id != gp.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para editar Grupo de Responsavel de Variável no mesmo órgão.'
                );

            // user.id  must be in gp.GrupoResponsavelVariavelColaborador
            if (!gp.GrupoResponsavelVariavelColaborador.map((r) => r.pessoa_id).includes(user.id))
                throw new BadRequestException(
                    'Você só tem permissão para editar Grupo de Responsavel de Variável se for um colaborador do grupo.'
                );
        }

        const orgao_id = gp.orgao_id;

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            logger.log(`Dados: ${JSON.stringify(dto)}`);
            if (dto.titulo) {
                const exists = await prismaTx.grupoResponsavelVariavel.count({
                    where: {
                        NOT: { id: gp.id },
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');
            }

            if (dto.participantes) {
                const prevVersion = await prismaTx.grupoResponsavelVariavel.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoResponsavelVariavelPessoa: {
                            where: {
                                removido_em: null,
                            },
                            select: { pessoa_id: true },
                        },
                    },
                });

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.participante'],
                    dto.participantes
                );

                const keptRecord: number[] = prevVersion?.GrupoResponsavelVariavelPessoa.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.participantes.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        logger.log(`participante removido: ${pessoaId}`);
                        await prismaTx.grupoResponsavelVariavelPessoa.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_responsavel_variavel_id: gp.id,
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
                    if (pessoa.orgao_id != orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo em outro órgão.`
                        );

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        logger.log(`Novo participante: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoResponsavelVariavelPessoa.create({
                            data: {
                                grupo_responsavel_variavel_id: gp.id,
                                orgao_id: pessoa.orgao_id,
                                pessoa_id: pessoa.pessoa_id,
                            },
                        });
                    } else {
                        logger.log(`participante mantido sem alterações: ${pessoaId}`);
                    }
                }
            }

            if (dto.colaboradores) {
                const prevVersion = await prismaTx.grupoResponsavelVariavel.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoResponsavelVariavelColaborador: {
                            where: {
                                removido_em: null,
                            },
                            select: { pessoa_id: true },
                        },
                    },
                });

                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.colaborador'],
                    dto.colaboradores
                );

                const keptRecord: number[] =
                    prevVersion?.GrupoResponsavelVariavelColaborador.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.colaboradores.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        logger.log(`colaborador removido: ${pessoaId}`);
                        await prismaTx.grupoResponsavelVariavelColaborador.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_responsavel_variavel_id: gp.id,
                                removido_em: null,
                            },
                            data: {
                                removido_em: new Date(Date.now()),
                            },
                        });
                    }
                }

                for (const pessoaId of dto.colaboradores) {
                    const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser colaborador do grupo.`);
                    if (pessoa.orgao_id != orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo em outro órgão.`
                        );

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        logger.log(`Novo colaborador: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoResponsavelVariavelColaborador.create({
                            data: {
                                grupo_responsavel_variavel_id: gp.id,
                                orgao_id: pessoa.orgao_id,
                                pessoa_id: pessoa.pessoa_id,
                            },
                        });
                    } else {
                        logger.log(`colaborador mantido sem alterações: ${pessoaId}`);
                    }
                }
            }

            await prismaTx.grupoResponsavelVariavel.update({
                where: {
                    id: gp.id,
                },
                data: {
                    titulo: dto.titulo,

                    atualizado_em: now,
                },
                select: { id: true },
            });
            await logger.saveLogs(prismaTx, user.getLogData());
        });

        return { id: gp.id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        const logger = LoggerWithLog('Grupo Repensável de Variáveis: Remoção');
        const exists = await this.prisma.grupoResponsavelVariavel.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true, orgao_id: true },
        });

        if (!exists) return;

        logger.log(`ID: ${id}`);

        if (!user.hasSomeRoles(['CadastroGrupoVariavel.administrador'])) {
            if (user.orgao_id != exists.orgao_id)
                throw new BadRequestException(
                    'Você só tem permissão para remover Grupo de Responsavel de Variável no mesmo órgão.'
                );
        }

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            await prismaTx.grupoResponsavelVariavel.updateMany({
                where: {
                    id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                },
            });

            await prismaTx.grupoResponsavelVariavelPessoa.updateMany({
                where: {
                    grupo_responsavel_variavel_id: id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                },
            });

            await logger.saveLogs(prismaTx, user.getLogData());
        });

        return;
    }
}
