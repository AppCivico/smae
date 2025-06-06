import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterOrgaoDto {
    @ApiPropertyOptional({ description: 'Texto de busca (sigla, descrição, email...)' })
    @IsOptional()
    @IsString()
    palavra_chave?: string;

    @ApiPropertyOptional({ description: 'Limite máximo de itens retornados', default: 10 })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @Min(1)
    limit?: number;
}
