import { ApiProperty } from '@nestjs/swagger';

export class ListWikiLinkDto {
    @ApiProperty()
    chave_smae: string;

    @ApiProperty()
    url_wiki: string;
}
