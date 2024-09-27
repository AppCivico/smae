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

export class MetaOrgaoParticipante {
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
    @IsInt({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id: number;

    /**
     * lista dos participantes? pelo menos uma pessoa
     * @example "[4, 5, 6]"
     */
    @IsArray({ message: '$property| precisa ser um array' })
    @ArrayMinSize(1, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    participantes: number[];
}

export class CreateMetaDto {
    /**
     * Código
     */
    @IsString({ message: '$property| código: Precisa ser alfanumérico, campo obrigatório' })
    @MinLength(1, { message: '$property| código: pelo menos um caractere' })
    @MaxLength(30, { message: '$property| código: até 30 caracteres' })
    codigo: string;

    /**
     * título
     */
    @IsString({ message: '$property| título: Precisa ser alfanumérico, campo obrigatório' })
    @MinLength(1, { message: '$property| título: pelo menos um caractere' })
    @MaxLength(250, { message: '$property| título: 250 caracteres' })
    titulo: string;

    /**
     * contexto
     */
    @IsOptional()
    @IsString({ message: '$property| contexto: Precisa ser alfanumérico' })
    @MaxLength(10000, { message: '$property| contexto: até código 10000 caracteres' })
    contexto?: string;

    /**
     * complemento
     */
    @IsOptional()
    @IsString({ message: '$property| complemento: Precisa ser alfanumérico' })
    @MaxLength(10000, { message: '$property| complemento: código 10000 caracteres' })
    complemento?: string;

    /**
     * macro_tema_id
     */
    @IsOptional()
    @IsInt({ message: '$property| macro tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    macro_tema_id?: number;

    /**
     * tema_id
     */
    @IsOptional()
    @IsInt({ message: '$property| tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    tema_id?: number;

    /**
     * sub_tema_id
     */
    @IsOptional()
    @IsInt({ message: '$property| sub tema precisa ser um número ou null' })
    @Type(() => Number)
    @ValidateIf((object, value) => value !== null)
    sub_tema_id?: number;

    /**
     * pdm_id
     */
    @IsInt({ message: '$property| pdm_id precisa ser um número' })
    @Type(() => Number)
    pdm_id: number;

    /**
     * Quais são os órgãos participantes e seus membros responsáveis
     * * Apenas no PDM, opcional no PS
     */
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array' })
    @ValidateNested({ each: true })
    @Type(() => MetaOrgaoParticipante)
    orgaos_participantes?: MetaOrgaoParticipante[];

    /**
     * ID das pessoas que são coordenadores, para editar, necessário enviar orgaos_participantes
     * Apenas no PDM, opcional no PS
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ser uma array, campo obrigatório',
    })
    @ArrayMinSize(0, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter pelo menos um item',
    })
    @ArrayMaxSize(100, {
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ter no máximo 100 items',
    })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    coordenadores_cp?: number[];

    /**
     * ID das tag que serão associadas
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @ValidateIf((object, value) => value !== null)
    tags?: number[] | null;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao?: string[];

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
     * Ponto Focal Plano Setorial
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @Type(() => CreatePSEquipePontoFocalDto)
    @ValidateNested()
    @IsObject()
    ps_ponto_focal?: CreatePSEquipePontoFocalDto;

    @IsArray()
    @IsOptional()
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(1000, { message: '$property| precisa ter no máximo 1000 items' })
    @ValidateNested({ each: true })
    @Type(() => UpsertOrigemDto)
    origens_extra?: UpsertOrigemDto[];
}

export class DadosCodTituloAtividadeDto {
    id: number;
    codigo: string;
    titulo: string;
}

export class DadosCodTituloIniciativaDto {
    id: number;
    codigo: string;
    titulo: string;
    atividades: DadosCodTituloAtividadeDto[];
}

export class DadosCodTituloMetaDto {
    id: number;
    codigo: string;
    titulo: string;
    iniciativas: DadosCodTituloIniciativaDto[];
}

export class ListDadosMetaIniciativaAtividadesDto {
    linhas: DadosCodTituloMetaDto[];
}
