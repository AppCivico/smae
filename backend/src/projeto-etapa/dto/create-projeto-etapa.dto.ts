import { IsBoolean, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';
import { MAX_DTO_SAFE_NUM } from '../../common/dto/consts';

export class CreateProjetoEtapaDto {
    /**
     * Descrição
     */
    @IsString({ message: 'descrição: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    descricao: string;

    @IsOptional()
    @IsNumber()
    portfolio_id?: number;

    @IsOptional()
    @IsNumber()
    etapa_padrao_id?: number;

    @IsOptional()
    @IsBoolean()
    eh_padrao?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(MAX_DTO_SAFE_NUM)
    ordem_painel: number;
}
