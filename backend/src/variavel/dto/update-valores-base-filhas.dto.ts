import { Type } from 'class-transformer';
import { IsNumberString, IsOptional } from 'class-validator';

export class UpdateVariavelFilhasDto {
    /**
     * valor_base para a variável filha
     * Para não perder precisão no JSON, usar em formato string, mesmo sendo um número
     * @example "0.0"
     */
    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @Type(() => String)
    valor_base?: number;
}
