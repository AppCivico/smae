import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PerfilResponsavelEquipe, Prisma } from '@prisma/client';
import { CONST_PERFIL_PARTICIPANTE_EQUIPE } from 'src/common/consts';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PessoaPrivilegioService } from '../auth/pessoaPrivilegio.service';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrgaoService } from '../orgao/orgao.service';
import { CreateEquipeRespDto, UpdateEquipeRespDto } from './dto/equipe-resp.dto';
import { EquipeRespItemDto, FilterEquipeRespDto } from './entities/equipe-resp.entity';

@Injectable()
export class EquipeRespService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pessoaPrivService: PessoaPrivilegioService,
        private readonly orgaoService: OrgaoService
    ) {}

    private async getAllowedOrgaoIds(orgao_id: number, prismaTx: Prisma.TransactionClient): Promise<number[]> {
        return await this.orgaoService.getOrgaoSubtreeIds(orgao_id, prismaTx);
    }

    async create(dto: CreateEquipeRespDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const logger = LoggerWithLog('Grupo Repensável de Variáveis: Criação');
        const orgao_id = dto.orgao_id ? dto.orgao_id : user.orgao_id;

        if (!orgao_id) throw new BadRequestException('Não foi possível determinar o órgão');

        if (!user.hasSomeRoles(['CadastroGrupoVariavel.administrador'])) {
            // assume que CadastroGrupoVariavel.administrador_no_orgao já foi validado na controller
            if (orgao_id != user.orgao_id)
                throw new BadRequestException('Você só tem permissão para criar Equipe no mesmo órgão.');
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                logger.log(`Dados: ${JSON.stringify(dto)}`);

                const exists = await prismaTx.grupoResponsavelEquipe.count({
                    where: {
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');

                // Obtém todos os IDs de órgãos permitidos (órgão base + subordinados)
                const allowedOrgaoIds = await this.getAllowedOrgaoIds(orgao_id, prismaTx);

                const pEnviados = await this.pessoaPrivService.pessoasComPriv([], dto.participantes);
                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.participante'],
                    dto.participantes
                );
                for (const pessoaId of dto.participantes) {
                    const pessoa = pEnviados.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa) throw new BadRequestException(`Pessoa ID ${pessoaId} não encontrada.`);
                    if (!allowedOrgaoIds.includes(pessoa.orgao_id))
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo, pois não está no órgão responsável ou seus subordinados.`
                        );

                    const temPriv = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!temPriv) {
                        await this.pessoaPrivService.adicionaPerfilAcesso(
                            pessoaId,
                            CONST_PERFIL_PARTICIPANTE_EQUIPE,
                            prismaTx
                        );
                    }
                }

                const pComPriv2 = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.colaborador'],
                    dto.colaboradores
                );
                for (const pessoaId of dto.colaboradores) {
                    const pessoa = pComPriv2.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(`Pessoa ID ${pessoaId} não pode ser colaborador do grupo.`);
                    if (!allowedOrgaoIds.includes(pessoa.orgao_id))
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo, pois não está no órgão responsável ou seus subordinados.`
                        );
                }

                const gp = await prismaTx.grupoResponsavelEquipe.create({
                    data: {
                        orgao_id,
                        titulo: dto.titulo,
                        perfil: dto.perfil,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                await prismaTx.grupoResponsavelEquipeParticipante.createMany({
                    data: dto.participantes.map((pessoaId) => {
                        const pessoa = pEnviados.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_responsavel_equipe_id: gp.id,
                            orgao_id: pessoa.orgao_id,
                            pessoa_id: pessoa.pessoa_id,
                        };
                    }),
                });
                await prismaTx.grupoResponsavelEquipeResponsavel.createMany({
                    data: dto.colaboradores.map((pessoaId) => {
                        const pessoa = pComPriv2.filter((r) => r.pessoa_id == pessoaId)[0];

                        return {
                            grupo_responsavel_equipe_id: gp.id,
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

    async findIdsPorParticipante(pessoaId: number): Promise<number[]> {
        const rows = await this.prisma.grupoResponsavelEquipe.findMany({
            where: {
                removido_em: null,
                GrupoResponsavelEquipePessoa: {
                    some: {
                        removido_em: null,
                        pessoa_id: pessoaId,
                    },
                },
            },
            select: {
                id: true,
            },
        });

        return rows.map((r) => r.id);
    }

    async atualizaEquipe(
        pessoaId: number,
        equipes: number[],
        prismaTx: Prisma.TransactionClient,
        orgao_id: number
    ): Promise<void> {
        const equipesAtuais = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
            where: {
                pessoa_id: pessoaId,
                removido_em: null,
            },
            select: {
                grupo_responsavel_equipe_id: true,
                orgao_id: true,
            },
        });

        const currentIds = equipesAtuais.map((t) => t.grupo_responsavel_equipe_id);

        // Encontra as para remover
        for (const teamId of currentIds) {
            if (!equipes.includes(teamId)) {
                await prismaTx.grupoResponsavelEquipeParticipante.updateMany({
                    where: {
                        pessoa_id: pessoaId,
                        grupo_responsavel_equipe_id: teamId,
                        removido_em: null,
                    },
                    data: {
                        removido_em: new Date(Date.now()),
                    },
                });
            }
        }

        // Encontra as para adicionar
        for (const teamId of equipes) {
            if (!currentIds.includes(teamId)) {
                const team = await prismaTx.grupoResponsavelEquipe.findFirst({
                    where: {
                        id: teamId,
                        removido_em: null,
                        orgao_id,
                    },
                    select: {
                        orgao_id: true,
                    },
                });

                if (!team) throw new BadRequestException(`Equipe ID ${teamId} não encontrada, órgão ${orgao_id}.`);

                await prismaTx.grupoResponsavelEquipeParticipante.create({
                    data: {
                        grupo_responsavel_equipe_id: teamId,
                        pessoa_id: pessoaId,
                        orgao_id: team.orgao_id,
                    },
                });
            }
        }
        await this.recalculaPessoaPdmTipos(pessoaId, prismaTx);
    }

    async recalculaPessoaPdmTipos(pessoaId: number, prismaTx: Prisma.TransactionClient) {
        const equipes = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
            where: {
                pessoa_id: pessoaId,
                removido_em: null,
            },
            select: { grupo_responsavel_equipe: { select: { id: true } } },
        });

        const perfisPdm = new Set<PerfilResponsavelEquipe>();
        const perfisPs = new Set<PerfilResponsavelEquipe>();

        // Obtém tipos de PDM e seus perfis associados
        const pdmTiposEPerfis = await prismaTx.pdm.findMany({
            where: {
                removido_em: null,
                PdmPerfil: {
                    some: {
                        equipe_id: { in: equipes.map((e) => e.grupo_responsavel_equipe.id) },
                        removido_em: null,
                    },
                },
            },
            select: {
                tipo: true,
                PdmPerfil: {
                    select: { equipe: { select: { perfil: true } } },
                    where: {
                        equipe_id: { in: equipes.map((e) => e.grupo_responsavel_equipe.id) },
                        removido_em: null,
                    },
                },
            },
        });

        for (const item of pdmTiposEPerfis) {
            item.PdmPerfil.forEach((perfil) => {
                if (item.tipo === 'PDM') {
                    perfisPdm.add(perfil.equipe.perfil);
                } else if (item.tipo === 'PS') {
                    perfisPs.add(perfil.equipe.perfil);
                }
            });
        }

        await prismaTx.pessoa.update({
            where: { id: pessoaId },
            data: {
                perfis_equipe_pdm: Array.from(perfisPdm),
                perfis_equipe_ps: Array.from(perfisPs),
            },
        });
    }

    async findAll(filter: FilterEquipeRespDto): Promise<EquipeRespItemDto[]> {
        const rows = await this.prisma.grupoResponsavelEquipe.findMany({
            where: {
                id: filter.id,
                orgao_id: filter.orgao_id,
                removido_em: null,
            },
            include: {
                orgao: { select: { id: true, sigla: true, descricao: true } },
                GrupoResponsavelEquipePessoa: filter.remover_participantes
                    ? undefined
                    : {
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
                GrupoResponsavelEquipeColaborador: filter.remover_participantes
                    ? undefined
                    : {
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
                VariavelGrupoResponsavelEquipe: filter.retornar_uso
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
                variaveis: filter.retornar_uso ? r.VariavelGrupoResponsavelEquipe.map((p: any) => p.variavel) : [],
                participantes: filter.remover_participantes
                    ? []
                    : r.GrupoResponsavelEquipePessoa.map((p: any) => p.pessoa),
                colaboradores: filter.remover_participantes
                    ? []
                    : r.GrupoResponsavelEquipeColaborador.map((p: any) => p.pessoa),
            };
        });
    }

    async update(id: number, dto: UpdateEquipeRespDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const logger = LoggerWithLog('Grupo Repensável de Variáveis: Atualização');
        const gp = await this.prisma.grupoResponsavelEquipe.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                orgao_id: true,
                GrupoResponsavelEquipeColaborador: {
                    where: { removido_em: null },
                    select: {
                        pessoa_id: true,
                    },
                },
            },
        });

        if (!gp) throw new NotFoundException('Equipe não foi encontrada.');

        if (!user.hasSomeRoles(['CadastroGrupoVariavel.administrador'])) {
            if (user.orgao_id != gp.orgao_id)
                throw new BadRequestException('Você só tem permissão para editar Equipe no mesmo órgão.');

            // user.id deve estar em gp.GrupoResponsavelEquipeColaborador
            if (!gp.GrupoResponsavelEquipeColaborador.map((r) => r.pessoa_id).includes(user.id))
                throw new BadRequestException(
                    'Você só tem permissão para editar Equipe se for um colaborador do grupo.'
                );
        }

        const orgao_id = gp.orgao_id;

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            logger.log(`Dados: ${JSON.stringify(dto)}`);

            // Obtém todos os IDs de órgãos permitidos (órgão base + subordinados) se estamos atualizando
            // participantes ou colaboradores
            let allowedOrgaoIds: number[] = [];
            if (dto.participantes || dto.colaboradores) {
                allowedOrgaoIds = await this.getAllowedOrgaoIds(orgao_id, prismaTx);
            }

            if (dto.titulo) {
                const exists = await prismaTx.grupoResponsavelEquipe.count({
                    where: {
                        NOT: { id: gp.id },
                        titulo: { mode: 'insensitive', equals: dto.titulo },
                        removido_em: null,
                    },
                });
                if (exists) throw new BadRequestException('Título já está em uso.');
            }

            if (dto.participantes) {
                const prevVersion = await prismaTx.grupoResponsavelEquipe.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoResponsavelEquipePessoa: {
                            where: {
                                removido_em: null,
                            },
                            select: { pessoa_id: true },
                        },
                    },
                });

                const pEnviados = await this.pessoaPrivService.pessoasComPriv([], dto.participantes);
                const pComPriv = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.participante'],
                    dto.participantes
                );
                for (const pessoaId of dto.participantes) {
                    const pessoa = pEnviados.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa) throw new BadRequestException(`Pessoa ID ${pessoaId} não encontrada.`);
                    if (!allowedOrgaoIds.includes(pessoa.orgao_id))
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo, pois não está no órgão responsável ou seus subordinados.`
                        );

                    const temPriv = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!temPriv) {
                        await this.pessoaPrivService.adicionaPerfilAcesso(
                            pessoaId,
                            CONST_PERFIL_PARTICIPANTE_EQUIPE,
                            prismaTx
                        );
                    }
                }

                const keptRecord: number[] = prevVersion?.GrupoResponsavelEquipePessoa.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.participantes.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        logger.log(`participante removido: ${pessoaId}`);
                        await prismaTx.grupoResponsavelEquipeParticipante.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_responsavel_equipe_id: gp.id,
                                removido_em: null,
                            },
                            data: {
                                removido_em: new Date(Date.now()),
                            },
                        });
                        // TODO ? 2024-10-21 se remover de todos os grupos, remover o perfil de acesso as well
                    }
                }

                for (const pessoaId of dto.participantes) {
                    const pessoa = pEnviados.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo, pois participa de outro órgão.`
                        );

                    const temPriv = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!temPriv) {
                        await this.pessoaPrivService.adicionaPerfilAcesso(
                            pessoaId,
                            CONST_PERFIL_PARTICIPANTE_EQUIPE,
                            prismaTx
                        );
                    }

                    if (pessoa.orgao_id != orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser participante do grupo em outro órgão.`
                        );

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        logger.log(`Novo participante: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoResponsavelEquipeParticipante.create({
                            data: {
                                grupo_responsavel_equipe_id: gp.id,
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
                const prevVersion = await prismaTx.grupoResponsavelEquipe.findFirst({
                    where: {
                        id,
                        removido_em: null,
                    },
                    select: {
                        id: true,
                        GrupoResponsavelEquipeColaborador: {
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
                    prevVersion?.GrupoResponsavelEquipeColaborador.map((r) => r.pessoa_id) ?? [];

                for (const pessoaId of keptRecord) {
                    if (!dto.colaboradores.includes(pessoaId)) {
                        // O participante estava presente na versão anterior, mas não na nova versão
                        logger.log(`colaborador removido: ${pessoaId}`);
                        await prismaTx.grupoResponsavelEquipeResponsavel.updateMany({
                            where: {
                                pessoa_id: pessoaId,
                                grupo_responsavel_equipe_id: gp.id,
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
                    if (!allowedOrgaoIds.includes(pessoa.orgao_id))
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo, pois não está no órgão responsável ou seus subordinados.`
                        );

                    if (!keptRecord.includes(pessoaId)) {
                        // O participante é novo, crie um novo registro
                        logger.log(`Novo colaborador: ${pessoa.pessoa_id}`);
                        await prismaTx.grupoResponsavelEquipeResponsavel.create({
                            data: {
                                grupo_responsavel_equipe_id: gp.id,
                                orgao_id: pessoa.orgao_id,
                                pessoa_id: pessoa.pessoa_id,
                            },
                        });
                    } else {
                        logger.log(`colaborador mantido sem alterações: ${pessoaId}`);
                    }
                }
            }

            await prismaTx.grupoResponsavelEquipe.update({
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
        const exists = await this.prisma.grupoResponsavelEquipe.findFirst({
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
                throw new BadRequestException('Você só tem permissão para remover Equipe no mesmo órgão.');
        }

        await this.confereUso(id);

        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            await prismaTx.grupoResponsavelEquipe.updateMany({
                where: {
                    id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                },
            });

            await prismaTx.grupoResponsavelEquipeResponsavel.updateMany({
                where: {
                    grupo_responsavel_equipe_id: id,
                    removido_em: null,
                },
                data: {
                    removido_em: now,
                },
            });

            await prismaTx.grupoResponsavelEquipeParticipante.updateMany({
                where: {
                    grupo_responsavel_equipe_id: id,
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

    private async confereUso(id: number) {
        const emUsoVar = await this.prisma.variavelGrupoResponsavelEquipe.findMany({
            where: {
                grupo_responsavel_equipe_id: id,
                removido_em: null,
            },
            select: { variavel: { select: { titulo: true } } },
        });
        if (emUsoVar.length)
            throw new BadRequestException(
                `Não é possível remover o grupo pois as seguintes variáveis estão associadas a ele:\n${emUsoVar
                    .map((r) => '-' + r.variavel.titulo)
                    .join('\n')}`
            );

        const emUsoPdm = await this.prisma.pdmPerfil.findMany({
            where: {
                equipe_id: id,
                removido_em: null,
            },
            select: {
                relacionamento: true,
                tipo: true,
                pdm: { select: { tipo: true, nome: true } },
                etapa: { select: { titulo: true } },
                meta: { select: { titulo: true } },
                iniciativa: { select: { titulo: true } },
                atividade: { select: { titulo: true } },
            },
        });
        if (emUsoPdm.length) {
            const mensagens = emUsoPdm.map((item) => {
                let mensagem = '';
                switch (item.relacionamento) {
                    case 'PDM':
                        mensagem = `PDM ${item.pdm.nome}`;
                        break;
                    case 'META':
                        mensagem = `Meta ${item.meta?.titulo || 'Desconhecida'} do PDM ${item.pdm.nome}`;
                        break;
                    case 'INICIATIVA':
                        mensagem = `Iniciativa ${item.iniciativa?.titulo || 'Desconhecida'} do PDM ${item.pdm.nome}`;
                        break;
                    case 'ATIVIDADE':
                        mensagem = `Atividade ${item.atividade?.titulo || 'Desconhecida'} do PDM ${item.pdm.nome}`;
                        break;
                    default:
                        mensagem = `Relacionamento desconhecido do PDM ${item.pdm.nome}`;
                }
                return `- ${mensagem} (Tipo de perfil: ${item.tipo})`;
            });

            throw new BadRequestException(
                `Não é possível remover o grupo pois os seguintes itens estão associados a ele:\n${mensagens.join('\n')}`
            );
        }
    }
}
