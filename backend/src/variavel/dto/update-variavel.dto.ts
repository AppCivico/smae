import { OmitType, PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, IsNumberString, IsOptional, ValidateNested } from 'class-validator';
import { CreateVariavelPDMDto } from './create-variavel.dto';
import { Transform, Type } from 'class-transformer';
import { NumberTransform } from '../../auth/transforms/number.transform';

export class ValorBaseFilhaDto {
    @IsInt({ message: 'filha_id precisa ser numérico' })
    @Transform(NumberTransform)
    filha_id: number;

    /**
     * valor_base para a variável filha
     * Para não perder precisão no JSON, usar em formato string, mesmo sendo um número
     * @example "0.0"
     */
    @IsNumberString(
        {},
        {
            message:
                'Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @Type(() => String)
    valor_base: number;
}

export class UpdateVariavelDto extends OmitType(PartialType(CreateVariavelPDMDto), ['supraregional'] as const) {
    @IsOptional()
    @IsBoolean()
    suspendida?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ValorBaseFilhaDto)
    @ArrayMaxSize(1000, { message: 'valores_base_filhas: precisa ter no máximo 1000 items' })
    valores_base_filhas?: ValorBaseFilhaDto[];
}
