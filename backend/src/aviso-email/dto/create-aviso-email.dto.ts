import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AvisoPeriodo, TipoAviso } from 'src/generated/prisma/client';

export class CreateAvisoEmailDto {
    @IsInt()
    @Min(1)
    @Max(1000)
    numero: number;

    @ApiProperty({
        description: 'qual o periodo que o numero deve se repetir',
        enum: AvisoPeriodo,
        enumName: 'AvisoPeriodo',
    })
    //@IsEnum(AvisoPeriodo)
    numero_periodo: AvisoPeriodo;

    @ApiProperty({
        description: 'qual regra de negocio o aviso de trata',
        enum: TipoAviso,
        enumName: 'TipoAviso',
    })
    //@IsEnum(TipoAviso)
    tipo: TipoAviso;

    @IsBoolean()
    ativo: boolean;

    @IsEmail(undefined, { each: true, message: '$property| E-mail: Precisa ser um endereço válido' })
    @IsArray()
    com_copia: string[];

    @IsInt()
    @Min(0)
    @Max(100000)
    @ApiProperty({ description: 'De quanto em quanto tempo o email deve repetir, após acontecer a primeira vez' })
    recorrencia_dias: number;

    @IsOptional()
    @IsInt()
    tarefa_cronograma_id?: number;

    @IsOptional()
    @IsInt()
    tarefa_id?: number;

    @IsOptional()
    @IsInt()
    projeto_id?: number;

    @IsOptional()
    @IsInt()
    transferencia_id?: number;

    @IsOptional()
    @IsString()
    nota_jwt?: string;
}
