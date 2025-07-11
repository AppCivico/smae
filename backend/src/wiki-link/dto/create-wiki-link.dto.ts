import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWikiLinkDto {
    @ApiProperty({ example: '/projetos/cadastro' })
    @IsString()
    @IsNotEmpty()
    chave_smae: string;

    @ApiProperty({ example: 'https://wiki.fgv.br/smae/projetos-cadastro' })
    @IsString()
    @IsNotEmpty()
    url_wiki: string;
}
