import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGrupoTematicoDto {
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;

    @IsBoolean()
    @IsOptional()
    programa_habitacional?: boolean | undefined;

    @IsBoolean()
    @IsOptional()
    unidades_habitacionais?: boolean | undefined;

    @IsBoolean()
    @IsOptional()
    familias_beneficiadas?: boolean | undefined;

    @IsBoolean()
    @IsOptional()
    unidades_atendidas?: boolean | undefined;
}
