import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVariavelDto } from './create-variavel.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVariavelDto extends OmitType(PartialType(CreateVariavelDto), ['indicador_id'] as const) {
    @IsOptional()
    @IsBoolean()
    suspendida?: boolean
}
