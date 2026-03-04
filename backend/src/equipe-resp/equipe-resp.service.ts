import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CONST_PERFIL_PARTICIPANTE_EQUIPE, CONST_PERFIL_COORDENADOR_EQUIPE } from 'src/common/consts';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PessoaPrivilegioService } from '../auth/pessoaPrivilegio.service';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrgaoService } from '../orgao/orgao.service';
import { CreateEquipeRespDto, UpdateEquipeRespDto } from './dto/equipe-resp.dto';
import { EquipeRespItemDto, FilterEquipeRespDto } from './entities/equipe-resp.entity';
import { recalculaPessoaPdmTipos } from './recalc-perfis-equipe.util';

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

                const pEnviadosColab = await this.pessoaPrivService.pessoasComPriv([], dto.colaboradores);
                const pComPrivColab = await this.pessoaPrivService.pessoasComPriv(
                    ['SMAE.GrupoVariavel.colaborador'],
                    dto.colaboradores
                );
                for (const pessoaId of dto.colaboradores) {
                    const pessoa = pEnviadosColab.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa) throw new BadRequestException(`Pessoa ID ${pessoaId} não encontrada.`);
                    if (pessoa.orgao_id !== orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo, pois não está no órgão responsável (colaboradores devem estar no mesmo órgão da equipe).`
                        );

                    // Auto-adiciona o perfil de coordenador se não tiver
                    const temPriv = pComPrivColab.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!temPriv) {
                        await this.pessoaPrivService.adicionaPerfilAcesso(
                            pessoaId,
                            CONST_PERFIL_COORDENADOR_EQUIPE,
                            prismaTx
                        );
                    }
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
                        const pessoa = pEnviadosColab.filter((r) => r.pessoa_id == pessoaId)[0];

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
                    where: { id: teamId, removido_em: null },
                    select: { orgao_id: true, titulo: true }, // precisa pegar o orgao_id
                });

                if (!team) {
                    throw new BadRequestException(`Equipe ID ${teamId} não foi encontrada.`);
                }

                // pra cada equipe adicionada, tem q testar de novo se pode entrar
                const allowedMemberOrgaoIds = await this.orgaoService.getOrgaoSubtreeIds(team.orgao_id, prismaTx);

                if (!allowedMemberOrgaoIds.includes(orgao_id)) {
                    throw new BadRequestException(
                        `Não é possível adicionar a pessoa à equipe "${team.titulo}", pois o órgão da pessoa (ID ${orgao_id}) não é subordinado ao órgão da equipe (ID ${team.orgao_id}).`
                    );
                }

                await prismaTx.grupoResponsavelEquipeParticipante.create({
                    data: {
                        grupo_responsavel_equipe_id: teamId,
                        pessoa_id: pessoaId,
                        orgao_id: orgao_id,
                    },
                });
            }
        }
        await this.recalculaPessoaPdmTipos(pessoaId, prismaTx);
    }

    async recalculaPessoaPdmTipos(pessoaId: number, prismaTx: Prisma.TransactionClient) {
        await recalculaPessoaPdmTipos(pessoaId, prismaTx);
    }

    async findAll(filter: FilterEquipeRespDto): Promise<EquipeRespItemDto[]> {
        // Determina os IDs de órgãos permitidos baseado no contexto
        let orgaoIdsPermitidos: number[] | undefined = undefined;
        if (filter.orgao_id_contexto) {
            // Busca o órgão contexto e todos os seus pais (hierarquia ascendente)
            orgaoIdsPermitidos = await this.orgaoService.buscaHierarquiaPais(filter.orgao_id_contexto);
        }

        const rows = await this.prisma.grupoResponsavelEquipe.findMany({
            where: {
                id: filter.id,
                orgao_id: orgaoIdsPermitidos ? { in: orgaoIdsPermitidos } : filter.orgao_id,
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

                // Busca todas as pessoas enviadas (para pegar orgao_id)
                const pEnviadosColab = await this.pessoaPrivService.pessoasComPriv([], dto.colaboradores);
                // Busca quem já tem o privilégio
                const pComPrivColab = await this.pessoaPrivService.pessoasComPriv(
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
                    const pessoa = pEnviadosColab.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!pessoa) throw new BadRequestException(`Pessoa ID ${pessoaId} não encontrada.`);
                    if (pessoa.orgao_id !== orgao_id)
                        throw new BadRequestException(
                            `Pessoa ID ${pessoaId} não pode ser colaborador do grupo, pois não está no órgão responsável (colaboradores devem estar no mesmo órgão da equipe).`
                        );

                    // Auto-adiciona o perfil de coordenador se não tiver
                    const temPriv = pComPrivColab.filter((r) => r.pessoa_id == pessoaId)[0];
                    if (!temPriv) {
                        await this.pessoaPrivService.adicionaPerfilAcesso(
                            pessoaId,
                            CONST_PERFIL_COORDENADOR_EQUIPE,
                            prismaTx
                        );
                    }

                    if (!keptRecord.includes(pessoaId)) {
                        // O colaborador é novo, crie um novo registro
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

            // Recalcula perfis de todas as pessoas afetadas (participantes e colaboradores atuais da equipe)
            if (dto.participantes || dto.colaboradores) {
                const currentMembers = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
                    where: { grupo_responsavel_equipe_id: gp.id, removido_em: null },
                    select: { pessoa_id: true },
                    distinct: ['pessoa_id'],
                });
                const affectedIds = new Set(currentMembers.map((m) => m.pessoa_id));

                for (const pessoaId of affectedIds) {
                    await recalculaPessoaPdmTipos(pessoaId, prismaTx);
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
            // Coleta pessoas afetadas ANTES de soft-delete
            const affectedMembers = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
                where: { grupo_responsavel_equipe_id: id, removido_em: null },
                select: { pessoa_id: true },
                distinct: ['pessoa_id'],
            });

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

            // Recalcula perfis das pessoas que eram membros da equipe removida
            for (const member of affectedMembers) {
                await recalculaPessoaPdmTipos(member.pessoa_id, prismaTx);
            }

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
    /**
     * Busca IDs das equipes onde a pessoa é colaborador
     */
    async findIdsPorColaborador(pessoaId: number): Promise<number[]> {
        const rows = await this.prisma.grupoResponsavelEquipe.findMany({
            where: {
                removido_em: null,
                GrupoResponsavelEquipeColaborador: {
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

    /**
     * Atualiza as equipes onde a pessoa é colaborador/responsável
     * Diferente de participantes, colaboradores devem estar no MESMO órgão da equipe
     */
    async atualizaEquipeColaborador(
        pessoaId: number,
        equipes: number[],
        prismaTx: Prisma.TransactionClient,
        orgao_id: number
    ): Promise<void> {
        const equipesAtuais = await prismaTx.grupoResponsavelEquipeResponsavel.findMany({
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

        // Remove das equipes que não estão mais na lista
        for (const teamId of currentIds) {
            if (!equipes.includes(teamId)) {
                await prismaTx.grupoResponsavelEquipeResponsavel.updateMany({
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

        // Adiciona nas novas equipes
        for (const teamId of equipes) {
            if (!currentIds.includes(teamId)) {
                const team = await prismaTx.grupoResponsavelEquipe.findFirst({
                    where: { id: teamId, removido_em: null },
                    select: { orgao_id: true, titulo: true },
                });

                if (!team) {
                    throw new BadRequestException(`Equipe ID ${teamId} não foi encontrada.`);
                }

                // Colaboradores devem estar no MESMO órgão da equipe (não hierárquico)
                if (team.orgao_id !== orgao_id) {
                    throw new BadRequestException(
                        `Não é possível adicionar a pessoa como colaborador na equipe "${team.titulo}", pois o órgão da pessoa (ID ${orgao_id}) não é o mesmo da equipe (ID ${team.orgao_id}). Colaboradores devem pertencer ao mesmo órgão da equipe.`
                    );
                }

                await prismaTx.grupoResponsavelEquipeResponsavel.create({
                    data: {
                        grupo_responsavel_equipe_id: teamId,
                        pessoa_id: pessoaId,
                        orgao_id: orgao_id,
                    },
                });
            }
        }

        // Recalcula os perfis de PDM da pessoa (igual ao participante)
        await this.recalculaPessoaPdmTipos(pessoaId, prismaTx);
    }

    /**
     * Recalcula perfis_equipe_pdm e perfis_equipe_ps de TODAS as pessoas ativas
     * usando uma única query SQL com CTE.
     */
    async recalcFullDb(): Promise<{ updated: number; total: number }> {
        const result = await this.prisma.$queryRaw<{ updated: number; total: number }[]>`
            WITH computed AS (
                SELECT
                    p.id AS pessoa_id,
                    COALESCE(array_agg(DISTINCT gre.perfil) FILTER (WHERE pdm.tipo = 'PDM'), '{}') AS perfis_pdm,
                    COALESCE(array_agg(DISTINCT gre.perfil) FILTER (WHERE pdm.tipo = 'PS'), '{}') AS perfis_ps
                FROM pessoa p
                LEFT JOIN grupo_responsavel_equipe_pessoa grep
                    ON grep.pessoa_id = p.id AND grep.removido_em IS NULL
                LEFT JOIN grupo_responsavel_equipe gre
                    ON gre.id = grep.grupo_responsavel_equipe_id AND gre.removido_em IS NULL
                LEFT JOIN pdm_perfil pp
                    ON pp.equipe_id = gre.id AND pp.removido_em IS NULL
                LEFT JOIN pdm
                    ON pdm.id = pp.pdm_id AND pdm.removido_em IS NULL
                WHERE p.desativado = false
                GROUP BY p.id
            ),
            do_update AS (
                UPDATE pessoa SET
                    perfis_equipe_pdm = computed.perfis_pdm::"PerfilResponsavelEquipe"[],
                    perfis_equipe_ps = computed.perfis_ps::"PerfilResponsavelEquipe"[]
                FROM computed
                WHERE pessoa.id = computed.pessoa_id
                AND (pessoa.perfis_equipe_pdm IS DISTINCT FROM computed.perfis_pdm::"PerfilResponsavelEquipe"[]
                     OR pessoa.perfis_equipe_ps IS DISTINCT FROM computed.perfis_ps::"PerfilResponsavelEquipe"[])
                RETURNING 1
            )
            SELECT
                (SELECT count(*)::int FROM do_update) AS updated,
                (SELECT count(*)::int FROM computed) AS total
        `;

        return result[0];
    }
}
