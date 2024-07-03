import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVariavelBaseDto } from './create-variavel.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVariavelDto extends OmitType(PartialType(CreateVariavelBaseDto), [
    'supraregional',
] as const) {
    @IsOptional()
    @IsBoolean()
    suspendida?: boolean;
}
