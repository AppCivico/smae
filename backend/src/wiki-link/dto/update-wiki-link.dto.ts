import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWikiLinkDto {
    @ApiProperty({ example: '/projetos/atualizado' })
    @IsString()
    @IsOptional()
    chave_smae?: string;

    @ApiProperty({ example: 'https://wiki.fgv.br/smae/projetos-atualizado' })
    @IsString()
    @IsOptional()
    url_wiki?: string;
}
