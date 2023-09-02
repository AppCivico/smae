import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, Min } from 'class-validator';
import { ParteDotacaoDto } from '../../dotacao/dto/dotacao.dto';
import { MetaOrcamento } from '../entities/meta-orcamento.entity';
import { IdNomeExibicao } from '../../variavel/entities/variavel.entity';

export class CreateMetaOrcamentoDto extends ParteDotacaoDto {
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
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
     * Custo previsto
     * @example "2341242423.34"
     */
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Custo até duas casas decimais' }
    )
    @Min(0, { message: '$property| Custo precisa ser positivo' })
    @Type(() => Number)
    custo_previsto: number;
}

// deixa mudar praticamente tudo, pois não há contas, então pode mudar a parte-dotação e etc
export class UpdateMetaOrcamentoDto extends OmitType(PartialType(CreateMetaOrcamentoDto), ['ano_referencia']) {}

export class FilterMetaOrcamentoDto {
    /**
     * Filtrar por meta_id
     * @example "42"
     */
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id: number;

    /**
     * Filtrar por ano_referencia?
     * @example "2022"
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;
}

export class OrcamentoPrevistoEhZeroStatusDto {
    previsto_eh_zero: boolean;
    previsto_eh_zero_criado_por: IdNomeExibicao | null;
    previsto_eh_zero_criado_em: Date | null;
}

export class UpdateOrcamentoPrevistoZeradoDto {
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Type(() => Number)
    meta_id: number;

    /**
     * ano_referencia
     * @example "2022"
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;

    /**
     * Se o valor o valor Previsto para o ano deve ser zero
     * @example true
     */
    @IsBoolean({ message: '$property| Precisa ser um booleano' })
    @Type(() => Boolean)
    considerar_zero: boolean;
}

export class ListMetaOrcamentoDto extends OrcamentoPrevistoEhZeroStatusDto {
    linhas: MetaOrcamento[];
}
