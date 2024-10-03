import { IsArray, IsOptional, ValidateIf } from 'class-validator';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { Transform } from 'class-transformer';
import { DateTransform } from '../../../auth/transforms/date.transform';

export class CreateCasaCivilAtividadesPendentesFilterDto {

    @IsOptional()
    @IsArray({ message: '$property| tipo_id: precisa ser uma array.' })
    tipo_id?:number[];

    @IsOptional()
    @Transform(DateTransform)
    @IsOnlyDate()
    @ValidateIf((object, value) => value !== null)
    data_inicio?: Date;

    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_termino?: Date;

    @IsOptional()
    @IsArray({ message: '$property| orgao_id: precisa ser uma array.' })
    orgao_id?:number[];
}
