import { ApiProperty } from '@nestjs/swagger';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { NumberArrayTransform } from '../../../auth/transforms/number-array.transform';
import { BadRequestException } from '@nestjs/common';

export class MfDashTransferenciasDto {
    @ApiProperty({ description: 'ID da transferência' })
    transferencia_id: number;
    identificador: string;
    atividade: string;
    data: Date | null;
    data_origem: string;
    orgaos: number[];
    esfera: string;
    objeto: string;
    partido_id: number | null;
}

export class ListMfDashTransferenciasDto {
    linhas: MfDashTransferenciasDto[];
}

const TransformTransferenciaTipoEsfera = (a: TransformFnParams): TransferenciaTipoEsfera[] | undefined => {
    if (!a.value) return undefined;

    if (!Array.isArray(a.value)) a.value = a.value.split(',');

    const validatedArray = a.value.map((item: any) => {
        const parsedValue = ValidateTransferenciaTipoEsfera(item);
        return parsedValue;
    });

    return validatedArray;
};

export class FilterDashTransferenciasDto {
    @IsOptional()
    @IsArray()
    @ApiProperty({
        isArray: true,
        enum: TransferenciaTipoEsfera,
        enumName: 'TransferenciaTipoEsfera',
        description: 'Esfera da transferência',
    })
    @Transform(TransformTransferenciaTipoEsfera)
    esfera?: TransferenciaTipoEsfera[];

    @ApiProperty({ description: 'Contém qualquer um dos partidos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    partido_ids?: number[];

    @IsOptional()
    @IsArray()
    @MaxLength(1000, { each: true })
    @IsString({ each: true })
    @ApiProperty({ description: 'Atividade do cronograma' })
    atividade?: string[];

    @ApiProperty({ description: 'Contém qualquer um dos órgãos', example: '[]' })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransform)
    orgaos_ids?: number[];

    @IsOptional()
    @IsString()
    palavra_chave?: string;
}

function ValidateTransferenciaTipoEsfera(item: any) {
    const parsedValue = TransferenciaTipoEsfera[item as TransferenciaTipoEsfera];
    if (parsedValue === undefined) {
        throw new BadRequestException(`Valor '${item}' não é válido para TransferenciaTipoEsfera`);
    }
    return parsedValue;
}
