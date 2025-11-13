import { HttpException, Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjetoEtapaDto } from './dto/create-projeto-etapa.dto';
import { UpdateProjetoEtapaDto } from './dto/update-projeto-etapa.dto';
import { TipoProjeto } from '@prisma/client';
import { FilterProjetoEtapaDto } from './dto/filter-projeto-etapa.dto';
import { PortfolioService } from 'src/pp/portfolio/portfolio.service';
import { ProjetoEtapaDto } from './entities/projeto-etapa.entity';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';

@Injectable()
export class ProjetoEtapaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly portfolioService: PortfolioService
    ) {}

    private getRequiredPrivilege(
        tipo: TipoProjeto,
        ehPadrao: boolean,
        action: 'inserir' | 'editar' | 'remover'
    ): ListaDePrivilegios {
        const baseName = ehPadrao ? 'CadastroProjetoEtapaPadrao' : 'CadastroProjetoEtapa';
        const suffix = tipo === 'PP' ? '' : 'MDO';
        return `${baseName}${suffix}.${action}`;
    }

    private checkPermission(
        user: PessoaFromJwt,
        tipo: TipoProjeto,
        ehPadrao: boolean,
        action: 'inserir' | 'editar' | 'remover'
    ): void {
        const privilege = this.getRequiredPrivilege(tipo, ehPadrao, action);

        if (!user.hasSomeRoles([privilege])) {
            const actionMap = {
                inserir: 'criar',
                editar: 'editar',
                remover: 'remover',
            };
            const actionType = ehPadrao ? 'etapa padrão' : 'etapa de portfólio';
            throw new HttpException(
                `Sem permissão para ${actionMap[action]} ${actionType}. Privilégio necessário: ${privilege}`,
                403
            );
        }
    }

    async create(tipo: TipoProjeto, dto: CreateProjetoEtapaDto, user: PessoaFromJwt) {
        // Verificar se é padrão.
        const eh_padrao = dto.eh_padrao ?? false;

        // Verificar se o usuário tem permissão para criar o tipo de etapa solicitado
        this.checkPermission(user, tipo, eh_padrao, 'inserir');

        const similarExists = await this.prisma.projetoEtapa.count({
            where: {
                tipo_projeto: tipo,
                descricao: { equals: dto.descricao, mode: 'insensitive' },
                removido_em: null,
                eh_padrao: eh_padrao,
            },
        });

        if (similarExists > 0)
            throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);

        // Caso informe que é padrão, não pode mandar "etapa_padrao_id"
        if (dto.eh_padrao && dto.etapa_padrao_id)
            throw new HttpException('Não pode informar etapa padrão se o registro for padrão', 400);

        // Validar etapa_padrao_id se fornecido
        if (dto.etapa_padrao_id) {
            const etapaPadrao = await this.prisma.projetoEtapa.findFirst({
                where: {
                    id: dto.etapa_padrao_id,
                    tipo_projeto: tipo,
                    eh_padrao: true,
                    removido_em: null,
                },
            });

            if (!etapaPadrao) {
                throw new HttpException(
                    'A etapa padrão informada não existe, não é do mesmo tipo ou não está marcada como padrão',
                    400
                );
            }
        }

        // Processar ordem_painel se eh_padrao=true
        let ordem_painel: number | null = null;
        if (eh_padrao) {
            // Se forneceu ordem_painel no dto
            if (dto.ordem_painel !== undefined && dto.ordem_painel !== null) {
                // Se <= 0, usar 1
                let ordemDesejada = dto.ordem_painel <= 0 ? 1 : dto.ordem_painel;

                // Buscar o máximo atual
                const maxOrdem = await this.prisma.projetoEtapa.aggregate({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                    },
                    _max: {
                        ordem_painel: true,
                    },
                });

                const maxAtual = maxOrdem._max.ordem_painel ?? 0;

                // Se ordem desejada > max+1, truncar para max+1
                if (ordemDesejada > maxAtual + 1) {
                    ordemDesejada = maxAtual + 1;
                }

                // Mover registros existentes para cima (incrementar ordem_painel dos registros >= ordem desejada)
                await this.prisma.projetoEtapa.updateMany({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                        ordem_painel: {
                            gte: ordemDesejada,
                        },
                    },
                    data: {
                        ordem_painel: {
                            increment: 1,
                        },
                    },
                });

                ordem_painel = ordemDesejada;
            } else {
                // Não forneceu ordem_painel, usar MAX+1
                const maxOrdem = await this.prisma.projetoEtapa.aggregate({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                    },
                    _max: {
                        ordem_painel: true,
                    },
                });

                ordem_painel = (maxOrdem._max.ordem_painel ?? 0) + 1;
            }
        }

        const created = await this.prisma.projetoEtapa.create({
            data: {
                portfolio_id: dto.portfolio_id,
                etapa_padrao_id: dto.etapa_padrao_id,
                tipo_projeto: tipo,
                criado_por: user.id,
                criado_em: new Date(Date.now()),
                descricao: dto.descricao,
                eh_padrao: dto.eh_padrao,
                ordem_painel: ordem_painel,
            },
            select: { id: true },
        });

        return created;
    }

    async findAll(tipo: TipoProjeto, filters: FilterProjetoEtapaDto, user: PessoaFromJwt): Promise<ProjetoEtapaDto[]> {
        // Chamando findAll para verificar acesso.
        let portfoliosId = [];

        if (filters?.portfolio_id) {
            const portfolio = await this.portfolioService.findOne(tipo, filters.portfolio_id, user);
            if (!portfolio) throw new HttpException('Portfólio não encontrado ou sem permissão para acesso', 400);
            portfoliosId = [filters.portfolio_id];
        } else {
            const portfolios = await this.portfolioService.findAll(tipo, user, true);
            portfoliosId = portfolios.map((p) => p.id);
        }

        // Caso filtre por "eh_padrao", não olhamos o portfolio (isso para PP, para obras ainda olha)
        const ehTelaAssociacao = filters.eh_padrao === undefined || filters.eh_padrao === false;

        if (ehTelaAssociacao && filters?.portfolio_id)
            throw new HttpException('Não é possível filtrar por portfólio quando o filtro eh_padrao está ativo', 400);

        const listActive = await this.prisma.projetoEtapa.findMany({
            where: {
                removido_em: null,
                tipo_projeto: tipo,
                ...(ehTelaAssociacao ? { portfolio_id: { in: portfoliosId } } : { portfolio_id: undefined }),
                eh_padrao: filters.eh_padrao,
            },
            select: {
                id: true,
                descricao: true,
                eh_padrao: true,
                ordem_painel: true,
                portfolio: {
                    select: {
                        id: true,
                        titulo: true,
                    },
                },
                etapa_padrao: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },
            },
            orderBy: ehTelaAssociacao
                ? [
                      {
                          portfolio: {
                              titulo: 'asc',
                          },
                      },
                      { descricao: 'asc' },
                  ]
                : [{ ordem_painel: 'asc' }, { descricao: 'asc' }],
        });

        return listActive;
    }

    async update(tipo: TipoProjeto, id: number, dto: UpdateProjetoEtapaDto, user: PessoaFromJwt) {
        const self = await this.prisma.projetoEtapa.findFirstOrThrow({
            where: { id: id, tipo_projeto: tipo },
            include: { EtapaPadrao: true },
        });

        // BUSINESS RULE VALIDATIONS (before permission checks)

        // Caso tenha etapas que utilizam a row como padrão, não pode deixar de ser padrão.
        if (self.eh_padrao && dto.eh_padrao === false && self.EtapaPadrao.length > 0) {
            throw new HttpException(
                `Não pode deixar de ser padrão, existem ${self.EtapaPadrao.length} etapa(s) que utilizam esta etapa como padrão`,
                400
            );
        }

        // Vendo se não está tentando colocar "self" como padrão
        if (dto.etapa_padrao_id === id) {
            throw new HttpException('Não pode informar a própria etapa como padrão', 400);
        }

        // Se está se tornando padrão, não pode ter etapa_padrao_id
        if (!self.eh_padrao && dto.eh_padrao && dto.etapa_padrao_id) {
            throw new HttpException(
                'Não pode transformar em etapa padrão, pois já existe uma etapa padrão associada.',
                400
            );
        }

        // Validar etapa_padrao_id se fornecido
        if (dto.etapa_padrao_id !== undefined && dto.etapa_padrao_id !== null) {
            const etapaPadrao = await this.prisma.projetoEtapa.findFirst({
                where: {
                    id: dto.etapa_padrao_id,
                    tipo_projeto: tipo,
                    eh_padrao: true,
                    removido_em: null,
                },
            });

            if (!etapaPadrao) {
                throw new HttpException(
                    'A etapa padrão informada não existe, não é do mesmo tipo ou não está marcada como padrão',
                    400
                );
            }
        }

        // PERMISSION VALIDATIONS

        // Determinar o tipo final de etapa (padrão ou portfólio)
        const ehPadraoFinal = dto.eh_padrao ?? self.eh_padrao;

        // Verificar se o usuário tem permissão para editar o tipo de etapa
        this.checkPermission(user, tipo, ehPadraoFinal, 'editar');

        // Se estiver mudando de tipo (padrao para portfolio ou vice-versa), verificar ambas as permissões
        if (dto.eh_padrao !== undefined && dto.eh_padrao !== self.eh_padrao) {
            const newPrivilege = this.getRequiredPrivilege(tipo, dto.eh_padrao, 'editar');
            const originalPrivilege = this.getRequiredPrivilege(tipo, self.eh_padrao, 'editar');

            if (!user.hasSomeRoles([newPrivilege]) || !user.hasSomeRoles([originalPrivilege])) {
                throw new HttpException(
                    `Sem permissão para converter entre etapa padrão e etapa de portfólio. São necessários os privilégios: ${originalPrivilege} e ${newPrivilege}`,
                    403
                );
            }
        }

        if (dto.descricao !== undefined) {
            const similarExists = await this.prisma.projetoEtapa.count({
                where: {
                    tipo_projeto: tipo,
                    descricao: { equals: dto.descricao, mode: 'insensitive' },
                    removido_em: null,
                    NOT: { id: id },
                    eh_padrao: dto.eh_padrao ?? self.eh_padrao,
                },
            });

            if (similarExists > 0)
                throw new HttpException('Descrição igual ou semelhante já existe em outro registro ativo', 400);
        }

        // Processar ordem_painel
        // ehPadraoFinal já foi determinado anteriormente para validação de permissões
        let ordem_painel = self.ordem_painel;

        if (ehPadraoFinal) {
            // Se está se tornando padrão pela primeira vez, ou se forneceu ordem_painel
            const isBecomingPadrao = !self.eh_padrao && ehPadraoFinal;
            const ordemPainelFornecida = dto.ordem_painel !== undefined && dto.ordem_painel !== null;

            if (isBecomingPadrao && !ordemPainelFornecida) {
                // Está se tornando padrão e não forneceu ordem_painel, usar MAX+1
                const maxOrdem = await this.prisma.projetoEtapa.aggregate({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                    },
                    _max: {
                        ordem_painel: true,
                    },
                });

                ordem_painel = (maxOrdem._max.ordem_painel ?? 0) + 1;
            } else if (ordemPainelFornecida) {
                // Forneceu ordem_painel no dto
                // Se <= 0, usar 1
                let ordemDesejada = dto.ordem_painel! <= 0 ? 1 : dto.ordem_painel!;

                // Buscar o máximo atual (excluindo o próprio registro)
                const maxOrdem = await this.prisma.projetoEtapa.aggregate({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                        NOT: { id: id },
                    },
                    _max: {
                        ordem_painel: true,
                    },
                });

                const maxAtual = maxOrdem._max.ordem_painel ?? 0;

                // Se ordem desejada > max+1, truncar para max+1
                if (ordemDesejada > maxAtual + 1) {
                    ordemDesejada = maxAtual + 1;
                }

                // Se a ordem mudou, precisamos reorganizar
                if (ordemDesejada !== self.ordem_painel) {
                    // Mover registros existentes para cima (incrementar ordem_painel dos registros >= ordem desejada)
                    await this.prisma.projetoEtapa.updateMany({
                        where: {
                            tipo_projeto: tipo,
                            removido_em: null,
                            eh_padrao: true,
                            NOT: { id: id },
                            ordem_painel: {
                                gte: ordemDesejada,
                            },
                        },
                        data: {
                            ordem_painel: {
                                increment: 1,
                            },
                        },
                    });
                }

                ordem_painel = ordemDesejada;
            }
            // Se não forneceu ordem_painel e já era padrão, mantém o que estava (preload from db)
        }

        await this.prisma.projetoEtapa.update({
            where: { id: id },
            data: {
                atualizado_por: user.id,
                atualizado_em: new Date(Date.now()),
                descricao: dto.descricao,
                portfolio_id: dto.portfolio_id,
                etapa_padrao_id: dto.etapa_padrao_id,
                eh_padrao: dto.eh_padrao,
                ordem_painel: ordem_painel,
            },
        });

        return { id };
    }

    async remove(tipo: TipoProjeto, id: number, user: PessoaFromJwt) {
        const self = await this.prisma.projetoEtapa.findFirst({
            where: { id: id, tipo_projeto: tipo, removido_em: null },
            select: { eh_padrao: true, ordem_painel: true },
        });

        if (!self) {
            throw new HttpException('Etapa não encontrada', 404);
        }

        // Verificar se o usuário tem permissão para remover o tipo de etapa
        this.checkPermission(user, tipo, self.eh_padrao, 'remover');

        const emUso = await this.prisma.projeto.count({
            where: { tipo, removido_em: null, projeto_etapa_id: id },
        });
        if (emUso > 0) throw new HttpException('Etapa em uso em projetos.', 400);

        const emUsoPadrao = await this.prisma.projetoEtapa.count({
            where: { tipo_projeto: tipo, removido_em: null, etapa_padrao_id: id },
        });
        if (emUsoPadrao > 0) throw new HttpException('Etapa em uso como padrão em outras etapas.', 400);

        // test if projeto is using this etapa
        const projetoEmUso = await this.prisma.projeto.count({
            where: { tipo, removido_em: null, projeto_etapa_id: id },
        });
        if (projetoEmUso > 0) {
            throw new HttpException(`Etapa em uso em ${projetoEmUso} projetos.`, 400);
        }

        // self já foi carregado anteriormente para validação de permissões

        const created = await this.prisma.$transaction(async (prismaTx) => {
            const result = await prismaTx.projetoEtapa.updateMany({
                where: { id: id, tipo_projeto: tipo },
                data: {
                    removido_por: user.id,
                    removido_em: new Date(Date.now()),
                },
            });

            if (self?.eh_padrao && self.ordem_painel !== null) {
                await prismaTx.projetoEtapa.updateMany({
                    where: {
                        tipo_projeto: tipo,
                        removido_em: null,
                        eh_padrao: true,
                        ordem_painel: {
                            gt: self.ordem_painel,
                        },
                    },
                    data: {
                        ordem_painel: {
                            decrement: 1,
                        },
                    },
                });
            }

            return result;
        });

        return created;
    }
}
