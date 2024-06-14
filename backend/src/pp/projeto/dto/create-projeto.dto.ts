import { ApiProperty } from '@nestjs/swagger';
import { ProjetoOrigemTipo } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    Min,
    MinLength,
    ValidateIf,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import {
    CONST_PROC_SEI_SINPROC_DESCR,
    CONST_PROC_SEI_SINPROC_MESSAGE,
    CONST_PROC_SEI_SINPROC_REGEXP,
} from '../../../dotacao/dto/dotacao.dto';

export class CreateProjetoDto {
    /**
     * portfolio_id
     * @example 0
     */
    @IsInt({ message: '$property| portfolio_id precisa ser inteiro' })
    @Type(() => Number)
    portfolio_id: number;

    /**
     * IDs de Portfolios que também terão "acesso" ao projeto,
     * Desativado em MDO
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
     * nome (mínimo 1 char)
     * ou
     * nome da obra
     * @example "Nome"
     */
    @IsString()
    @MaxLength(500)
    @MinLength(1)
    nome: string;

    /**
     * grupo temático, apenas MDO
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| grupo_tematico_id precisa ser inteiro' })
    grupo_tematico_id?: number;

    /**
     * tipo de intervenção, apenas MDO
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| tipo_intervencao_id precisa ser inteiro' })
    tipo_intervencao_id?: number;

    /**
     * equipamento, apenas MDO
     * @example ""
     */
    @IsOptional()
    @IsInt({ message: '$property| equipamento_id precisa ser inteiro' })
    equipamento_id?: number;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    @ValidateIf((object, value) => value !== null)
    mdo_detalhamento?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(1024)
    @ValidateIf((object, value) => value !== null)
    mdo_programa_habitacional?: string | null;

    @IsOptional()
    @IsInt({ message: '$property| mdo_n_unidades_habitacionais precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    mdo_n_unidades_habitacionais?: number | null;

    @IsOptional()
    @IsInt({ message: '$property| mdo_n_familias_beneficiadas precisa ser inteiro' })
    @ValidateIf((object, value) => value !== null)
    mdo_n_familias_beneficiadas?: number | null;

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
    @MaxLength(2048)
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
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_responsavel_id: number | null;

    /**
     * apenas MDO
     * órgão origem da obra (eg: secretaria da educação)
     */
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_origem_id?: number | null;

    /**
     * apenas MDO
     * órgão executor da obra (eg: SIURB Infraestrutura Urbana e Obras)
     */
    @IsInt({ message: '$property| orgao_responsavel_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    orgao_executor_id?: number | null;

    /**
     * ID da pessoa responsável [pelo planejamento, são as pessoas filtradas pelo filtro `colaborador_de_projeto=true`]
     * ou
     * ponto focal responsável [são as pessoas filtradas pelo priv `MDO.colaborador_de_projeto`]
     */
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
    @MaxLength(50000)
    resumo?: string;

    /**
     * previsao_inicio ou null
     * @example "2020-01-01"
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    previsao_inicio: Date | null;

    /**
     * previsao_inicio ou null
     * @example "2020-01-01"
     */
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
    @MaxLength(1024)
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
    @MaxLength(50000)
    principais_etapas?: string;

    @IsOptional()
    @IsInt({ message: '$property| regiao_id precisa ser inteiro' })
    @Transform((a: TransformFnParams) => (a.value === null || a.value === 0 ? null : +a.value))
    regiao_id?: number | null;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(1024)
    logradouro_tipo?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(1024)
    logradouro_nome?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(1024)
    logradouro_numero?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(1024)
    logradouro_cep?: string;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao: string[];
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
    @MaxLength(2048)
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
    @MaxLength(20)
    @Matches(CONST_PROC_SEI_SINPROC_REGEXP, { message: CONST_PROC_SEI_SINPROC_MESSAGE })
    processo_sei: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    descricao: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
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
    @MaxLength(1024)
    comentarios?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    @MaxLength(1024)
    observacoes?: string;
}
