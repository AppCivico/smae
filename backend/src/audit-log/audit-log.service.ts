import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { FilterAuditLogDto, GroupByFieldsDto, GroupByFilterDto } from './dto/audit-log.dto';
import { AuditLogDto, AuditLogSummaryRow } from './entities/audit-log.entity';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { SYSTEM_TIMEZONE } from '../common/date2ymd';

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

        const where: Prisma.LogGenericoWhereInput = {};
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
        if (!groupBy.group_by_date && !groupBy.group_by_contexto && !groupBy.group_by_pessoa_id) {
            throw new BadRequestException('Pelo menos um campo é obrigatório para agrupamento.');
        }

        // agrupa no banco: agrupar pelo criado_em cru (timestamp) devolvia uma linha por registro do log
        const dia = groupBy.group_by_date
            ? Prisma.sql`(criado_em AT TIME ZONE ${SYSTEM_TIMEZONE}::text)::date`
            : Prisma.sql`NULL::date`;
        const contexto = groupBy.group_by_contexto ? Prisma.sql`contexto` : Prisma.sql`NULL::text`;
        const pessoaId = groupBy.group_by_pessoa_id ? Prisma.sql`pessoa_id` : Prisma.sql`NULL::int`;

        // mesmos filtros do findAll
        const conds: Prisma.Sql[] = [Prisma.sql`TRUE`];
        if (filters.pessoa_id) conds.push(Prisma.sql`pessoa_id = ${filters.pessoa_id}::int`);
        if (filters.contexto) conds.push(Prisma.sql`strpos(lower(contexto), lower(${filters.contexto}::text)) > 0`);
        if (filters.log_contem) conds.push(Prisma.sql`strpos(lower(log), lower(${filters.log_contem}::text)) > 0`);
        if (filters.ip) conds.push(Prisma.sql`ip = ${filters.ip}::inet`);
        if (filters.criado_em_inicio)
            conds.push(Prisma.sql`criado_em >= ${new Date(filters.criado_em_inicio)}::timestamptz`);
        if (filters.criado_em_fim) conds.push(Prisma.sql`criado_em <= ${new Date(filters.criado_em_fim)}::timestamptz`);

        const rows = await this.prisma.$queryRaw<
            { dia: Date | null; contexto: string | null; pessoa_id: number | null; count: number }[]
        >`
            SELECT ${dia} AS dia, ${contexto} AS contexto, ${pessoaId} AS pessoa_id, count(*)::int AS count
            FROM log_generico
            WHERE ${Prisma.join(conds, ' AND ')}
            GROUP BY 1, 2, 3
            ORDER BY count DESC
        `;

        return rows.map((r) => ({
            count: r.count,
            date: r.dia ?? undefined,
            contexto: r.contexto ?? undefined,
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
