import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class AtualizacaoEmLoteService {
    private readonly logger = new Logger(AtualizacaoEmLoteService.name);

    private readonly MODULE_ADMIN_PRIVILEGES: Partial<Record<TipoAtualizacaoEmLote, ListaDePrivilegios[]>> = {
        'ProjetoPP': ['ProjetoMDO.administrador'],
        'ProjetoMDO': ['Projeto.administrador'],
    };

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    private async verificaPermissaoTipoAtualizacao(
        user: PessoaFromJwt,
        tipoAtualizacao: TipoAtualizacaoEmLote
    ): Promise<void> {
        const tipo = this.MODULE_ADMIN_PRIVILEGES[tipoAtualizacao];

        if (!tipo) {
            this.logger.warn(`Tipo de atualização em lote ${tipoAtualizacao} não encontrado.`);
            throw new NotFoundException('Tipo de atualização em lote não encontrado.');
        }

        if (!user.hasSomeRoles(tipo)) {
            throw new BadRequestException(
                `Usuário sem permissão para visualizar/criar atualizações em lote do módulo ${tipoAtualizacao}.`
            );
        }
    }

    async findAllPaginated(
        filters: FilterAtualizacaoEmLoteDto,
        user: PessoaFromJwt
    ): Promise<PaginatedWithPagesDto<AtualizacaoEmLoteResumoDto>> {
        const modulo = user.assertOneModuloSistema('buscar', 'atualizações em lote');
        await this.verificaPermissaoTipoAtualizacao(user, filters.tipo);

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

        const where: Prisma.AtualizacaoEmLoteWhereInput = {
            tipo: filters.tipo,
            status: filters.status ? { in: filters.status } : undefined,
            criado_por_id: filters.criado_por,
            criado_em: {
                gte: criado_em_de,
                lte: criado_em_ate,
            },
            modulo_sistema: modulo,
            removido_em: null,
        };

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
                },
                orderBy: { criado_em: 'desc' }, // Default sort order
                skip: offset,
                take: ipp + 1,
            }),
        ]);

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;
        const linhas = [...linhas_com_extra];

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop(); // Remove the extra item
            token_proxima_pagina = this.encodeNextPageToken({ offset: offset + ipp, ipp });
        }

        const paginas = Math.ceil(total_registros / ipp);
        const pagina_corrente = Math.floor(offset / ipp) + 1;

        return {
            linhas,
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
        const log = await this.prisma.atualizacaoEmLote.findUnique({
            where: { id, removido_em: null, modulo_sistema: modulo },
            include: {
                criador: {
                    select: { id: true, nome_exibicao: true },
                },
                // carrega a task para verificar detalhes e confirmar se está travada
                task: { select: { id: true, type: true, status: true } },
            },
        });

        if (!log) {
            throw new NotFoundException('Registro de atualização em lote não encontrado.');
        }

        await this.verificaPermissaoTipoAtualizacao(user, log.tipo);

        return {
            ...log,
            target_ids: log.target_ids ?? [],
            operacao: log.operacao ?? {},
            results_log: log.results_log ?? {},
        };
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Parâmetro token_proxima_pagina é inválido', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
