import { PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { MAX_LENGTH_HTML, MAX_LENGTH_MEDIO } from '../../common/consts';

export class SalvarPsCicloFaseBlocoDto {
    @IsInt({ message: 'bloco_id precisa ser um número inteiro' })
    bloco_id: number;

    /**
     * HTML
     */
    @IsString({ message: 'conteudo precisa ser um texto' })
    @MaxLength(MAX_LENGTH_HTML, { message: `O conteúdo do bloco pode ter no máximo ${MAX_LENGTH_HTML} caracteres` })
    conteudo: string;
}

export class SalvarPsCicloFaseDto {
    /**
     * Fase de texto: um item por bloco habilitado. Blocos não enviados ficam vazios nesta revisão.
     */
    @IsOptional()
    @IsArray({ message: 'blocos precisa ser uma lista' })
    @ArrayMaxSize(5, { message: 'No máximo 5 blocos por fase' })
    @ValidateNested({ each: true })
    @Type(() => SalvarPsCicloFaseBlocoDto)
    blocos?: SalvarPsCicloFaseBlocoDto[];

    /**
     * Fase de tags: ids das tags do plano. Lista vazia também conta como fase preenchida.
     */
    @IsOptional()
    @IsArray({ message: 'tags precisa ser uma lista' })
    @ArrayMaxSize(100, { message: 'No máximo 100 tags' })
    @IsInt({ each: true, message: 'Cada tag precisa ser um número inteiro' })
    tags?: number[];
}

export class CreatePsCicloFaseDocumentoDto {
    @IsString({ message: 'upload_token de um arquivo' })
    upload_token: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;
}

export class UpdatePsCicloFaseDocumentoDto extends PickType(CreatePsCicloFaseDocumentoDto, ['descricao']) {}
