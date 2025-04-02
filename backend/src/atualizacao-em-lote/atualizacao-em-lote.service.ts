import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, TipoAtualizacaoEmLote } from '@prisma/client';
import { DateTime } from 'luxon';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { SYSTEM_TIMEZONE } from 'src/common/date2ymd';
import { PaginatedWithPagesDto, PAGINATION_TOKEN_TTL } from 'src/common/dto/paginated.dto';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    AtualizacaoEmLoteDetalheDto,
    AtualizacaoEmLoteResumoDto,
    FilterAtualizacaoEmLoteDto,
} from './dto/atualizacao-em-lote.dto';

interface NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class AtualizacaoEmLoteService {
    private readonly logger = new Logger(AtualizacaoEmLoteService.name);

    private readonly MODULE_ADMIN_PRIVILEGES: Partial<Record<TipoAtualizacaoEmLote, ListaDePrivilegios[]>> = {
        ProjetoPP: ['Projeto.administrador', 'Projeto.administrador_no_orgao'],
        ProjetoMDO: ['ProjetoMDO.administrador', 'ProjetoMDO.administrador_no_orgao'],
    };

    private readonly FULL_ADMIN_ROLE: Partial<Record<TipoAtualizacaoEmLote, ListaDePrivilegios>> = {
        ProjetoPP: 'Projeto.administrador',
        ProjetoMDO: 'ProjetoMDO.administrador',
    };

    private readonly ORG_ADMIN_ROLE: Partial<Record<TipoAtualizacaoEmLote, ListaDePrivilegios>> = {
        ProjetoPP: 'Projeto.administrador_no_orgao',
        ProjetoMDO: 'ProjetoMDO.administrador_no_orgao', // Corrected role
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    private async verificaPermissaoGeralTipoAtualizacao(
        user: PessoaFromJwt,
        tipoAtualizacao: TipoAtualizacaoEmLote
    ): Promise<void> {
        const rolesPermitidas = this.MODULE_ADMIN_PRIVILEGES[tipoAtualizacao];

        if (!rolesPermitidas) {
            this.logger.warn(
                `Tipo de atualização em lote ${tipoAtualizacao} não encontrado nas configurações de permissão.`
            );
            throw new NotFoundException(`Configuração de permissão não encontrada para o tipo ${tipoAtualizacao}.`);
        }

        if (!user.hasSomeRoles(rolesPermitidas)) {
            throw new BadRequestException(
                `Usuário sem permissão para acessar atualizações em lote do tipo ${tipoAtualizacao}.`
            );
        }
    }

    async findAllPaginated(
        filters: FilterAtualizacaoEmLoteDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<AtualizacaoEmLoteResumoDto>> {
        const modulo = user.assertOneModuloSistema('buscar', 'atualizações em lote');
        await this.verificaPermissaoGeralTipoAtualizacao(user, filters.tipo);

        const ipp = filters.ipp ?? 50;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
        }

        let criado_em_de: Date | undefined;
        let criado_em_ate: Date | undefined;

        if (filters.criado_em_de) {
            criado_em_de = DateTime.fromISO(filters.criado_em_de, { zone: SYSTEM_TIMEZONE }).startOf('day').toJSDate();
        }
        if (filters.criado_em_ate) {
            criado_em_ate = DateTime.fromISO(filters.criado_em_ate, { zone: SYSTEM_TIMEZONE }).endOf('day').toJSDate();
        }

        // Filtro de Permissão Específico por Orgão
        const fullAdminRole = this.FULL_ADMIN_ROLE[filters.tipo];
        const orgAdminRole = this.ORG_ADMIN_ROLE[filters.tipo];
        let filtroOrgao: number | undefined = undefined;
        const filtroCriadorEspecifico: number | undefined = filters.criado_por;

        const where: Prisma.AtualizacaoEmLoteWhereInput = {
            tipo: filters.tipo,
            status: filters.status ? { in: filters.status } : undefined,
            orgao_id: filtroOrgao,
            criado_por_id: filtroCriadorEspecifico,
            criado_em: {
                gte: criado_em_de,
                lte: criado_em_ate,
            },
            modulo_sistema: modulo,
            removido_em: null,
        };

        // Se o usuário NÃO tem a role de admin GERAL, MAS TEM a role de admin NO ORGAO
        if (fullAdminRole && !user.hasSomeRoles([fullAdminRole]) && orgAdminRole && user.hasSomeRoles([orgAdminRole])) {
            if (!user.orgao_id) {
                this.logger.error(`Usuário ${user.id} tem role ${orgAdminRole} mas não possui orgao_id no token JWT.`);
                throw new ForbiddenException(`Usuário ${orgAdminRole} sem órgão definido.`);
            }
            this.logger.verbose(
                `Usuário ${user.id} é ${orgAdminRole} no órgão ${user.orgao_id}, filtrando por orgao_id=${user.orgao_id}`
            );
            // Filtra para mostrar apenas os do seu órgão
            filtroOrgao = user.orgao_id;
        } else if (fullAdminRole && user.hasSomeRoles([fullAdminRole])) {
            this.logger.verbose(`Usuário ${user.id} é ${fullAdminRole}, sem filtro extra de órgão.`);
            // Admin geral vê tudo, não aplica filtro de órgão.
        } else {
            this.logger.warn(
                `Usuário ${user.id} passou na verificação geral para ${filters.tipo} mas não se encaixou nas roles específicas ${fullAdminRole}/${orgAdminRole}. Verifique as permissões.`
            );
            where.criado_por_id = user.id;
        }

        const [total_registros, linhas_com_extra] = await this.prisma.$transaction([
            this.prisma.atualizacaoEmLote.count({ where }),
            this.prisma.atualizacaoEmLote.findMany({
                where,
                select: {
                    id: true,
                    tipo: true,
                    status: true,
                    modulo_sistema: true,
                    n_total: true,
                    n_sucesso: true,
                    n_erro: true,
                    n_ignorado: true,
                    criado_em: true,
                    criador: {
                        select: { id: true, nome_exibicao: true },
                    },
                    iniciou_em: true,
                    terminou_em: true,
                    orgao: {
                        select: { id: true, sigla: true, descricao: true },
                    },
                },
                orderBy: { criado_em: 'desc' },
                skip: offset,
                take: ipp + 1,
            }),
        ]);

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;
        const linhas = [...linhas_com_extra];

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ offset: offset + ipp, ipp });
        }

        const paginas = Math.ceil(total_registros / ipp);
        const pagina_corrente = Math.floor(offset / ipp) + 1;

        // Map to DTO
        const linhasDto: AtualizacaoEmLoteResumoDto[] = linhas.map((log) => ({
            id: log.id,
            tipo: log.tipo,
            status: log.status,
            modulo_sistema: log.modulo_sistema,
            n_total: log.n_total,
            n_sucesso: log.n_sucesso,
            n_erro: log.n_erro,
            n_ignorado: log.n_ignorado,
            criado_em: log.criado_em,
            criador: log.criador,
            iniciou_em: log.iniciou_em,
            terminou_em: log.terminou_em,
            orgao: log.orgao ? { id: log.orgao.id, sigla: log.orgao.sigla, descricao: log.orgao.descricao } : null,
        }));

        return {
            linhas: linhasDto,
            paginas,
            pagina_corrente,
            total_registros,
            tem_mais,
            token_paginacao: token_proxima_pagina,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    async getById(id: number, user: PessoaFromJwt): Promise<AtualizacaoEmLoteDetalheDto> {
        const modulo = user.assertOneModuloSistema('buscar', 'atualizações em lote');

        const logBase = await this.prisma.atualizacaoEmLote.findUnique({
            where: { id, removido_em: null, modulo_sistema: modulo },
            select: {
                id: true,
                tipo: true,
                orgao_id: true,
                criado_por_id: true,
            },
        });

        if (!logBase) {
            throw new NotFoundException('Registro de atualização em lote não encontrado.');
        }

        await this.verificaPermissaoGeralTipoAtualizacao(user, logBase.tipo);

        const fullAdminRole = this.FULL_ADMIN_ROLE[logBase.tipo];
        const orgAdminRole = this.ORG_ADMIN_ROLE[logBase.tipo];

        // If user is ORG_ADMIN but NOT FULL_ADMIN, check if the log's orgao_id matches user's orgao_id
        if (fullAdminRole && !user.hasSomeRoles([fullAdminRole]) && orgAdminRole && user.hasSomeRoles([orgAdminRole])) {
            if (!user.orgao_id) {
                this.logger.error(
                    `Usuário ${user.id} tem role ${orgAdminRole} mas não possui orgao_id no token JWT. Tentando acessar log ${id}.`
                );
                throw new ForbiddenException(`Usuário ${orgAdminRole} sem órgão definido.`);
            }
            if (logBase.orgao_id !== user.orgao_id) {
                this.logger.warn(
                    `Usuário ${user.id} (${orgAdminRole} no órgão ${user.orgao_id}) tentou acessar log ${id} do órgão ${logBase.orgao_id}. Acesso negado.`
                );
                throw new ForbiddenException(
                    `Usuário não tem permissão para acessar este registro de atualização em lote (órgão diferente).`
                );
            }
            this.logger.verbose(
                `Usuário ${user.id} (${orgAdminRole}) autorizado a ver log ${id} do órgão ${logBase.orgao_id}.`
            );
        } else if (fullAdminRole && user.hasSomeRoles([fullAdminRole])) {
            // Full admin can see any log
            this.logger.verbose(`Usuário ${user.id} (${fullAdminRole}) autorizado a ver log ${id}.`);
        } else if (logBase.criado_por_id === user.id) {
            // User can see their own logs
            this.logger.verbose(`Usuário ${user.id} autorizado a ver seu próprio log ${id}.`);
        } else {
            this.logger.error(
                `Usuário ${user.id} passou na verificação geral para tipo ${logBase.tipo} mas falhou nas roles específicas ${fullAdminRole}/${orgAdminRole} ao tentar acessar log ${id}.`
            );
            throw new ForbiddenException('Falha inesperada na verificação de permissão.');
        }

        const logCompleto = await this.prisma.atualizacaoEmLote.findUnique({
            where: { id },
            include: {
                criador: {
                    select: { id: true, nome_exibicao: true },
                },
                task: { select: { id: true, type: true, status: true } },
                orgao: {
                    select: { id: true, sigla: true, descricao: true },
                },
            },
        });

        // Não deveria acontecer, mas vai que..
        if (!logCompleto) {
            throw new NotFoundException('Registro de atualização em lote não encontrado (fetch completo).');
        }

        const orgaoDto = logCompleto.orgao
            ? { id: logCompleto.orgao.id, sigla: logCompleto.orgao.sigla, descricao: logCompleto.orgao.descricao }
            : null;

        return {
            // Spread common fields from logCompleto
            id: logCompleto.id,
            tipo: logCompleto.tipo,
            status: logCompleto.status,
            modulo_sistema: logCompleto.modulo_sistema,
            n_total: logCompleto.n_total,
            n_sucesso: logCompleto.n_sucesso,
            n_erro: logCompleto.n_erro,
            n_ignorado: logCompleto.n_ignorado,
            criado_em: logCompleto.criado_em,
            criador: logCompleto.criador,
            iniciou_em: logCompleto.iniciou_em,
            terminou_em: logCompleto.terminou_em,
            orgao: orgaoDto,
            // Detalhes
            target_ids: logCompleto.target_ids ?? [],
            operacao: logCompleto.operacao ?? {},
            results_log: logCompleto.results_log ?? {},
        };
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            this.logger.debug('Token de paginação inválido ou expirado.');
            return null;
        }
        if (tmp && typeof tmp.offset === 'number' && typeof tmp.ipp === 'number') {
            return tmp;
        }
        this.logger.debug('Token de paginação com estrutura inválida.');
        return null;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        const expiresIn = PAGINATION_TOKEN_TTL ?? '1h';
        return this.jwtService.sign(opt, { expiresIn });
    }
}
