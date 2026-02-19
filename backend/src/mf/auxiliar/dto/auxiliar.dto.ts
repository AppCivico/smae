import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumberString, IsOptional, ValidateIf } from 'class-validator';
import { IsNumberStringCustom } from '../../../common/decorators/IsNumberStringCustom';
import { NumberTransform } from '../../../auth/transforms/number.transform';

export class AutoPreencherValorDto {
    @IsInt()
    @Transform(NumberTransform)
    meta_id: number;

    @IsNumberStringCustom(30, 30)
    @Type(() => String)
    valor_realizado: string;

    @IsOptional()
    @IsNumberStringCustom(30, 30)
    @ValidateIf((object, value) => value !== '')
    @Type(() => String)
    valor_realizado_acumulado?: string;

    @IsOptional()
    @IsBoolean()
    enviar_cp?: boolean;
}

export class EnviarParaCpDto {
    @IsInt()
    @Transform(NumberTransform)
    meta_id: number;

    /**
     * válido apenas para CP e técnico CP simular o comportamento do envio como se fosse um ponto_focal
     * ou seja, os dados não serão conferidos automaticamente
     **/
    @IsOptional()
    @IsBoolean()
    simular_ponto_focal: boolean;
}
