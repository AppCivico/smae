import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { FilterAuditLogDto, GroupByFieldsDto, GroupByFilterDto } from './dto/audit-log.dto';
import { AuditLogDto, AuditLogSummaryRow } from './entities/audit-log.entity';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';

class NextPageTokenJwtBody {
    offset!: number;
    ipp!: number;
}

@Injectable()
export class AuditLogService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async findAll(filters: FilterAuditLogDto): Promise<PaginatedDto<AuditLogDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ?? 25;
        let offset = 0;

        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);
        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const where: any = {};
        if (filters.pessoa_id) where.pessoa_id = filters.pessoa_id;
        if (filters.contexto) where.contexto = { contains: filters.contexto, mode: 'insensitive' };
        if (filters.log_contem) where.log = { contains: filters.log_contem, mode: 'insensitive' };
        if (filters.ip) where.ip = filters.ip;
        if (filters.criado_em_inicio || filters.criado_em_fim) {
            where.criado_em = {
                gte: filters.criado_em_inicio ? new Date(filters.criado_em_inicio) : undefined,
                lte: filters.criado_em_fim ? new Date(filters.criado_em_fim) : undefined,
            };
        }

        const rows = await this.prisma.logGenerico.findMany({
            where,
            orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
            skip: offset,
            take: ipp + 1,
            include: {
                pessoa: {
                    select: { nome_exibicao: true },
                },
            },
        });

        const linhas: AuditLogDto[] = rows.map((r) => ({
            id: r.id,
            contexto: r.contexto,
            ip: r.ip,
            log: r.log,
            pessoa_id: r.pessoa_id ?? null,
            pessoa_nome: r.pessoa?.nome_exibicao ?? undefined,
            pessoa_sessao_id: r.pessoa_sessao_id ?? null,
            criado_em: r.criado_em,
        }));

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp, offset: offset + ipp });
        }

        return {
            tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina,
            linhas,
        };
    }

    async getSummary(filters: GroupByFilterDto, groupBy: GroupByFieldsDto): Promise<AuditLogSummaryRow[]> {
        const groupByFields: Array<'criado_em' | 'contexto' | 'pessoa_id'> = [];

        if (groupBy.group_by_date) groupByFields.push('criado_em');
        if (groupBy.group_by_contexto) groupByFields.push('contexto');
        if (groupBy.group_by_pessoa_id) groupByFields.push('pessoa_id');

        if (groupByFields.length === 0) {
            throw new BadRequestException('Pelo menos um campo é obrigatório para agrupamento.');
        }

        const summary = await this.prisma.logGenerico.groupBy({
            by: groupByFields,
            _count: {
                _all: true,
            },
            where: {
                pessoa_id: filters.pessoa_id,
                contexto: filters.contexto,
                log: filters.log_contem ? { contains: filters.log_contem, mode: 'insensitive' } : undefined,
                ip: filters.ip,
                criado_em: {
                    gte: filters.criado_em_inicio ? new Date(filters.criado_em_inicio) : undefined,
                    lte: filters.criado_em_fim ? new Date(filters.criado_em_fim) : undefined,
                },
            },
            orderBy: [],
        });

        if (groupBy.group_by_date) {
            const agg = new Map<string, AuditLogSummaryRow>();
            for (const r of summary) {
                const day = r.criado_em ? r.criado_em.toISOString().slice(0, 10) : undefined; // UTC day
                const key = JSON.stringify([day, r.contexto, r.pessoa_id]);
                const curr = agg.get(key) ?? {
                    count: 0,
                    date: day ? new Date(`${day}T00:00:00.000Z`) : undefined,
                    contexto: r.contexto,
                    pessoa_id: r.pessoa_id ?? undefined,
                };
                curr.count += r._count._all;
                agg.set(key, curr);
            }
            return [...agg.values()].sort((a, b) => b.count - a.count);
        }
        return summary.map((r) => ({
            count: r._count._all,
            date: undefined,
            contexto: r.contexto,
            pessoa_id: r.pessoa_id ?? undefined,
        }));
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }
}
