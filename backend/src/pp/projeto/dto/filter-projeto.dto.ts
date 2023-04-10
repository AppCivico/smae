import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsNumber, isNumber, IsOptional } from 'class-validator';

export class FilterProjetoDto {
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    eh_prioritario?: boolean;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    arquivado?: boolean;

    @IsOptional()
    @ApiProperty({ enum: ProjetoStatus, enumName: 'ProjetoStatus' })
    @IsArray({ message: '$property| precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
        each: true
    })
    status?: ProjetoStatus[];

    /**
     * órgão responsável
     **/
    @IsOptional()
    @IsNumber()
    @Transform((a: any) => (a.value === null ? null : +a.value))
    orgao_responsavel_id?: number;

    /**
     * portfolio_id
     **/
    @IsOptional()
    @IsNumber()
    @Transform((a: any) => (a.value === null ? null : +a.value))
    portfolio_id?: number;
}
