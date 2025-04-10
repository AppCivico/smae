import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { PerfilResponsavelEquipe } from '@prisma/client';
import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEquipeRespDto {
    @IsString()
    @MaxLength(255, {message: 'O campo "Título" deve ter no máximo 255 caracteres'})
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
