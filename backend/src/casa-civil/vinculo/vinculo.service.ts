import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';
import { CampoVinculo, Prisma } from '@prisma/client';
import { FilterVinculoDto } from './dto/filter-vinculo.dto';
import { VinculoDto } from './entities/vinculo.entity';
import { uuidv7 } from 'uuidv7';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { CONST_PERFIL_CASA_CIVIL } from 'src/common/consts';

@Injectable()
export class VinculoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    async upsert(dto: CreateVinculoDto | UpdateVinculoDto, user: PessoaFromJwt, id?: number): Promise<RecordWithId> {
        if (id) {
            const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
                where: { id, removido_em: null },
                select: { id: true },
            });
            if (!self) throw new HttpException('Vínculo não encontrado', 404);
        } else {
            // Verificações de criação
            const createDto = dto as CreateVinculoDto;

            // Precisa ter projeto ou meta/iniciativa/atividade.
            if (!createDto.meta_id && !createDto.projeto_id && !createDto.iniciativa_id && !createDto.atividade_id)
                throw new HttpException('É necessário informar uma meta, projeto, iniciativa ou atividade', 400);

            if (createDto.campo_vinculo === CampoVinculo.Endereco && !createDto.geo_localizacao_referencia_id) {
                throw new HttpException(
                    'É necessário informar a referência de localização geográfica para vínculos do tipo endereço',
                    400
                );
            }

            if (createDto.campo_vinculo === CampoVinculo.Dotacao && !createDto.orcamento_realizado_id) {
                throw new HttpException(
                    'É necessário informar o orçamento realizado para vínculos do tipo dotação',
                    400
                );
            }
            // TODO: verificar se existe mais de uma col definida (meta/projeto/iniciativa/atividade) e bloquear.
        }

        // Processando dados extra como JSON
        try {
            if ('dados_extra' in dto && dto.dados_extra) {
                dto.dados_extra = JSON.parse(dto.dados_extra as unknown as string) as any;
            }
        } catch (error) {
            // Caso tenha erro no parse, ignorar o dado extra.
            delete dto.dados_extra;
        }

        const created = await this.prisma.distribuicaoRecursoVinculo.upsert({
            where: { id: id || 0 },
            create: {
                // Estes placeholders nunca serão utilizados, mas o Prisma obriga a definir valores para os campos (no caso de update, mesmo que aqui seja create)
                // Isso ocorre pois o DTO de update não tem todos os campos obrigatórios do create.
                // Mas como no DTO de criação, estes campos são obrigatórios, eles sempre estarão presentes.
                tipo_vinculo_id: (dto as CreateVinculoDto).tipo_vinculo_id ?? 0,
                distribuicao_id: (dto as CreateVinculoDto).distribuicao_id ?? 0,
                geo_localizacao_referencia_id: (dto as CreateVinculoDto).geo_localizacao_referencia_id ?? undefined,
                orcamento_realizado_id: (dto as CreateVinculoDto).orcamento_realizado_id ?? undefined,
                meta_id: (dto as CreateVinculoDto).meta_id ?? undefined,
                iniciativa_id: (dto as CreateVinculoDto).iniciativa_id ?? undefined,
                atividade_id: (dto as CreateVinculoDto).atividade_id ?? undefined,
                projeto_id: (dto as CreateVinculoDto).projeto_id ?? undefined,
                campo_vinculo: (dto as CreateVinculoDto).campo_vinculo ?? CampoVinculo.Endereco,
                valor_vinculo: (dto as CreateVinculoDto).valor_vinculo ?? '',
                observacao: (dto as CreateVinculoDto).observacao,
                dados_extra: (dto as CreateVinculoDto).dados_extra,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
            },
            update: {
                tipo_vinculo_id: (dto as UpdateVinculoDto).tipo_vinculo_id,
                observacao: (dto as UpdateVinculoDto).observacao,
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(filters: FilterVinculoDto): Promise<VinculoDto[]> {
        const vinculos = await this.prisma.distribuicaoRecursoVinculo.findMany({
            where: {
                removido_em: null,
                tipo_vinculo_id: filters.tipo_vinculo_id,
                meta_id: filters.meta_id,
                iniciativa_id: filters.iniciativa_id,
                atividade_id: filters.atividade_id,
                projeto_id: filters.projeto_id,
                campo_vinculo: filters.campo_vinculo,
                distribuicao: {
                    id: filters.distribuicao_id,
                    transferencia_id: filters.transferencia_id,
                },
            },
            select: {
                id: true,
                tipo_vinculo: true,
                campo_vinculo: true,
                valor_vinculo: true,
                observacao: true,
                invalidado_em: true,
                motivo_invalido: true,

                distribuicao: {
                    select: {
                        id: true,
                        nome: true,
                        valor: true,
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },

                        transferencia: {
                            select: {
                                id: true,
                                identificador: true,
                                valor: true,
                                orgao_concedente: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                        },
                    },
                },

                meta: {
                    select: {
                        id: true,
                        titulo: true,
                        status: true,

                        meta_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },

                        pdm: {
                            select: {
                                id: true,
                                tipo: true,
                                nome: true,
                                rotulo_iniciativa: true,
                                rotulo_atividade: true,
                                rotulo_macro_tema: true,
                            },
                        },
                    },
                },

                iniciativa: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        status: true,
                        iniciativa_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },

                        meta: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                                status: true,
                                meta_orgao: {
                                    where: { responsavel: true },
                                    select: {
                                        orgao: {
                                            select: {
                                                id: true,
                                                sigla: true,
                                                descricao: true,
                                            },
                                        },
                                    },
                                    take: 1,
                                },
                                pdm: {
                                    select: {
                                        id: true,
                                        tipo: true,
                                        nome: true,
                                        rotulo_atividade: true,
                                        rotulo_iniciativa: true,
                                        rotulo_macro_tema: true,
                                    },
                                },
                            },
                        },
                    },
                },

                atividade: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true,
                        status: true,
                        atividade_orgao: {
                            where: { responsavel: true },
                            select: {
                                orgao: {
                                    select: {
                                        id: true,
                                        sigla: true,
                                        descricao: true,
                                    },
                                },
                            },
                            take: 1,
                        },

                        iniciativa: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true,
                                status: true,
                                iniciativa_orgao: {
                                    where: { responsavel: true },
                                    select: {
                                        orgao: {
                                            select: {
                                                id: true,
                                                sigla: true,
                                                descricao: true,
                                            },
                                        },
                                    },
                                    take: 1,
                                },

                                meta: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true,
                                        status: true,
                                        meta_orgao: {
                                            where: { responsavel: true },
                                            select: {
                                                orgao: {
                                                    select: {
                                                        id: true,
                                                        sigla: true,
                                                        descricao: true,
                                                    },
                                                },
                                            },
                                            take: 1,
                                        },

                                        pdm: {
                                            select: {
                                                id: true,
                                                tipo: true,
                                                nome: true,
                                                rotulo_atividade: true,
                                                rotulo_iniciativa: true,
                                                rotulo_macro_tema: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },

                projeto: {
                    select: {
                        id: true,
                        tipo: true,
                        nome: true,
                        status: true,
                        portfolio: {
                            select: {
                                id: true,
                                titulo: true,
                            },
                        },
                        orgao_gestor: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true,
                            },
                        },
                        grupo_tematico: {
                            select: {
                                nome: true,
                            },
                        },
                        equipamento: {
                            select: {
                                nome: true,
                            },
                        },
                        tipo_intervencao: {
                            select: {
                                nome: true,
                            },
                        },
                    },
                },
            },
        });

        return vinculos.map((v) => {
            const iniciativa = v.atividade ? v.atividade.iniciativa : v.iniciativa;
            const meta = iniciativa ? iniciativa.meta : v.meta;
            const pdm = meta?.pdm;

            return {
                id: v.id,
                distribuicao_recurso: {
                    id: v.distribuicao.id,
                    nome: v.distribuicao.nome,
                    valor: v.distribuicao.valor,
                    orgao: {
                        id: v.distribuicao.orgao_gestor.id,
                        sigla: v.distribuicao.orgao_gestor.sigla,
                        descricao: v.distribuicao.orgao_gestor.descricao,
                    },

                    transferencia: {
                        id: v.distribuicao.transferencia.id,
                        nome: v.distribuicao.transferencia.identificador,
                        valor: v.distribuicao.transferencia.valor,
                        orgao_concedente: {
                            id: v.distribuicao.transferencia.orgao_concedente.id,
                            sigla: v.distribuicao.transferencia.orgao_concedente.sigla,
                            descricao: v.distribuicao.transferencia.orgao_concedente.descricao,
                        },
                    },
                },
                tipo_vinculo: {
                    id: v.tipo_vinculo.id,
                    nome: v.tipo_vinculo.nome,
                },
                campo_vinculo: v.campo_vinculo,
                valor_vinculo: v.valor_vinculo,
                observacao: v.observacao,
                meta: meta
                    ? {
                          id: meta.id,
                          nome: meta.titulo,
                          status: meta.status,
                          orgao: {
                              id: meta.meta_orgao[0]?.orgao?.id,
                              sigla: meta.meta_orgao[0]?.orgao?.sigla,
                              descricao: meta.meta_orgao[0]?.orgao?.descricao,
                          },
                      }
                    : null,
                iniciativa: iniciativa
                    ? {
                          id: iniciativa.id,
                          nome: iniciativa.titulo,
                          status: iniciativa.status,
                          orgao: {
                              id: iniciativa.iniciativa_orgao[0]?.orgao?.id,
                              sigla: iniciativa.iniciativa_orgao[0]?.orgao?.sigla,
                              descricao: iniciativa.iniciativa_orgao[0]?.orgao?.descricao,
                          },
                      }
                    : null,
                atividade: v.atividade
                    ? {
                          id: v.atividade.id,
                          nome: v.atividade.titulo,
                          status: v.atividade.status,
                          orgao: {
                              id: v.atividade.atividade_orgao[0]?.orgao?.id,
                              sigla: v.atividade.atividade_orgao[0]?.orgao?.sigla,
                              descricao: v.atividade.atividade_orgao[0]?.orgao?.descricao,
                          },
                      }
                    : null,
                projeto: v.projeto
                    ? {
                          id: v.projeto.id,
                          tipo: v.projeto.tipo,
                          nome: v.projeto.nome,
                          portfolio: {
                              id: v.projeto.portfolio.id,
                              nome: v.projeto.portfolio.titulo,
                          },
                          orgao: {
                              id: v.projeto.orgao_gestor?.id,
                              sigla: v.projeto.orgao_gestor?.sigla,
                              descricao: v.projeto.orgao_gestor?.descricao,
                          },
                          status: v.projeto.status,
                      }
                    : null,
                invalidado_em: v.invalidado_em,
                motivo_invalido: v.motivo_invalido,
                detalhes: {
                    grupo_tematico_nome: v.projeto?.grupo_tematico?.nome ?? null,
                    equipamento_nome: v.projeto?.equipamento?.nome ?? null,
                    subprefeitura_nome: null,
                    tipo_intervencao_nome: v.projeto?.tipo_intervencao?.nome ?? null,
                },
                pdm: pdm
                    ? {
                          id: pdm.id,
                          tipo: pdm.tipo,
                          nome: pdm.nome,
                          rotulo_atividade: pdm.rotulo_atividade ?? null,
                          rotulo_iniciativa: pdm.rotulo_iniciativa ?? null,
                          rotulo_macro_tema: pdm.rotulo_macro_tema ?? null,
                      }
                    : null,
            };
        });
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        const self = await this.prisma.distribuicaoRecursoVinculo.findFirst({
            where: { id, removido_em: null },
            select: { id: true },
        });
        if (!self) throw new HttpException('Vínculo não encontrado', 404);

        await this.prisma.distribuicaoRecursoVinculo.update({
            where: { id },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });
    }

    async invalidarVinculo(
        {
            id,
            projeto_id,
            meta_id,
            atividade_id,
            iniciativa_id,
        }: { id?: number; projeto_id?: number; meta_id?: number; atividade_id?: number; iniciativa_id?: number },
        motivo_invalido: string,
        prismaTx?: Prisma.TransactionClient
    ): Promise<void> {
        const executarInvalidacao = async (prismaTx: Prisma.TransactionClient) => {
            // Permite apenas um dos filtros.
            const filtrosUsados = [id, projeto_id, meta_id, atividade_id, iniciativa_id].filter((f) => f !== undefined);
            if (filtrosUsados.length === 0)
                throw new InternalServerErrorException('É necessário informar ao menos um filtro para invalidação');
            if (filtrosUsados.length > 1)
                throw new InternalServerErrorException('Apenas um filtro deve ser informado para invalidação');

            // Buscar vínculos que serão invalidados para preparar dados do email
            const vinculosAfetados = await prismaTx.distribuicaoRecursoVinculo.findMany({
                where: {
                    id,
                    projeto_id,
                    meta_id,
                    atividade_id,
                    iniciativa_id,
                    removido_em: null,
                    invalidado_em: null,
                },
                select: {
                    id: true,
                    campo_vinculo: true,
                    valor_vinculo: true,
                    distribuicao: {
                        select: {
                            nome: true,
                            valor: true,
                            orgao_gestor: {
                                select: {
                                    sigla: true,
                                },
                            },
                            transferencia: {
                                select: {
                                    identificador: true,
                                },
                            },
                        },
                    },
                    projeto: {
                        select: {
                            nome: true,
                            portfolio: {
                                select: {
                                    titulo: true,
                                },
                            },
                        },
                    },
                    meta: {
                        select: {
                            titulo: true,
                        },
                    },
                    iniciativa: {
                        select: {
                            titulo: true,
                        },
                    },
                    atividade: {
                        select: {
                            titulo: true,
                        },
                    },
                },
            });

            await prismaTx.distribuicaoRecursoVinculo.updateMany({
                where: {
                    id,
                    projeto_id,
                    meta_id,
                    atividade_id,
                    iniciativa_id,
                },
                data: {
                    invalidado_em: new Date(Date.now()),
                    motivo_invalido,
                },
            });

            // Preparar dados para o email
            const transferencias = vinculosAfetados.map((v) => {
                // Determinar tipo de módulo (Portfolio/PdM/PS)
                let tipo_modulo = '';
                let objeto_nome = '';

                if (v.projeto) {
                    tipo_modulo = `Portfólio: ${v.projeto.portfolio.titulo}`;
                    objeto_nome = v.projeto.nome;
                } else if (v.meta) {
                    tipo_modulo = 'PdM/Meta';
                    objeto_nome = v.meta.titulo;
                } else if (v.iniciativa) {
                    tipo_modulo = 'Iniciativa';
                    objeto_nome = v.iniciativa.titulo;
                } else if (v.atividade) {
                    tipo_modulo = 'Atividade';
                    objeto_nome = v.atividade.titulo;
                }

                return {
                    identificador: v.distribuicao.transferencia.identificador,
                    distribuicao: {
                        nome: v.distribuicao.nome || '',
                        orgao: {
                            sigla: v.distribuicao.orgao_gestor.sigla,
                        },
                        // Já formatando o valor para exibição (com centavos)
                        valor: v.distribuicao.valor?.toFixed(2).replace('.', ',') || ' ',
                    },
                    vinculo: {
                        tipo_modulo,
                        objeto_nome,
                        campo_vinculo: v.campo_vinculo === 'Endereco' ? 'Endereço' : 'Dotação',
                        valor_vinculo: v.valor_vinculo,
                    },
                };
            });

            const orgaoConfig = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ORGAO_ID');
            const orgaoId = orgaoConfig ? parseInt(orgaoConfig, 10) : null;
            if (!orgaoId) throw new Error('Erro ao buscar configuração de órgão para envio de email');
            const recipientes = await this.buscarRecipientesEmailCasaCivil(prismaTx, orgaoId);

            // Envio de e-mail notificando invalidação.
            for (const email of recipientes) {
                await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: 'Vínculo da transferência invalidado',
                        template: 'vinculo-invalidado.html',
                        to: email,
                        variables: {
                            transferencias,
                        },
                    },
                });
            }
        };

        if (prismaTx) {
            await executarInvalidacao(prismaTx);
        } else {
            await this.prisma.$transaction(executarInvalidacao);
        }
    }

    private async buscarRecipientesEmailCasaCivil(
        prismaTx: Prisma.TransactionClient,
        orgaoId: number
    ): Promise<string[]> {
        const gestoresCasaCivil = await prismaTx.pessoa.findMany({
            where: {
                desativado: false,
                PessoaPerfil: {
                    some: {
                        perfil_acesso: {
                            nome: CONST_PERFIL_CASA_CIVIL,
                        },
                    },
                },
                pessoa_fisica: {
                    orgao_id: orgaoId,
                },
            },
            select: { email: true },
        });

        const recipientes = [...new Set([...gestoresCasaCivil].map((item) => item.email))];

        return recipientes;
    }
}
