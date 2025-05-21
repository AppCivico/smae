import { ApiProperty } from '@nestjs/swagger';

export class WikiUrlDto {
  @ApiProperty()
  url_wiki: string;
}
