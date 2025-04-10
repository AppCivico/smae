import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGrupoPortfolioDto {
    @IsString()
    @MaxLength(255, { message: 'O campo "Título" deve ter no máximo 255 caracteres' })
    titulo: string;

    @IsOptional()
    @ApiProperty({
        description:
            'Se não foi enviado, será associado automaticamente com o órgão do criador. Necessário `CadastroGrupoPortfolio.administrador` para utilizar um órgão diferente.',
    })
    @IsInt()
    orgao_id?: number;

    /**
     * lista dos participantes do grupo? pode ficar vazio
     * cada pessoa precisa ter o privilégio `SMAE.espectador_de_projeto`
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMaxSize(10000, { message: '$property| precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    participantes: number[];
}
