import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export const PAGINATION_TOKEN_TTL = 86400;
export class PaginatedDto<TData> {
    @ApiProperty()
    tem_mais: boolean;

    @ApiProperty()
    token_proxima_pagina: string | null;

    @ApiHideProperty()
    linhas: TData[];
}

export class PaginatedWithPagesDto<TData> {
    @ApiProperty()
    token_paginacao: string | null;

    @ApiProperty()
    paginas: number;

    @ApiProperty()
    pagina_corrente: number;

    @ApiProperty()
    tem_mais: boolean;

    @ApiProperty()
    total_registros: number;

    @ApiHideProperty()
    linhas: TData[];

    @ApiHideProperty()
    total_registros_revisados?: number;

    @ApiProperty()
    token_ttl: number = PAGINATION_TOKEN_TTL;
}

export class AnyPageTokenJwtBody {
    search_hash: string;
    total_rows: number;
    issued_at: number;
    ipp: number;
}
