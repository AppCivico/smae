import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { CreateVariavelPDMDto, ValorBaseFilhaDto } from './create-variavel.dto';

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
