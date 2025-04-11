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

export class AtividadeOrgaoParticipante {
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

export class CreateAtividadeDto {
    /**
     * iniciativa_id
     */
    @IsInt({ message: '$property| tema precisa ser um número ou null' })
    @Type(() => Number)
    iniciativa_id: number;

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
    @IsString({ message: '$property| contexto: Precisa ser alfanumérico' })
    @IsOptional()
    contexto?: string;

    /**
     * complemento
     */
    @IsString({ message: '$property| contexto: Precisa ser alfanumérico' })
    @IsOptional()
    complemento?: string;

    /**
     * compoe_indicador_iniciativa
     */
    @IsBoolean({ message: '$property| precisa ser um boolean' })
    compoe_indicador_iniciativa: boolean;

    /**
     * Quais são os orgaos participantes e seus membros responsáveis
     */
    @IsOptional()
    @IsArray({ message: 'precisa ser uma array, campo obrigatório' })
    @ValidateNested({ each: true })
    @Type(() => AtividadeOrgaoParticipante)
    orgaos_participantes?: AtividadeOrgaoParticipante[];

    /**
     * ID das pessoas que são coordenadores
     * @example "[1, 2, 3]"
     */
    @IsOptional()
    @IsArray({
        message: '$property| responsável(eis) na coordenadoria de projetos: precisa ser uma array, campo obrigatório',
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
    tags?: number[];

    @IsOptional()
    @IsBoolean({ message: 'Campo ativo precisa ser do tipo Boolean' })
    ativo?: boolean;

    @IsOptional()
    @IsString({ each: true })
    @IsArray()
    geolocalizacao: string[];

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
    @ArrayMinSize(0, { message: '$property| precisa ter um item' })
    @ArrayMaxSize(1000, { message: '$property| precisa ter no máximo 1000 items' })
    @ValidateNested({ each: true })
    @Type(() => UpsertOrigemDto)
    origens_extra?: UpsertOrigemDto[];
}
