import { ApiHideProperty, ApiProperty, IntersectionType, PickType } from '@nestjs/swagger';
import { Periodicidade, Polaridade } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsNumberString,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

// o js ta bugando depois de 13, ta criado com decimal até 30, pg nativamente vai até 1000 sem recompilar.
// precisa mudar o js pra usar Decimail.js ou Math.js pra usar mais casas se precisar
export const MAX_CASAS_DECIMAIS = 12;

export class VariaveisPeriodosDto {
    @IsInt()
    @Min(1)
    @Max(36524)
    @Transform(NumberTransform)
    preenchimento_inicio: number;
    @IsInt()
    @Min(1)
    @Max(36524)
    @Transform(NumberTransform)
    preenchimento_duracao: number;
    @IsInt()
    @Min(1)
    @Max(36524)
    @Transform(NumberTransform)
    validacao_duracao: number;
    @IsInt()
    @Min(1)
    @Max(36524)
    @Transform(NumberTransform)
    liberacao_duracao: number;
}

export class CreateVariavelBaseDto {
    /**
     * ID do órgão, se for enviado e não for enviado medicao_orgao_id, validacao_orgao_id, liberacao_orgao_id, ira sobrescrevê-los
     */
    @IsOptional()
    @IsInt({ message: 'órgão responsável' })
    @Type(() => Number)
    orgao_id?: number;

    /**
     * ID da região (opcional)
     */
    @IsOptional()
    @IsInt({ message: '$property| região é opcional via (null) ou precisa ser um numérico' })
    @ValidateIf((object, value) => value !== null)
    @Transform(({ value }: any) => (String(value) === '0' || value === null ? null : +value))
    @Type(() => Number)
    regiao_id?: number;

    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    titulo: string;

    /**
     * valor_base para ser usado em gráficos
     * Para não perder precisão no JSON, usar em formato string, mesmo sendo um número
     * @example "0.0"
     */
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @Type(() => String)
    @IsOptional()
    valor_base?: number;

    @IsOptional()
    @IsInt({ message: '$property| $property inválido' })
    @Min(0, { message: '$property| casas_decimais tem valor mínimo de zero' })
    @Max(MAX_CASAS_DECIMAIS, { message: `$property| casas_decimais tem valor máximo de ${MAX_CASAS_DECIMAIS}` })
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    casas_decimais: number;

    /**
     * Periodicidade da variável
     * @example "Bimestral"
     */
    @ApiProperty({ enum: Periodicidade, enumName: 'Periodicidade' })
    @IsEnum(Periodicidade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Periodicidade).join(', '),
    })
    periodicidade: Periodicidade;

    /**
     * Polaridade
     * @example "Neutra"
     */
    @IsOptional()
    @ApiProperty({ enum: Polaridade, enumName: 'Polaridade' })
    @IsEnum(Polaridade, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(Polaridade).join(', '),
    })
    polaridade: Polaridade;

    @IsOptional()
    @IsInt({ message: '$property| unidade de medida precisa ser numérico' })
    @Type(() => Number)
    unidade_medida_id?: number;

    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    acumulativa: boolean;

    @IsOptional()
    @IsBoolean({ message: '$property| Precisa ser um boolean' })
    mostrar_monitoramento: boolean;

    @IsOptional()
    @IsInt({ message: '$property| ano_base precisa ser numérico' })
    @ValidateIf((object, value) => value !== null)
    @Type(() => Number)
    ano_base?: number | null;

    /**
     * inicio_medicao [obrigatório apenas caso a periodicidade for diferente do indicador, se for igual, será transformado em null]
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio_medicao: Date | null;

    /**
     * fim_medicao [obrigatório apenas caso a periodicidade for diferente do indicador, se for igual, será transformado em null]
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    fim_medicao: Date | null;

    @IsOptional()
    @IsInt({ message: '$property| atraso_meses precisa ser numérico' })
    @Type(() => Number)
    @Min(0)
    atraso_meses?: number;

    @IsOptional()
    @IsBoolean()
    @ValidateIf((object, value) => value !== null)
    supraregional?: boolean;

    /* se recebido no update, se existir valor na serie-variavel realizado irá voltar 400
     * se não existir, pode mudar. Se existir valor, mas pediu para virar null, irá remover a marcação de
     * variavel_categorica_id mas manter o registro na tabela serie-variavel
     */
    @IsOptional()
    @IsNumber()
    @ValidateIf((object, value) => value !== null)
    variavel_categorica_id?: number | null;

    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsArray({ message: '$property| assuntos(s): precisa ser uma array.' })
    @ArrayMaxSize(1000, { message: '$property| assuntos(s): precisa ter no máximo 1000 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    assuntos?: number[];

    @IsOptional()
    @ValidateNested()
    @Type(() => VariaveisPeriodosDto)
    @IsObject()
    periodos: VariaveisPeriodosDto;

    @IsOptional()
    @IsBoolean()
    dado_aberto?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Metodologia' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    metodologia?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;

    @IsOptional()
    @IsInt()
    fonte_id?: number | null;

    @IsOptional()
    @IsInt()
    orgao_proprietario_id?: number | null;

    @IsOptional()
    @IsInt()
    medicao_orgao_id?: number | null;
    @IsOptional()
    @IsInt()
    validacao_orgao_id?: number | null;
    @IsOptional()
    @IsInt()
    liberacao_orgao_id?: number | null;

    @IsOptional()
    @IsInt({ each: true })
    @IsArray()
    @ArrayMaxSize(1000)
    medicao_grupo_ids?: number[] | null;

    @IsOptional()
    @IsInt({ each: true })
    @IsArray()
    @ArrayMaxSize(1000)
    validacao_grupo_ids?: number[] | null;

    @IsOptional()
    @IsInt({ each: true })
    @IsArray()
    @ArrayMaxSize(1000)
    liberacao_grupo_ids?: number[] | null;

    @ApiHideProperty()
    @IsOptional()
    @IsBoolean()
    possui_variaveis_filhas?: boolean;
}

export class CreateVariavelPDMDto extends CreateVariavelBaseDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @MinLength(1)
    codigo: string;

    /**
     * ID do indicador (é required para criar já o relacionamento)
     */
    @IsInt({ message: '$property| indicador precisa existir' })
    @Type(() => Number)
    indicador_id: number; // manter undefined pq precisamos apagar antes do insert

    /**
     * lista dos responsáveis pelo preenchimento? pelo menos uma pessoa
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(1, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    responsaveis: number[]; // manter undefined pq precisamos apagar antes do insert
}

export class CreatePeloIndicadorDto extends PickType(CreateVariavelBaseDto, ['titulo', 'orgao_id']) {
    @IsInt()
    indicador_id: number;
}

export class CreateGeradorVariaveBaselDto extends CreateVariavelBaseDto {
    @IsArray({ message: 'Região precisa ser uma array.' })
    @ArrayMinSize(1, { message: 'Região precisa ter pelo menos um item' })
    @ArrayMaxSize(1000, { message: 'Região precisa ter no máximo 1000 items' })
    @IsInt({ each: true, message: 'Região, cada item precisa ser um número inteiro' })
    regioes: number[];

    @IsBoolean()
    @IsOptional()
    criar_formula_composta?: boolean;
}

export class CreateGeradorVariavelPDMDto extends IntersectionType(CreateGeradorVariaveBaselDto, CreateVariavelPDMDto) {
    /**
     * prefixo que será adicionado em vários
     */
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo: string;
}
