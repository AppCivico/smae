import { IsArray, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class PainelEstrategicoFilterDto {
    @IsArray({ message: '$property| portifolio_id' })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    portfolio_id: number[];

    @IsArray({ message: '$property| orgao_responsavel_id' })
    @IsArray()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    orgao_responsavel_id: number[];

    @IsArray({ message: '$property| projeto_id' })
    @IsArray()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    projeto_id: number[];
}

export class PainelEstrategicoListaProjetosFilterDto extends PainelEstrategicoFilterDto {
    @IsNumber()
    posicao:number;

    @IsNumber()
    tamanho_pagina:number;
}
