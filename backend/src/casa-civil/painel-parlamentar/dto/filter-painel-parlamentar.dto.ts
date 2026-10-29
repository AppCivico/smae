import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { NumberTransform } from 'src/auth/transforms/number.transform';

export class FilterPainelParlamentarDto {
    @ApiProperty({ description: 'Ano inicial (transferencia.ano), inclusivo', required: false })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    ano_inicio?: number;

    @ApiProperty({ description: 'Ano final (transferencia.ano), inclusivo', required: false })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    ano_fim?: number;
}

export class FilterPainelParlamentarTransferenciasDto extends FilterPainelParlamentarDto {
    @ApiProperty({ description: 'Só transferências com distribuição para este órgão', required: false })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    orgao_gestor_id?: number;

    @ApiProperty({
        description: 'Ordenação pelo valor do repasse',
        enum: ['asc', 'desc'],
        default: 'desc',
        required: false,
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    ordem_valor?: 'asc' | 'desc' = 'desc';

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(200)
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Transform(NumberTransform)
    pagina?: number = 1;

    @IsOptional()
    @IsString()
    token_paginacao?: string;
}
