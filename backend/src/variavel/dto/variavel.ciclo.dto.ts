import { ApiProperty, PickType } from '@nestjs/swagger';
import { Periodicidade, VariavelFase,   } from 'src/generated/prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';
import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { NumberArrayTransformOrEmpty } from '../../auth/transforms/number-array.transform';
import { NumberTransform } from '../../auth/transforms/number.transform';
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { ArquivoBaseDto } from '../../upload/dto/create-upload.dto';
import { FilterVariavelDto } from './filter-variavel.dto';
import { VariavelResumo } from './list-variavel.dto';

export class ListVariavelGlobalCicloDto {
    linhas: VariavelGlobalCicloDto[];
}

export class FilterVariavelGlobalCicloDto extends FilterVariavelDto {
    /**
     * Fase da variável, eg: Preenchimento
     *
     */
    @IsOptional()
    @IsEnum(VariavelFase)
    @ApiProperty({ enum: VariavelFase })
    fase?: VariavelFase;

    /**
     * caso seja true, irá simular o ponto focal se tiver permissão `SMAE.superadmin` ou `CadastroVariavelGlobal.administrador`
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    simular_ponto_focal?: boolean;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    equipe_id?: number;

    @ApiProperty({
        description: 'ID da meta, prioridade 3, usado apenas no filtro de GET plano-setorial-variavel-ciclo',
    })
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    declare meta_id?: number;

    @ApiProperty({
        description: 'ID do pdm/ps, prioridade 4, usado apenas no filtro de GET plano-setorial-variavel-ciclo',
    })
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pdm_id?: number;

    @ApiProperty({
        description: 'ID da iniciativa, prioridade 2, usado apenas no filtro de GET plano-setorial-variavel-ciclo',
    })
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    declare iniciativa_id?: number;

    @ApiProperty({
        description: 'ID da atividade, prioridade 1, usado apenas no filtro de GET plano-setorial-variavel-ciclo',
    })
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    declare atividade_id?: number;

    @IsOptional()
    @IsDateYMD()
    referencia?: Date;

    /**
     * Apenas usado se `simular_ponto_focal` for true
     */
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    simular_usuario?: number;

    @IsArray()
    @IsOptional()
    @Transform(NumberArrayTransformOrEmpty)
    variavel_id?: number[];
}

export class VariavelGlobalCicloDto {
    /***
     * qual o ID do variavel está associada
     * @example "1"
     */
    id: number;
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo: string;
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    @ApiProperty({ type: String })
    periodicidade: Periodicidade;
    fase: VariavelFase;
    em_atraso: boolean;

    @IsDateYMD()
    proximo_periodo_abertura: string;

    @IsDateYMD()
    ultimo_periodo_valido: string;

    pedido_complementacao: boolean;

    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Atrasos' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    atrasos: string[] | null;
    equipes: IdTituloDto[];

    @IsDateYMD({ nullable: true })
    prazo: Date | null;
    pode_editar: boolean;
}

export class VariavelGlobalAnaliseItemDto {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    variavel_id?: number;

    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover',
        }
    )
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor_realizado: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Análise qualitativa' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @ValidateIf((object, value) => value !== '')
    analise_qualitativa: string;
}

export class UpsertVariavelGlobalCicloDocumentoDto {
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Upload Token' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    upload_token: string;
}

export class BatchAnaliseQualitativaDto {
    @IsInt()
    @Transform(NumberTransform)
    variavel_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Análise qualitativa' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    analise_qualitativa?: string;

    @IsDateYMD()
    data_referencia: Date;

    @IsOptional()
    @IsArray()
    @Type(() => UpsertVariavelGlobalCicloDocumentoDto)
    @ValidateNested({ each: true })
    uploads?: UpsertVariavelGlobalCicloDocumentoDto[];

    @IsArray()
    @Type(() => VariavelGlobalAnaliseItemDto)
    @ValidateNested({ each: true })
    valores: VariavelGlobalAnaliseItemDto[];

    @IsOptional()
    @IsBoolean()
    aprovar?: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Pedido de complementação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    pedido_complementacao?: string;
}

export class FilterVariavelAnaliseQualitativaGetDto {
    @IsInt()
    @ApiProperty({ description: 'ID da variável pai' })
    @Transform(NumberTransform)
    variavel_id: number;

    @IsDateYMD({ description: 'Data de referência' })
    data_referencia: Date;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true')
    consulta_historica?: boolean;
}

export class VariavelValorDto {
    variavel: VariavelResumo;
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Valor realizado' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    valor_realizado: string | null;
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Valor realizado acumulado' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    valor_realizado_acumulado: string | null;
    analise_qualitativa: string | null;
}

export class AnaliseQualitativaDto {
    @ApiProperty({ description: 'Análise qualitativa' })
    analise_qualitativa: string;
    criado_em: Date;
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Criador nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    criador_nome: string;
    fase: VariavelFase;
    eh_liberacao_auto: boolean;
}

export class VariavelAnaliseDocumento extends PickType(ArquivoBaseDto, [
    'id',
    'nome_original',
    'download_token',
    'descricao',
]) {
    descricao: string | null;
    fase: VariavelFase;
    pode_editar: boolean;
}

export class PSPedidoComplementacaoDto {
    @ApiProperty({ description: 'Pedido de complementação' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Pedido' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    pedido: string;
    criado_em: Date;
    criador_nome: string;
}

export class VariavelAnaliseQualitativaResponseDto {
    variavel: VariavelResumo;
    fase: VariavelFase;

    @ApiProperty({ description: 'Análise qualitativas e outros envios' })
    analises: AnaliseQualitativaDto[] | null;

    @ApiProperty({ description: 'Ultimo pedido de complementacao' })
    pedido_complementacao: PSPedidoComplementacaoDto | null;

    @ApiProperty({ description: 'Valores da variável e suas filhas', type: [VariavelValorDto] })
    valores: VariavelValorDto[];

    @ApiProperty({ description: 'Uploads associados', type: [VariavelAnaliseDocumento] })
    uploads: VariavelAnaliseDocumento[];

    possui_variaveis_filhas: boolean;
}
