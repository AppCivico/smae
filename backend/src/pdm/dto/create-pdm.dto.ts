import { ApiProperty, refs } from '@nestjs/swagger';
import { NivelOrcamento } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
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
import { IdTituloDto } from '../../common/dto/IdTitulo.dto';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class CreatePSEquipeAdminCPDto {
    /**
     * lista de equipes do PS.admin_cp? pode ficar vazio
     * cada pessoa precisa ter o privilégio "PS.admin_cp"
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: 'precisa ser um array' })
    @ArrayMaxSize(10000, { message: 'precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @Min(1, { each: true, message: 'ID precisa ser maior que 0' })
    equipes: number[];
}

export class CreatePSEquipeTecnicoCPDto {
    /**
     * lista de equipes do PS.tecnico_cp? pode ficar vazio
     * cada pessoa precisa ter o privilégio "PS.admin_cp"
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: 'precisa ser um array' })
    @ArrayMaxSize(10000, { message: 'precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @Min(1, { each: true, message: 'ID precisa ser maior que 0' })
    equipes: number[];
}

export class CreatePSEquipePontoFocalDto {
    /**
     * lista de equipes do PS.ponto_focal? pode ficar vazio
     * cada pessoa precisa ter o privilégio "PS.admin_cp"
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: 'precisa ser um array' })
    @ArrayMaxSize(10000, { message: 'precisa ter no máximo 10000 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    @Min(1, { each: true, message: 'ID precisa ser maior que 0' })
    equipes: number[];
}

export class RetornoPSEquipeAdminCPDto {
    @ApiProperty({
        type: 'array',
        items: { oneOf: [{ type: 'number' }, ...refs(IdTituloDto)] },
    })
    equipes: number[] | IdTituloDto[];
}

export class RetornoPSEquipeTecnicoCPDto {
    @ApiProperty({
        type: 'array',
        items: { oneOf: [{ type: 'number' }, ...refs(IdTituloDto)] },
    })
    equipes: number[] | IdTituloDto[];
}

export class RetornoPSEquipePontoFocalDto {
    @ApiProperty({
        type: 'array',
        items: { oneOf: [{ type: 'number' }, ...refs(IdTituloDto)] },
    })
    equipes: number[] | IdTituloDto[];
}

export class CreatePdmDto {
    /**
     * Nome
     */
    @IsString({ message: 'Nome: Precisa ser alfanumérico' })
    @MinLength(1, { message: 'Nome: Mínimo de 1 caractere' })
    @MaxLength(250, { message: 'Nome: Máximo 250 caracteres' })
    nome: string;

    /**
     * Descrição
     */
    @IsOptional()
    @IsString({ message: 'Descrição: Precisa ser alfanumérico' })
    @MaxLength(2500, { message: 'Descrição: Máximo 2500 caracteres' })
    descricao?: string | null;

    /**
     * Prefeito
     */
    @IsString({ message: 'prefeito: Precisa ser alfanumérico' })
    @MaxLength(250, { message: 'prefeito: Máximo 250 caracteres' })
    prefeito: string;

    /**
     * Equipe Técnica
     */
    @IsOptional()
    @IsString({ message: 'equipe técnica: Precisa ser alfanumérico' })
    @MaxLength(2500, { message: 'equipe técnica: Máximo 2500 caracteres' })
    equipe_tecnica: string | null;

    /**
     * Data de inicio
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_inicio: Date | null;

    /**
     * Data de fim
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_fim: Date | null;

    /**
     * Data de publicação
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_publicacao?: Date | null;

    /**
     * Data de fim
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_do_ciclo_participativo_inicio?: Date | null;

    /**
     * Data de fim
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    periodo_do_ciclo_participativo_fim?: Date | null;

    /**
     * Rótulo Macro Tema
     */
    @IsOptional()
    @MaxLength(30, { message: 'Rótulo Macro Tema: Máximo 30 caracteres' })
    rotulo_macro_tema?: string | undefined;

    /**
     * Rótulo Tema
     */
    @IsOptional()
    @MaxLength(30, { message: 'Rótulo Tema: Máximo 30 caracteres' })
    rotulo_tema?: string | undefined;

    /**
     * Rótulo Sub Tema
     */
    @IsOptional()
    @MaxLength(30, { message: 'Rótulo Sub Tema: Máximo 30 caracteres' })
    rotulo_sub_tema?: string | undefined;

    /**
     * Rótulo Contexto Meta
     */
    @IsOptional()
    @IsString({ message: 'Rótulo Contexto Meta: Precisa ser alfanumérico' })
    @MaxLength(30, { message: 'Rótulo Contexto Meta: Máximo 30 caracteres' })
    rotulo_contexto_meta?: string | undefined;

    /**
     * Rótulo Complemento Meta
     */
    @IsOptional()
    @IsString({ message: 'Rótulo Complemento Meta: Precisa ser alfanumérico' })
    @MaxLength(30, { message: 'Rótulo Complemento Meta: Máximo 30 caracteres' })
    rotulo_complementacao_meta?: string | undefined;

    /**
     * Rótulo Iniciativa
     */
    @IsOptional()
    @IsString({ message: 'Rótulo Iniciativa: Precisa ser alfanumérico' })
    @MaxLength(30, { message: 'Rótulo Iniciativa: Máximo 30 caracteres' })
    rotulo_iniciativa?: string | undefined;

    /**
     * Rótulo Atividade
     */
    @IsOptional()
    @IsString({ message: 'Rótulo Iniciativa: Precisa ser alfanumérico' })
    @MaxLength(30, { message: 'Rótulo Iniciativa: Máximo 30 caracteres' })
    rotulo_atividade?: string | undefined;

    /**
     * Rótulo Macro Tema
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_macro_tema?: boolean;

    /**
     * Rótulo Tema
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_tema?: boolean;

    /**
     * Rótulo Sub Tema
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_sub_tema?: boolean;

    /**
     * Rótulo Contexto Meta
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_contexto_meta?: boolean;

    /**
     * Rótulo Complemento Meta
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_complementacao_meta?: boolean;

    /**
     * Rótulo Contexto Meta
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_iniciativa?: boolean;

    /**
     * Rótulo Contexto Meta
     */
    @IsOptional()
    @IsBoolean({ message: 'Precisa ser um boolean' })
    possui_atividade?: boolean;

    /**
     * Upload do Logo
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'upload_logo de um arquivo de Logo' })
    upload_logo?: string | null;

    /**
     * Nível de orçamento.
     */
    @IsOptional()
    @ApiProperty({ enum: NivelOrcamento, enumName: 'NivelOrcamento' })
    @ValidateIf((object, value) => value !== null)
    @IsEnum(NivelOrcamento, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(NivelOrcamento).join(', '),
    })
    nivel_orcamento?: NivelOrcamento | null;

    /**
     * Técnicos de Plano Setorial
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipeTecnicoCPDto)
    @ValidateNested()
    @IsObject()
    ps_tecnico_cp?: CreatePSEquipeTecnicoCPDto;

    /**
     * Admin CP de Plano Setorial
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipeAdminCPDto)
    @ValidateNested()
    @IsObject()
    ps_admin_cp?: CreatePSEquipeAdminCPDto;

    /**
     * Ponto Focal Plano Setorial
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipePontoFocalDto)
    @ValidateNested()
    @IsObject()
    ps_ponto_focal?: CreatePSEquipePontoFocalDto;

    /**
     * Legislação de instituição.
     */
    @IsOptional()
    @MaxLength(50000)
    @IsString({ message: 'Legislação de instituição: Precisa ser alfanumérico' })
    legislacao_de_instituicao?: string | null;

    /**
     * ID do órgão administrativo.
     */
    @IsOptional()
    @IsInt({ message: 'Órgão precisa ser um número inteiro' })
    @Min(1, { message: 'ID precisa ser maior que 0' })
    orgao_admin_id?: number | null;

    /**
     * Indica se o monitoramento de orçamento está habilitado.
     */
    @IsOptional()
    @IsBoolean({ message: 'Monitoramento orcamento precisa ser um boolean' })
    monitoramento_orcamento?: boolean;

    /**
     * PDMs anteriores, lista de IDs
     */
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: 'PDM: Cada item precisa ser um número inteiro' })
    @Min(1, { each: true, message: 'ID precisa ser maior que 0' })
    pdm_anteriores?: number[];
}

export class UpdatePdmCicloConfigDto {
    /**
     * Meses em que os ciclos devem ser abertos (1-12)
     * @example [1, 3, 6, 9]
     */
    @IsArray()
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(12, { each: true })
    meses: number[];

    /**
     * Data de início para geração dos ciclos
     * @example "2023-01-01"
     */
    @IsOptional()
    @IsDateYMD()
    data_inicio?: Date;

    /**
     * Data de fim para geração dos ciclos
     * @example "2025-12-31"
     */
    @IsOptional()
    @IsDateYMD()
    data_fim?: Date;
  }
