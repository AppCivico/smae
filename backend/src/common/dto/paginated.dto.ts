import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";

export class PaginatedDto<TData> {
    @ApiProperty()
    has_more: boolean;

    @ApiProperty()
    next_page_token: string | null;

    @ApiHideProperty()
    rows: TData[];
}