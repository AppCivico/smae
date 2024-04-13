import { BadRequestException } from '@nestjs/common';
import { ApiProperty, IntersectionType, PartialType, PickType } from '@nestjs/swagger';
import { StatusNota } from '@prisma/client';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { IdSigla } from '../../../common/dto/IdSigla.dto';
import { IdNomeExibicao } from '../../../meta/entities/meta.entity';
import { FindOneParams } from '../../../common/decorators/find-params';

const TransformStatusNota = (a: TransformFnParams): StatusNota[] | undefined => {
    if (!a.value) return undefined;

    if (!Array.isArray(a.value)) a.value = a.value.split(',');

    const validatedArray = a.value.map((item: any) => {
        const parsedValue = ValidateStatusNota(item);
        return parsedValue;
    });

    return validatedArray;
};

const StrArrTransform = (a: TransformFnParams): string[] | undefined => {
    if (Array.isArray(a.value)) return a.value;
    return a.value === '' ? undefined : [a.value];
};

export class CreateNotaDto {
    @IsString({ message: '$property| nota: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| nota: Mínimo 1 caracteres' })
    @MaxLength(5000, { message: '$property| nota: Máximo 5000 caracteres' })
    nota: string;

    @Type(() => Date)
    @IsOnlyDate()
    data_nota: Date;

    @IsString()
    bloco_token: string;

    @IsInt()
    tipo_nota_id: number;

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Type(() => Date)
    rever_em?: Date | null;

    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsBoolean()
    dispara_email: boolean | null;

    @ApiProperty({ enum: StatusNota, enumName: 'StatusNota' })
    @IsEnum(StatusNota)
    status: StatusNota;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @ValidateIf((object, value) => value !== null)
    @Type(() => NotaEnderecamentoDto)
    enderecamentos?: NotaEnderecamentoDto[] | null;
}

export class BuscaNotaDto {
    @IsString({ each: true })
    @IsArray()
    @Transform(StrArrTransform)
    blocos_token: string[];

    @IsOptional()
    @IsEnum(StatusNota, { each: true })
    @ApiProperty({ enum: StatusNota, enumName: 'StatusNota', isArray: true, required: false })
    @Transform(TransformStatusNota)
    status: StatusNota[];
}

export class NotaEnderecamentoDto {
    @IsInt()
    @ValidateIf((object, value) => value !== null)
    orgao_enderecado_id: number | null;

    @IsInt()
    @ValidateIf((object, value) => value !== null)
    pessoa_enderecado_id: number | null;
}

export class UpdateNotaDto extends PartialType(
    PickType(CreateNotaDto, ['nota', 'status', 'data_nota', 'rever_em', 'dispara_email', 'enderecamentos'])
) {}

export class NovaRespostaDto {
    @IsString({ message: '$property| resposta: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| resposta: Mínimo 1 caracteres' })
    @MaxLength(5000, { message: '$property| resposta: Máximo 5000 caracteres' })
    resposta: string;

    @IsInt()
    nota_enderecamento_id: number;
}

export class NotaEnderecamentoRespostas {
    resposta: string;
    nota_enderecamento_id: number;
    orgao_enderecado: IdSigla;
    criador: IdNomeExibicao;
    criado_em: Date;
    id: number;
    pode_remover: boolean;
}

export class ListTipoNotaDto {
    linhas: TipoNotaItem[];
}

export class TipoNotaItem {
    id_jwt: string;
    bloco_id: number;
    nota: string;
    data_nota: Date;
    data_ordenacao: Date;
    bloco_token: string;
    tipo_nota_id: number;
    pessoa_responsavel: IdNomeExibicao;
    orgao_responsavel: IdSigla;
    rever_em?: Date;
    dispara_email: boolean;
    status: StatusNota;

    n_enderecamentos: number;
    n_repostas: number;
    ultima_resposta: Date | null;
}

export class NotaEnderecamentoItem {
    id: number;
    orgao_enderecado: IdSigla | null;
    pessoa_enderecado: IdNomeExibicao | null;
}

export class TipoNotaDetail extends TipoNotaItem {
    enderecamentos: NotaEnderecamentoItem[];
    respostas: NotaEnderecamentoRespostas[];
}

export class FindNotaParam {
    @IsString()
    @MaxLength(200)
    id_jwt: string;
}

export class DeleteNotaRespostaParam extends IntersectionType(FindNotaParam, FindOneParams) {}

export class RecordWithIdJwt {
    id_jwt: string;
}

function ValidateStatusNota(item: any) {
    const parsedValue = StatusNota[item as StatusNota];
    if (parsedValue === undefined) {
        throw new BadRequestException(`Valor '${item}' não é válido para status-nota`);
    }
    return parsedValue;
}
