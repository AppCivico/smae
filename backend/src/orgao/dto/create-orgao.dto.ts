import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsCNPJ } from '../../common/decorators/IsCNPJ';

export class CreateOrgaoDto {
    /**
     * Sigla do Órgão
     */
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| sigla: Máximo 20 caracteres' })
    sigla: string;

    /**
     * Órgão
     */
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao: string;

    /**
     * Tipo do Órgão
     */
    @IsInt({ message: '$property| precisa ser um número' })
    @Type(() => Number)
    tipo_orgao_id: number;

    @IsOptional()
    @IsString({ message: '$property| cnpj: Precisa ser alfanumérico' })
    @MaxLength(20, { message: '$property| cnpj: Máximo 20 caracteres' })
    @IsCNPJ()
    cnpj: string;

    @IsOptional()
    @IsString({ message: '$property| email: Precisa ser alfanumérico' })
    @MaxLength(100, { message: '$property| email: Máximo 100 caracteres' })
    email: string;

    @IsOptional()
    @IsString({ message: '$property| secretário responsável: Precisa ser alfanumérico' })
    @MaxLength(100, { message: '$property| secretário responsável: Máximo 100 caracteres' })
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
