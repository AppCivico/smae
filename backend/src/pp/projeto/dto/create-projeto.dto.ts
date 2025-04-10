import { ApiProperty } from '@nestjs/swagger';
import { ProjetoOrigemTipo, ProjetoStatus } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { NumberArrayTransformOrEmpty } from '../../../auth/transforms/number-array.transform';
import {
    CONST_PROC_SEI_SINPROC_DESCR,
    CONST_PROC_SEI_SINPROC_MESSAGE,
    CONST_PROC_SEI_SINPROC_REGEXP,
} from '../../../dotacao/dto/dotacao.dto';
import { IsOptionalNonNullable } from '../../../common/helpers/IsOptionalNonNullable';
import { NumberTransform } from '../../../auth/transforms/number.transform';
import { UpsertOrigemDto } from '../../../common/dto/origem-pdm.dto';

export class PPfonteRecursoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === undefined ? undefined : +a.value))
    id?: number;

    /**
     * código da fonte de recurso no SOF, no ano escolhido
     */
    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(255, { message: 'O campo "Código da Fonte de Recurso SOF" deve ter no máximo 255 caracteres' })
    fonte_recurso_cod_sof: string;

    @IsInt()
    @Max(3000)
    @Min(2003)
    @Transform((a: TransformFnParams) => +a.value)
    fonte_recurso_ano: number;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    valor_percentual?: number | null;

    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    valor_nominal?: number | null;
}

export class CreateProjetoDto {
    @IsArray()
    @IsOptional()
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(1000, { message: '$property| precisa ter no máximo 1000 items' })
    @ValidateNested({ each: true })
    @Type(() => UpsertOrigemDto)
    origens_extra?: UpsertOrigemDto[];

    /**
     * portfolio_id
     * @example 0
     */
    @IsInt({ message: '$property| portfolio_id precisa ser inteiro' })
    @Type(() => Number)
    portfolio_id: number;

    /**
     * IDs de Portfolios que também terão "acesso" ao projeto,
     * @example "[]"
     */
    @IsOptional()
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @ValidateIf((object, value) => value !== null)
    portfolios_compartilhados?: number[] | null;

    /**
     * Executa uma mudança de status, sem atualizar os campos (pode retroceder)
     */
    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    status?: ProjetoStatus;

    /**
     * nome (mínimo 1 char)
     * ou
     * nome da obra
     * @example "Nome"
     */
    @IsString()
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    @MinLength(1)
    nome: string;

    /**
     * grupo temático, apenas MDO
     * @example "0"
     */
    @IsOptional()
    @IsInt({ message: '$property| grupo_tematico_id precisa ser inteiro' })
    grupo_tematico_id?: number;

    /**
     * tipo de intervenção, apenas MDO
     * @example "0"
     */
    @IsOptional()
    @IsInt({ message: '$property| tipo_intervencao_id precisa ser inteiro' })
    tipo_intervencao_id?: number;

    /**
     * equipamento, apenas MDO
     * @example "0"
     */
    @IsOptional()
    @IsInt({ message: '$property| equipamento_id precisa ser inteiro' })
    equipamento_id?: number;

    /**
     * empreendimento, apenas MDO
     * @example "0"
     */
    @IsOptional()
    @IsInt({ message: '$property| empreendimento_id precisa ser inteiro' })
    empreendimento_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Detalhamento" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    mdo_detalhamento?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Programa Habitacional" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    @ApiProperty({ deprecated: true })
    mdo_programa_habitacional?: string | null;

    @IsOptional()
    @IsInt({ message: '$property| mdo_n_unidades_habitacionais precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberTransform)
    mdo_n_unidades_habitacionais?: number | null;

    @IsOptional()
    @IsInt({ message: '$property| mdo_n_familias_beneficiadas precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberTransform)
    mdo_n_familias_beneficiadas?: number | null;

    @IsOptional()
    @IsInt({ message: '$property| mdo_n_familias_beneficiadas precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberTransform)
    mdo_n_unidades_atendidas?: number | null;

    /**
     * tipo da origem
     *
     * @example "Outro"
     */
    @ApiProperty({ enum: ProjetoOrigemTipo, enumName: 'ProjetoOrigemTipo' })
    @IsEnum(ProjetoOrigemTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoOrigemTipo).join(', '),
    })
    origem_tipo: ProjetoOrigemTipo;

    /**
     * origem, não é obrigatório se enviar o campo `origem_tipo` com os valores `PdmSistema`.
     *
     * Obrigatório em caso de `PdmAntigo` ou `Outro`
     *
     * Quando enviar como `PdmSistema` também é necessário enviar `meta_id`, `iniciativa_id` ou `atividade_id`
     * @example "foobar"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Origem Outro" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    origem_outro?: string | null;

    /**
     * meta_id, se for por meta
     */
    @IsOptional()
    @IsInt({ message: '$property| meta_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    meta_id?: number | null;

    /**
     * iniciativa_id, se for por iniciativa
     */
    @IsOptional()
    @IsInt({ message: '$property| iniciativa_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    iniciativa_id?: number | null;

    /**
     * atividade_id, se for por atividade
     */
    @IsOptional()
    @IsInt({ message: '$property| atividade_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    atividade_id?: number | null;

    @IsOptional()
    @IsInt({ message: '$property| projeto_etapa_id precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    projeto_etapa_id?: number | null;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    meta_codigo?: string | null;

    /**
     * ID do órgão gestor do projeto em PP
     * ou
     * ID do órgão do gestor do portfólio no MDO
     * @example 0
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
    @ValidateIf((object, value) => value !== null)
    responsaveis_no_orgao_gestor: number[] | null;

    /**
     * ID dos órgãos participantes do projeto
     * @example "[]"
     */
    @IsOptionalNonNullable()
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    orgaos_participantes: number[];

    /**
     * dentro dos órgãos participantes, qual é o órgão responsável (projetos)
     * ou
     * órgão responsável pela obra
     */
    @IsOptionalNonNullable()
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_responsavel_id: number | null;

    /**
     * apenas MDO
     * órgão origem da obra (eg: secretaria da educação)
     */
    @IsOptional()
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_origem_id?: number | null;

    /**
     * apenas MDO
     * órgão executor da obra (eg: SIURB Infraestrutura Urbana e Obras)
     */
    @IsOptional()
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_executor_id?: number | null;

    /**
     * ID da pessoa responsável [pelo planejamento, são as pessoas filtradas pelo filtro `colaborador_de_projeto=true`]
     * ou
     * ponto focal responsável [são as pessoas filtradas pelo priv `MDO.colaborador_de_projeto`]
     */
    @IsOptionalNonNullable()
    @IsInt({ message: '$property| responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    responsavel_id: number | null;

    /**
     * resumo (pode enviar string vazia)
     * @example "lorem..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Resumo" deve ter no máximo 255 caracteres' })
    resumo?: string;

    /**
     * previsao_inicio ou null
     * @example "2020-01-01"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    previsao_inicio: Date;

    /**
     * previsao_inicio ou null
     * @example "2020-01-01"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    previsao_termino: Date | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    mdo_previsao_inauguracao?: Date | null;

    /**
     * previsão de custo, número positivo com até 2 casas, pode enviar null
     **/
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| Custo até duas casas decimais' }
    )
    @Min(0, { message: '$property| Custo precisa ser positivo' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    previsao_custo: number | null;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Observações" deve ter no máximo 255 caracteres' })
    mdo_observacoes?: string;

    @IsOptional()
    @IsInt({ message: '$property| precisa ser inteiro' })
    @Min(0, { message: '$property| Mínimo 0' })
    tolerancia_atraso?: number;

    /**
     * principais_etapas
     * @example "1. doing xpto\n2. doing zoo"
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Principais Etapas " deve ter no máximo 255 caracteres' })
    principais_etapas?: string;

    @IsOptional()
    @IsInt({ message: '$property| regiao_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null || a.value === 0 ? null : +a.value))
    regiao_id?: number | null;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Logradouro Tipo" deve ter no máximo 255 caracteres' })
    logradouro_tipo?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Logradouro Nome" deve ter no máximo 255 caracteres' })
    logradouro_nome?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Logradouro Número" deve ter no máximo 255 caracteres' })
    logradouro_numero?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Logradouro CEP" deve ter no máximo 255 caracteres' })
    logradouro_cep?: string;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao: string[];

    /*
     * secretario gestor do projeto
     * ou
     * secretário gestor do portfólio
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Secretário Executivo" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    secretario_executivo?: string | null;

    /*
     * secretario responsavel
     * ou
     * secretario responsavel na obra
     */
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Secretário Responsável" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    secretario_responsavel?: string | null;

    // manter duplicado no update
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPfonteRecursoDto)
    fonte_recursos?: PPfonteRecursoDto[];

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| regiao_ids precisa ser inteiro', each: true })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberArrayTransformOrEmpty)
    regiao_ids?: number[] | null;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Secretário Colaborador" deve ter no máximo 255 caracteres' })
    @ValidateIf((object, value) => value !== null)
    secretario_colaborador?: string | null;

    @IsOptional()
    @IsInt({ message: '$property| precisa ser inteiro' })
    @Min(0, { message: '$property| Mínimo 0' })
    orgao_colaborador_id?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| colaboradores_no_orgao precisa ser inteiro', each: true })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberArrayTransformOrEmpty)
    colaboradores_no_orgao?: number[] | null;

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| tags precisa ser inteiro', each: true })
    @ValidateIf((object, value) => value !== null)
    @Transform(NumberArrayTransformOrEmpty)
    tags?: number[] | null;

    /**
     * tipo de aditivo MDO
     */
    @IsOptional()
    @IsInt({ message: '$property| tipo_aditivo_id precisa ser inteiro' })
    @ApiProperty({ deprecated: true })
    tipo_aditivo_id?: number | null;

    /**
     * Programa (coluna que antes era texto livre, antigo campo mdo_programa_habitacional)
     * agora vem do cadastro do `/api/projeto-programa-mdo`
     */
    @IsOptional()
    @IsInt({ message: '$property| projeto_programa_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    programa_id?: number | null;

    /**
     * modalidade de contratação MDO
     */
    @IsOptional()
    @IsInt({ message: '$property| modalidade_contratacao_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    modalidade_contratacao_id?: number | null;
}

export class CreateProjetoDocumentDto {
    /**
     * Upload do Documento
     */
    @IsString({ message: '$property| upload_token do documento' })
    upload_token: string;

    @IsString()
    @IsOptional()
    diretorio_caminho?: string;

    /**
     * data ou null
     * @example "2020-01-01"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date;

    // TODO: este campo aqui será obrigatório, porém mantendo como opcional por motivos de sincronia com o desenvolvimento de front.
    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao?: string;
}

export class CreateProjetoSeiDto {
    /**
     * No final, vai virar apenas número.
     *
     * @example "6068.2021/0004861-3"
     **/
    @ApiProperty({ description: CONST_PROC_SEI_SINPROC_DESCR, example: '6016201700379910' })
    @IsString()
    @MaxLength(255, { message: 'O campo "Processo SEI" deve ter no máximo 255 caracteres' })
    @Matches(CONST_PROC_SEI_SINPROC_REGEXP, { message: CONST_PROC_SEI_SINPROC_MESSAGE })
    processo_sei: string;

    @IsOptional()
    @IsString()
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;

    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'O campo "Link" deve ter no máximo 255 caracteres' })
    @IsUrl(
        {
            protocols: ['http', 'https'],
            require_tld: true,
            require_protocol: true,
            require_host: true,
            require_port: false,
            require_valid_protocol: true,
            allow_underscores: false,
            allow_trailing_dot: false,
            allow_protocol_relative_urls: false,
            allow_fragments: true,
            allow_query_components: true,
            validate_length: true,
        },
        { message: '$property| O link um precisa ter o protocolo HTTP ou HTTPS, um TLD válido.' }
    )
    link: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Comentários" deve ter no máximo 255 caracteres' })
    comentarios?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(255, { message: 'O campo "Observações" deve ter no máximo 255 caracteres' })
    observacoes?: string;
}

export class FilterPdmOrNotDto {
    @IsBoolean()
    @IsOptional()
    @Transform((a: TransformFnParams) => (a.value === 'true' ? true : a.value === 'false' ? false : a.value))
    apenas_pdm?: boolean;
}
