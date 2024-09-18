import { Transform } from 'class-transformer';
import { IsInt, IsString, MinLength, MaxLength, ValidateIf, IsOptional } from 'class-validator';
import { DateTransform } from 'src/auth/transforms/date.transform';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';

export class CreateDistribuicaoRecursoStatusDto {
    @IsOptional()
    @IsInt()
    status_id?: number;

    @IsOptional()
    @IsInt()
    status_base_id?: number;

    @IsInt()
    orgao_responsavel_id: number;

    @IsString()
    @MinLength(1)
    @MaxLength(250)
    nome_responsavel: string;

    @IsString()
    @MinLength(1)
    @MaxLength(250)
    motivo: string;

    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_troca: Date;
}
