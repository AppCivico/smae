import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { CreatePSEquipePontoFocalDto, CreatePSEquipeTecnicoCPDto } from '../../pdm/dto/create-pdm.dto';
import { UpsertOrigemDto } from '../../common/dto/origem-pdm.dto';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class IniciativaOrgaoParticipante {
    /**
     * orgão participante é responsável? Pelo menos um precisa ser responsável
     * @example false
     */
    @IsBoolean({ message: 'Campo responsavel precisa ser do tipo Boolean' })
    responsavel: boolean;

    /**
     * órgão
     * @example 1
     */
    @IsInt({ message: 'orgao_id' })
    @Type(() => Number)
    orgao_id: number;

    /**
     * lista dos participantes? pelo menos uma pessoa
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: 'precisa ser um array' })
    @ArrayMinSize(1, { message: 'precisa ter um item' })
    @ArrayMaxSize(100, { message: 'precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    participantes: number[];
}

export class CreateIniciativaDto {
    /**
     * meta_id
     */
    @IsInt({ message: 'tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    meta_id: number;

    /**
     * Código
     */
    @IsString({ message: 'código: Precisa ser alfanumérico, campo obrigatório' })
    @MinLength(1, { message: 'código: pelo menos um caractere' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Código' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    codigo: string;

    /**
     * título
     */
    @IsString({ message: 'título: Precisa ser alfanumérico, campo obrigatório' })
    @MinLength(1, { message: 'título: pelo menos um caractere' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    titulo: string;

    /**
     * contexto
     */
    @IsString({ message: 'contexto: Precisa ser alfanumérico' })
    @IsOptional()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Contexto" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    contexto?: string;

    /**
     * complemento
     */
    @IsString({ message: 'contexto: Precisa ser alfanumérico' })
    @IsOptional()
    complemento?: string;

    /**
     * compoe_indicador_meta
     */
    @IsBoolean({ message: 'precisa ser um boolean' })
    compoe_indicador_meta: boolean;

    /**
     * status
     */
    @IsString({ message: 'status: Precisa ser alfanumérico, campo obrigatório' })
    @MinLength(1, { message: 'status: pelo menos um caractere' })
    @IsOptional()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Status' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    status?: string;

    /**
     * Quais são os orgaos participantes e seus membros responsáveis
     */
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, campo obrigatório' })
    @ValidateNested({ each: true })
    @Type(() => IniciativaOrgaoParticipante)
    orgaos_participantes?: IniciativaOrgaoParticipante[];

    /**
     * ID das pessoas que são coordenadores
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({
        message: 'responsável(eis) na coordenadoria de projetos: precisa ser uma array, campo obrigatório',
    })
    @ArrayMaxSize(100, {
        message: 'responsável(eis) na coordenadoria de projetos: precisa ter no máximo 100 items',
    })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    coordenadores_cp?: number[];

    /**
     * ID das tag que serão associadas
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({ message: 'tag(s): precisa ser uma array.' })
    @ArrayMaxSize(100, { message: 'tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: 'Cada item precisa ser um número inteiro' })
    tags?: number[];

    @IsOptional()
    @IsBoolean({ message: 'Campo ativo precisa ser do tipo Boolean' })
    ativo?: boolean;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao?: string[];

    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipeTecnicoCPDto)
    @ValidateNested()
    @IsObject()
    ps_tecnico_cp?: CreatePSEquipeTecnicoCPDto;

    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipePontoFocalDto)
    @ValidateNested()
    @IsObject()
    ps_ponto_focal?: CreatePSEquipePontoFocalDto;

    @IsArray()
    @IsOptional()
    @ArrayMinSize(0, { message: 'precisa ter um item' })
    @ArrayMaxSize(1000, { message: 'precisa ter no máximo 1000 items' })
    @ValidateNested({ each: true })
    @Type(() => UpsertOrigemDto)
    origens_extra?: UpsertOrigemDto[];
}
