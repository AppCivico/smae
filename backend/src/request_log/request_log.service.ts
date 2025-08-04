import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { FilterRequestLogDto, GroupByFieldsDto } from './dto/request_log.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestLogDto, RequestSummaryRow } from './entities/request_log.entity';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from 'src/generated/prisma/client';

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}
function tryDecodeJson(input: string | null): string | object | null {
    if (!input) return input;
    if (typeof input == 'string' && input[0] == '{') {
        try {
            const decoded = JSON.parse(input);
            return decoded;
        } catch (error) {
            console.error('Error trying to parse JSON:', input);
        }
    }
    return input;
}
const validGroupByFields: Prisma.View_api_request_logScalarFieldEnum[] = [
    'request_date',
    'req_method',
    'req_path_clean',
    'res_code',
];

@Injectable()
export class RequestLogService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) {}

    async findAll(filters: FilterRequestLogDto): Promise<PaginatedDto<RequestLogDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const rows = await this.prisma.api_request_log.findMany({
            where: {
                created_pessoa_id: filters.created_pessoa_id,
                req_method: filters.req_method ? filters.req_method : undefined,
                req_path: filters.req_path_starts_with ? { startsWith: filters.req_path_starts_with } : undefined,
                res_code: filters.res_code ? filters.res_code : undefined,
                created_at: {
                    gte: filters.created_at_start ? new Date(filters.created_at_start) : undefined,
                    lte: filters.created_at_end ? new Date(filters.created_at_end) : undefined,
                },
            },
            orderBy: [{ created_at: 'desc' }, { request_num: 'desc' }],
            skip: offset,
            take: ipp + 1,
        });

        const linhas = rows.map((r) => {
            return {
                created_at: r.created_at,
                cf_ray: r.cf_ray,
                request_num: r.request_num,
                ip: r.ip,
                response_time: r.response_time,
                response_size: r.response_size,
                req_method: r.req_method,
                req_path: r.req_path,
                req_host: r.req_host,
                req_headers: tryDecodeJson(r.req_headers),
                req_query: tryDecodeJson(r.req_query),
                req_body: tryDecodeJson(r.req_body),
                req_body_size: r.req_body_size,
                res_code: r.res_code,
                created_pessoa_id: r.created_pessoa_id,
            };
        });

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
        };
    }

    async getSummary(filters: FilterRequestLogDto, groupBy: GroupByFieldsDto): Promise<RequestSummaryRow[]> {
        const groupByFields = validGroupByFields.filter((field) => (groupBy as any)[`group_by_${field}`] === true);

        if (groupByFields.length === 0) {
            throw new BadRequestException('Pelo menos um campo é obrigatório para agrupamento.');
        }

        const summary = await this.prisma.view_api_request_log.groupBy({
            by: groupByFields,
            _count: {
                _all: true,
            },
            where: {
                created_pessoa_id: filters.created_pessoa_id,
                req_method: filters.req_method ? filters.req_method : undefined,
                req_path: filters.req_path_starts_with ? { startsWith: filters.req_path_starts_with } : undefined,
                res_code: filters.res_code ? filters.res_code : undefined,
                created_at: {
                    gte: filters.created_at_start ? new Date(filters.created_at_start) : undefined,
                    lte: filters.created_at_end ? new Date(filters.created_at_end) : undefined,
                },
            },
            orderBy: [],
        });

        return summary
            .sort((a, b) => b._count._all - a._count._all)
            .map((r) => {
                return {
                    count: r._count._all,
                    ...{ ...r, _count: undefined },
                };
            });
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
