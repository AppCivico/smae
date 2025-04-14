import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCNPJ } from '../../common/decorators/IsCNPJ';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateOrgaoDto {
    /**
     * Sigla do Órgão
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Sigla' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    sigla: string;

    /**
     * Órgão
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;

    /**
     * Tipo do Órgão
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    tipo_orgao_id: number;

    @IsOptional()
    @IsString({ message: '$property| cnpj: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Cpnj' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @IsCNPJ()
    cnpj: string;

    @IsOptional()
    @IsString({ message: '$property| email: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'E-mail' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    email: string;

    @IsOptional()
    @IsString({ message: '$property| secretário responsável: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Secretário Responsável' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    secretario_responsavel: string;

    @IsOptional()
    @IsBoolean()
    oficial: boolean;

    @IsOptional()
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    nivel: number;

    @IsOptional()
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    parente_id: number | null;
}
