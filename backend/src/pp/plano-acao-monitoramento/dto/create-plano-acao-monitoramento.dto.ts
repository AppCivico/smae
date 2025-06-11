import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreatePlanoAcaoMonitoramentoDto {
    @IsInt()
    plano_acao_id: number;

    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_afericao: Date;

    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string;
}

export class UpdatePlanoAcaoMonitoramentoDto extends OmitType(PartialType(CreatePlanoAcaoMonitoramentoDto), [
    'plano_acao_id',
] as const) {}

export class FilterPlanoAcaoMonitoramentoDto {
    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => +value)
    plano_acao_id?: number;

    @IsOptional()
    @IsInt()
    @Transform(({ value }: any) => +value)
    projeto_risco_id?: number;

    /**
     * trazer apenas o monitoramento mais recente? [data de criação, não é a data de aferição)
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}
