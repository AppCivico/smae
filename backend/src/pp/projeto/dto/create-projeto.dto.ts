import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateProjetoDto {
    /**
    * diretorio_id
    * @example ""
    */
    @IsOptional()
    @IsInt({ message: '$property| diretorio_id precisa ser inteiro' })
    @Type(() => Number)
    diretorio_id?: number;

    /**
    * nome
    * @example ""
    */
    @IsString()
    @MaxLength(500)
    @MinLength(1)
    nome: number;

    /**
    * resumo
    * @example ""
    */
    @IsString()
    @MaxLength(500)
    resumo: number;

    /**
    * previsao_inicio
    * @example ""
    */
    @IsString()
    @IsOnlyDate()
    @Type(() => Date)
    previsao_inicio: Date | null;

    /**
    * previsao_inicio
    * @example ""
    */
    @IsString()
    @IsOnlyDate()
    previsao_termino: Date | null;

    /**
    * origem, required se não enviar
    * meta_id, iniciativa_id ou atividade_id
    * @example ""
    */
    @IsOptional()
    @IsString()
    @MaxLength(500)
    origem_outro: string;

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

    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
    @Min(0, { message: '$property| Custo precisa ser positivo' })
    @Type(() => Number)
    previsao_custo: number;

    // FONTE-RECURSO 1..N
    // ORGAO 1..N

    /**
    * responsavel (id da pessoa que que for responsável)
    * @example "42"
    */
    @IsInt({ message: '$property| responsavel precisa ser positivo' })
    @Type(() => Number)
    responsavel: number;

    /**
    * escopo
    * @example ""
    */
    @IsString()
    @MaxLength(50000)
    escopo: string;

    /**
    * principais_etapas
    * @example ""
    */
    @IsString()
    @MaxLength(50000)
    principais_etapas: string;
}
