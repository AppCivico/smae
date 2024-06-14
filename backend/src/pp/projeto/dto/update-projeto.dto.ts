import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { CreateProjetoDto, CreateProjetoSeiDto } from './create-projeto.dto';

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
    @MaxLength(2)
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

export class PPpremissaDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    premissa: string;
}

export class PPrestricaoDto {
    /**
     * id caso já exista e deseja fazer uma atualização
     */
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsString({ message: '$property| precisa ser um alfanumérico' })
    @MaxLength(2048)
    restricao: string;
}

export class UpdateProjetoRegistroSeiDto extends PartialType(CreateProjetoSeiDto) {}

// esses campos serão updated apenas via sistema (pelas tarefas)
//    @IsOptional()
//    @IsOnlyDate()
//    @Transform(DateTransform)
//    @ValidateIf((object, value) => value !== null)
//    realizado_inicio?: Date
//
//    @IsOptional()
//    @IsOnlyDate()
//    @Transform(DateTransform)
//    @ValidateIf((object, value) => value !== null)
//    realizado_termino?: Date
//
//    @IsOptional()
//    @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false }, { message: '$property| Custo até duas casas decimais' })
//    @Min(0, { message: '$property| Custo precisa ser positivo' })
//    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
//    @ValidateIf((object, value) => value !== null)
//    realizado_custo?: number

export class UpdateProjetoDto extends OmitType(PartialType(CreateProjetoDto), ['portfolio_id', 'orgao_gestor_id']) {
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPpremissaDto)
    premissas?: PPpremissaDto[];

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPrestricaoDto)
    restricoes?: PPrestricaoDto[];

    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, pode ter 0 items para limpar' })
    @ValidateNested({ each: true })
    @Type(() => PPfonteRecursoDto)
    fonte_recursos?: PPfonteRecursoDto[];

    @IsOptional()
    @ApiProperty({
        deprecated: true,
        description: 'Não é mais possível escrever o codigo',
    })
    codigo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    objeto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    objetivo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    publico_alvo?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50000)
    nao_escopo?: string;

    /*
    * secretario gestor do projeto
    * ou
    * secretário gestor do portfólio
    */
    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    secretario_executivo?: string | null;

    /*
    * secretario responsavel
    * ou
    * secretario responsavel na obra
    */
    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    secretario_responsavel?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(250)
    @ValidateIf((object, value) => value !== null)
    coordenador_ue?: string | null;

    /**
     * texto que representa a versão
     * @example "..."
     */
    @IsOptional()
    @IsString()
    @MaxLength(20)
    @ValidateIf((object, value) => value !== null)
    versao?: string | null;

    /**
     * data_aprovacao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_aprovacao?: Date | null;

    /**
     * data_revisao
     * @example "2022-01-20"
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_revisao?: Date | null;

    /**
     * Executa uma mudança de status, sem atualizar os campos (pode retroceder)
     */
    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    status?: ProjetoStatus;

    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    grupo_portfolio?: number[];

    /**
     * “Equipe” pessoas que terão permissão para editar o projeto (mesmos privilégios do gerente de projeto)
     *
     * Ao salvar, o banco calcula automaticamente o órgão da pessoa, se mudar de órgão, o privilégio é perdido.
     */
    @IsOptional()
    @IsArray()
    @IsInt({ message: '$property| Precisa ser uma lista de inteiros', each: true })
    @Max(1000, { each: true })
    equipe?: number[];
}

export class UpdateProjetoDocumentDto {
    /**
     * Token para encontrar documento
     */
    @IsString({ message: '$property| upload_token do documento' })
    upload_token: string;

    @IsString()
    @IsOptional()
    diretorio_caminho?: string;

    @IsOptional()
    @IsString()
    @ValidateIf((object, value) => value !== null)
    descricao?: string | null;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data?: Date | null;
}

export class CloneProjetoTarefasDto {
    @IsInt()
    projeto_fonte_id: number;
}

export class TransferProjetoPortfolioDto {
    @IsInt()
    portfolio_id: number;
}
