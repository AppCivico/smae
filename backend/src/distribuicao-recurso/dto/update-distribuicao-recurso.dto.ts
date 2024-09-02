import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { CreateDistribuicaoParlamentarDto, CreateDistribuicaoRecursoDto } from './create-distribuicao-recurso.dto';
export class UpdateDistribuicaoRecursoDto extends PartialType(
    OmitType(CreateDistribuicaoRecursoDto, ['transferencia_id', 'parlamentares'])
) {
    @IsOptional()
    @IsString()
    @MaxLength(250)
    justificativa_aditamento?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @ValidateIf((object, value) => value !== null)
    @Type(() => UpdateDistribuicaoParlamentarDto)
    parlamentares?: UpdateDistribuicaoParlamentarDto[];
}

export class UpdateDistribuicaoParlamentarDto extends CreateDistribuicaoParlamentarDto {
    @IsOptional()
    @IsNumber()
    id?: number;
}
