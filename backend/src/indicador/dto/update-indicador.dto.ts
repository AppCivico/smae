import { OmitType, PartialType } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsBoolean,
    IsInt,
    IsNumberString,
    IsOptional,
    IsString,
    Matches,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { CreateIndicadorDto } from './create-indicador.dto';

export class FormulaVariaveis {
    /**
     * referência da variavel, único por indicador - Regexp: ^_[0-9]{1,8}$
     * @example "_1159"
     */
    @IsString({ message: '$property| precisa ser uma string' })
    @Matches(/^_\d{1,8}$/, {
        message: '$property| Inválido, precisa começar com _ e ter entre 1 até 8 dígitos numéricos',
    })
    referencia: string;

    /**
     * janela
     *
     * = 1 para periodo corrente,
     *
     * < 1 para buscar o mês retroativo
     *
     * > 1 para fazer média dos valores neste periodo de meses
     *
     * 0 será convertido para 1 automaticamente
     */
    @IsInt({ message: '$property| descrição: Precisa ser um número' })
    @Transform((a: TransformFnParams) => (+a.value === 0 ? 1 : +a.value))
    janela: number;

    /**
     * ID da variavel
     */
    @IsInt({ message: '$property| precisa ser um número' })
    variavel_id: number;

    /**
     * Usar serie acumulada
     */
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    usar_serie_acumulada: boolean;
}

export class UpdateIndicadorDto extends OmitType(PartialType(CreateIndicadorDto), [
    'meta_id',
    'iniciativa_id',
    'atividade_id',
    'regionalizavel',
    'nivel_regionalizacao',
    'periodicidade',
] as const) {
    /**
     * Expressão para montar calcular as series do indicador.
     *
     * Para funções, veja o [manual do PostgreSQL](https://www.postgresql.org/docs/14/functions-math.html) para entender o funcionamento.
     *
     *
     * Funções com 1 parâmetro (sempre obrigatórios):
     *   `FACTORIAL(expr)`, `ABS(expr)`, `LN(expr)`, `FLOOR(expr)`, `CEIL(expr)`, `EXP(expr)`
     *
     *
     * Funções com 2 parâmetros (sempre obrigatórios):
     *   `ROUND(expr, precision)`, `POWER(a, raisedToPower)`, `LOG(base, toLogOfBase)`, `NULLIF(expr, ifNullValue)`, `DIV(expr, expr)`, `MOD(expr, expr)`
     *
     * Fórmula composta
     *
     *  `@_1` onde 1 é o ID da formula Fórmula Composta (não é o ID da FK, no caso do Fórmula Composta herdadas)
     *
     * Operações:
     *
     *  `*` multiplicação
     *
     *  `/` divisão
     *
     * `-` subtração
     *
     * `+` soma
     *
     * `^` exponencial (precedência esquerda pra direita)
     *
     *
     * Referências das variáveis enviar "$_" + entre 1 até 8 números
     *
     * A referência não pode ser repetida entre o mesmo indicador.
     *
     * @example "CEIL($_1 + $_2) / 100.4 * POWER($_2 + LN($_1), 1) * FLOOR(1- 1 / 2) + LOG(2, 4) + @_1"
     */
    @IsOptional()
    @IsString({ message: '$property| Precisa ser um texto de formula válido' })
    @ValidateIf((object, value) => value !== null)
    formula?: string | null;

    /**
     * Variáveis para usar na expressão
     */
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => FormulaVariaveis)
    @ArrayMaxSize(100000, { message: 'Variáveis de expressão precisa ter no máximo 100000 items' })
    formula_variaveis?: FormulaVariaveis[];

    /**
     * acumulado_usa_formula - Se é pra calcular o acumulado usando a formula ou é pra fazer a conta automaticamente pelos valores resultantes
     */
    @IsOptional()
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    @ValidateIf((object, value) => value !== null)
    acumulado_usa_formula?: boolean | null;

    /**
     * acumulado_valor_base para ser usado quando o acumulado_usa_formula=false
     * Para não perder precisão no JSON, usar em formato string, mesmo sendo um número
     * Se nulo, a séria acumulada não será calculada quando acumulado_usa_formula for false.
     * @example "0.0"
     */
    // maxDecimalPlaces: 30 nao existe isso nesse cara, só tem no IsNumber, mas se usar o transform,
    // o javascript vai perder a precisao na hora do casting pra float
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => String)
    acumulado_valor_base?: number | null;

    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    @IsOptional()
    @Type(() => String)
    meta_valor_nominal?: number | null;

    @IsOptional()
    @IsInt({ message: 'variavel_categoria_id precisa ser um número ou null' })
    @ValidateIf((object, value) => value !== null)
    variavel_categoria_id?: number | null;
}
