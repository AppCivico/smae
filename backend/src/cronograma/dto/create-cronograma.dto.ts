import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

export class CreateCronogramaDto {
    /**
     * meta_id
     */
    @IsInt({ message: '$property| meta precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    meta_id?: number;

    /**
     * iniciativa_id
     */
    @IsInt({ message: '$property| iniciativa precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    iniciativa_id?: number;

    /**
     * atividade_id
     */
    @IsInt({ message: '$property| atividade precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    atividade_id?: number;

    /**
     * descricao
     */
    @IsString({ message: '$property| descricao: Precisa ser alfanumérico' })
    @IsOptional()
    descricao?: string;

    /**
     * observacao
     */
    @IsString({ message: '$property| observacao: Precisa ser alfanumérico' })
    @IsOptional()
    observacao?: string;

    @IsBoolean({ message: '$property| precisa ser um boolean' })
    regionalizavel: boolean;

    @IsInt({ message: '$property| atividade precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    nivel_regionalizacao?: number;
}
