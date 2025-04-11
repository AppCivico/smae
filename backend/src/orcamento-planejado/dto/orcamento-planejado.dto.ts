import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, MaxLength } from 'class-validator';
import { OrcamentoPlanejado } from '../entities/orcamento-planejado.entity';

export class CreateOrcamentoPlanejadoDto {
    /**
     * meta_id, se for por meta
     * @example "42"
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id?: number;

    /**
     * iniciativa_id, se for por iniciativa
     * @example "42"
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
     * atividade_id, se for por atividade
     * @example "42"
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Type(() => Number)
    atividade_id?: number;

    /**
     * ano_referencia
     * @example "2022"
     */
    @IsOptional()
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
     * Valor Planejado
     * @example "42343.34"
     */
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Planejado com até duas casas decimais' }
    )
    @IsPositive({ message: '$property| Investimento precisa ser positivo' })
    @Type(() => Number)
    valor_planejado: number;

    /**
     * dotacao: esperado exatamente
     * @example "00.00.00.000.0000.0.000.00000000.00"
     */
    @IsString()
    @MaxLength(40)
    @Matches(/^\d{2}\.\d{2}\.\d{2}\.\d{3}\.\d{4}\.\d\.\d{3}\.\d{8}\.\d{2}$/, {
        message: 'Dotação não está no formato esperado: 00.00.00.000.0000.0.000.00000000.00',
    })
    dotacao: string;
}

export class UpdateOrcamentoPlanejadoDto extends OmitType(CreateOrcamentoPlanejadoDto, ['ano_referencia', 'dotacao']) {}

export class FilterOrcamentoPlanejadoDto {
    /**
     * Filtrar por meta_id: eg: 205
     * @example ""
     */
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id: number;

    /**
     * Filtrar por meta_id: eg: 00.00.00.000.0000.0.000.00000000.00
     * @example ""
     */
    @IsOptional()
    @IsString()
    dotacao?: string;

    /**
     * Sempre é necessário passar o ano_referencia eg: 2022
     * @example ""
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;
}

export class ListOrcamentoPlanejadoDto {
    linhas: OrcamentoPlanejado[];
}
