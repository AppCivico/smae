import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PerfilResponsavelEquipe } from 'src/generated/prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateEquipeRespDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    @IsEnum(PerfilResponsavelEquipe)
    @ApiProperty({ enum: PerfilResponsavelEquipe, enumName: 'PerfilResponsavelEquipe' })
    perfil: PerfilResponsavelEquipe;

    @IsOptional()
    @ApiProperty({
        description:
            'Se não foi enviado, será associado automaticamente com o órgão do criador. Necessário `CadastroGrupoVariavel.administrador` para utilizar um órgão diferente.',
    })
    @IsInt()
    orgao_id?: number;

    /**
     * lista dos participantes do grupo? pode ficar vazio
     * cada pessoa precisa ter o privilégio `SMAE.GrupoVariavel.colaborador`
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMaxSize(10000, { message: '$property| precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    participantes: number[];

    /**
     * lista dos responsaveis do grupo? pode ficar vazio
     * cada pessoa precisa ter o privilégio `CadastroGrupoVariavel.colaborador_responsavel`
     * @example "[]"
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMaxSize(10000, { message: '$property| precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    colaboradores: number[];
}

export class UpdateEquipeRespDto extends PartialType(OmitType(CreateEquipeRespDto, ['orgao_id'])) {}
