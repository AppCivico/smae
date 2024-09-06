import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

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
    total_registros_sem_filtros?: number;
}

export class AnyPageTokenJwtBody {
    search_hash: string;
    total_rows: number;
    issued_at: number;
    ipp: number;
}
