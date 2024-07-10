import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { ProjetoStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FilterProjetoDto } from 'src/pp/projeto/dto/filter-projeto.dto';
import { NumberTransform } from '../../../auth/transforms/number.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { NumberArrayTransformOrUndef } from 'src/auth/transforms/number-array.transform';

export class CreateRelObrasDto extends OmitType(PartialType(FilterProjetoDto), [
    'eh_prioritario',
    'arquivado',
    'status',
    'portfolio_id',
]) {
    @IsNumber()
    @Transform(NumberTransform)
    portfolio_id: number;

    @IsOptional()
    @IsNumber()
    @Transform(NumberTransform)
    grupo_tematico_id?: number;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    data_termino?: Date;

    @IsOptional()
    @IsNumber()
    @Transform(NumberTransform)
    orgao_responsavel_id?: number;

    @IsOptional()
    @Transform(NumberArrayTransformOrUndef)
    projeto_regioes?: number[];
}
