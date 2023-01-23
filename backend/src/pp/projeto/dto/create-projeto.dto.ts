import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";
import { IsOnlyDate } from "src/common/decorators/IsDateOnly";

export class CreateProjetoDto {
    /**
    * portfolio_id
    * @example ""
    */
    @IsInt({ message: '$property| portfolio_id precisa ser inteiro' })
    @Type(() => Number)
    portfolio_id: number;

    /**
    * ID do órgão gestor
    * @example ""
    */
    @IsInt({ message: '$property| orgao_gestor_id precisa ser inteiro' })
    @Type(() => Number)
    orgao_gestor_id: number;

    /**
    * ID das pessoas responsáveis no orgao gestor
    * @example ""
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    responsaveis_no_orgao_gestor: number[];

    /**
    * ID dos órgãos participantes do projeto
    * @example ""
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    orgaos_participantes: number[];

    /**
    * ID da pessoa responsável [apos o planejamento]
    * @example ""
    */
    @IsInt({ message: '$property| responsavel_id precisa ser inteiro' })
    @Type(() => Number)
    responsavel_id: number | null;


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


    /**
    * texto que representa a versão
    * @example ""
    */
    @IsString()
    @MaxLength(20)
    versao: string;

    /**
    * data_aprovacao
    * @example ""
    */
    @IsString()
    @IsOnlyDate()
    data_aprovacao: Date | null;

}
