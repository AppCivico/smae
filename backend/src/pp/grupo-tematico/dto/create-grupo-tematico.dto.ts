import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateGrupoTematicoDto {
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
