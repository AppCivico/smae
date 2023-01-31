import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class PaginatedDto<TData> {
    @ApiProperty()
    tem_mais: boolean;

    @ApiProperty()
    token_proxima_pagina: string | null;

    @ApiHideProperty()
    linhas: TData[];
}
