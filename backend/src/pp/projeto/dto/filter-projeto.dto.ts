import { ApiProperty } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, isNumber, IsOptional } from 'class-validator';

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
    @IsEnum(ProjetoStatus, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ProjetoStatus).join(', '),
    })
    status?: ProjetoStatus;

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
