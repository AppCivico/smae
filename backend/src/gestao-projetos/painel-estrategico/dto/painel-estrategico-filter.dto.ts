import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { NumberArrayTransformOrEmpty } from '../../../auth/transforms/number-array.transform';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class PainelEstrategicoFilterDto {
    @IsArray({ message: '$property| portfolio_id' })
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    portfolio_id: number[];

    @IsArray({ message: '$property| orgao_responsavel_id' })
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    orgao_responsavel_id: number[];

    @IsArray({ message: '$property| projeto_id' })
    @IsOptional()
    @IsInt({ each: true })
    @Transform(NumberArrayTransformOrEmpty)
    projeto_id: number[];
}

export class PainelEstrategicoListaFilterDto extends PainelEstrategicoFilterDto {
    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    ipp?: number = 25;

    @IsOptional()
    @IsInt()
    @Transform(NumberTransform)
    pagina?: number = 1;

    @IsOptional()
    @IsString()
    token_paginacao?: string;
}
