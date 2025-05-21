import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WikiLinkDto {
  @ApiProperty({
    example: '/projetos/cadastro',
    description: 'Chave da tela do SMAE que está chamando a Wiki',
  })
  @IsString()
  @IsNotEmpty()
  url: string;
}
