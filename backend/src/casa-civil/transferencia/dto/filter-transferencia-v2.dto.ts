import { ApiProperty } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { TransferenciaTipoEsfera } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterTransferenciaV2Dto {
    @IsOptional()
    @IsInt()
    @Min(2000)
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    ano?: number;

    @IsOptional()
    @ApiProperty({ enum: TransferenciaTipoEsfera, enumName: 'TransferenciaTipoEsfera' })
    @IsEnum(TransferenciaTipoEsfera, {
        message:
            '$property| Precisa ser um dos seguintes valores: ' + Object.values(TransferenciaTipoEsfera).join(', '),
    })
    esfera?: TransferenciaTipoEsfera;

    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    preenchimento_completo?: boolean;

    @IsOptional()
    @IsString()
    palavra_chave?: string;

    @IsOptional()
    @IsString()
    token_paginacao?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? 1 : +a.value))
    pagina?: number = 1;
    
    @IsOptional()
    @IsInt()
    @Max(500)
    @Min(1)
    @Transform((a: TransformFnParams) => (a.value === '' ? 25 : +a.value))
    ipp?: number = 25;
}
