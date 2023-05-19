import { IsBoolean, IsInt, IsNumberString, IsOptional, ValidateIf } from "class-validator";

export class AutoPreencherValorDto {
    @IsInt()
    meta_id: number

    @IsNumberString(
        {},
        { message: 'Precisa ser um número com até 30 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String ou vazio para remover' },
    )
    @ValidateIf((object, value) => value !== '')
    valor_realizado: string;

    @IsOptional()
    @IsBoolean()
    enviar_cp: boolean;
}

export class EnviarParaCpDto {
    @IsInt()
    meta_id: number

    /**
     * válido apenas para CP e técnico CP simular o comportamento do envio como se fosse um ponto_focal
     * ou seja, os dados não serão conferidos automaticamente
     **/
    @IsOptional()
    @IsBoolean()
    simular_ponto_focal: boolean;
}
