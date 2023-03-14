import { OmitType, PartialType } from "@nestjs/mapped-types"
import { Transform, Type } from "class-transformer"
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from "class-validator"
import { IsOnlyDate } from "../../../common/decorators/IsDateOnly"

export class CreatePlanoAcaoMonitoramentoDto {
    @IsInt()
    plano_acao_id: number

    @IsOnlyDate()
    @Type(() => Date)
    @ValidateIf((object, value) => value !== null)
    data_afericao: Date

    @IsString()
    @MaxLength(2048)
    descricao: string
}

export class UpdatePlanoAcaoMonitoramentoDto extends OmitType(PartialType(CreatePlanoAcaoMonitoramentoDto), ['plano_acao_id'] as const) {

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
