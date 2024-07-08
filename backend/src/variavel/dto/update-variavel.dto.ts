import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateVariavelPDMDto } from './create-variavel.dto';

export class UpdateVariavelDto extends OmitType(PartialType(CreateVariavelPDMDto), [
    'supraregional',
] as const) {
    @IsOptional()
    @IsBoolean()
    suspendida?: boolean;
}
