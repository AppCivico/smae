import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ModuloSistema } from 'src/generated/prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';

const TransformModuloSistema = (a: TransformFnParams): ModuloSistema[] | undefined => {
    if (!a.value) return undefined;

    if (!Array.isArray(a.value)) a.value = a.value.split(',');

    const validatedArray = a.value.map((item: any) => {
        const parsedValue = ValidateModuloSistema(item);
        return parsedValue;
    });

    return validatedArray;
};

export class FilterPrivDto {
    @IsArray()
    @IsOptional()
    @Transform(TransformModuloSistema)
    @ApiProperty({ description: 'Lista de Módulos', enum: ModuloSistema, enumName: 'ModuloSistema', isArray: true })
    sistemas?: ModuloSistema[];
}

export class PrivilegioModuloDto {
    id: number;
    codigo: string;
    descricao: string;
    modulo_sistema: ModuloSistema;
}

export class ListaPrivilegiosDto {
    codigo: string;
    nome: string;
    modulo_id: number;
}

export class RetornoListaPrivDto {
    modulos: PrivilegioModuloDto[];
    linhas: ListaPrivilegiosDto[];
}

export function ValidateModuloSistema(item: any) {
    const parsedValue = ModuloSistema[item as ModuloSistema];
    if (parsedValue === undefined) {
        throw new BadRequestException(`Valor '${item}' não é válido para header smae-sistemas`);
    }
    return parsedValue;
}
