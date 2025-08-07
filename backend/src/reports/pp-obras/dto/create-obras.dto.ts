import { PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';
import { NumberArrayTransformOrEmpty } from '../../../auth/transforms/number-array.transform';

export class CreateRelObrasDto extends PickType(FilterProjetoDto, ['orgao_responsavel_id', 'projeto_id']) {
    @IsNumber()
    @Expose()
    portfolio_id: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    grupo_tematico_id?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    orgao_responsavel_id?: number;

    @IsOptional()
    @IsNumber()
    @Expose()
    projeto_regiao_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    @Transform(DateTransform)
    @Expose()
    periodo?: Date;

    @Expose()
    @IsOptional()
    @Transform(NumberArrayTransformOrEmpty)
    @IsArray({ message: '$property| precisa ser uma array.' })
    @ArrayMaxSize(100, { message: '$property| precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| precisa ser um número inteiro.' })
    regiao_id?: number[];
}
