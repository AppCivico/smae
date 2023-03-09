import { Transform } from "class-transformer"
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"

export class CreatePlanoAcaoMonitoramentoDto {
    @IsInt()
    plano_acao_id: number

    @IsOnlyDate()
    data_afericao: Date

    @IsString()
    @MaxLength(2048)
    descricao: string
}

export class FilterPlanoAcaoMonitoramentoDto {
    @IsInt()
    @Transform(({ value }: any) => +value)
    plano_acao_id: number;

    /**
     * trazer apenas o monitoramento mais recente? [data de criação, não é a data de aferição)
     * @example "true"
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }: any) => value === 'true')
    apenas_ultima_revisao?: boolean;
}
