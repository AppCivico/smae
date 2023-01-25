import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
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
    * ID das pessoas responsáveis no orgao gestor [pessoas que aparecem no filtro do `gestor_de_projeto=true`]
    * @example "[]"
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    responsaveis_no_orgao_gestor: number[];

    /**
    * ID dos órgãos participantes do projeto
    * @example "[]"
    */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    orgaos_participantes: number[];

    /**
    * dentro dos órgãos participantes, qual é o órgão responsável
    * @example ""
    */
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    orgao_responsavel_id: number | null;

    /**
    * ID da pessoa responsável [pelo planejamento, são as pessoas filtradas pelo filtro `colaborador_de_projeto=true`]
    * @example ""
    */
    @IsInt({ message: '$property| responsavel_id precisa ser inteiro' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    responsavel_id: number | null;


    /**
    * nome (mínimo 1 char)
    * @example "name"
    */
    @IsString()
    @MaxLength(500)
    @MinLength(1)
    nome: string;

    /**
    * resumo (pode enviar string vazia)
    * @example "lorem..."
    */
    @IsString()
    @MaxLength(500)
    resumo: string;

    /**
    * previsao_inicio ou null
    * @example ""
    */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    previsao_inicio: Date | null;

    /**
    * previsao_inicio ou null
    * @example ""
    */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    previsao_termino: Date | null;

    /**
    * origem, obrigatório se não enviar `meta_id`, `iniciativa_id` ou `atividade_id`
    * @example "foobar"
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
    * @example ""
    */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Type(() => Number)
    iniciativa_id?: number;

    /**
    * atividade_id, se for por atividade
    * @example ""
    */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Type(() => Number)
    atividade_id?: number;

    /**
    * previsão de custo, número positivo com até 2 casas, pode enviar null
    * @example ""
    **/
    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
    @Min(0, { message: '$property| Custo precisa ser positivo' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    previsao_custo: number | null;

    // FONTE-RECURSO 1..N

    /**
    * escopo
    * @example "..."
    */
    @IsString()
    @MaxLength(50000)
    escopo: string;

    /**
    * principais_etapas
    * @example "1. doing xpto\n2. doing zoo"
    */
    @IsString()
    @MaxLength(50000)
    principais_etapas: string;

    /**
    * texto que representa a versão
    * @example "..."
    */
    @IsString()
    @MaxLength(20)
    versao: string;

    /**
    * data_aprovacao
    * @example "2022-01-20"
    */
    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_aprovacao: Date | null;
}
