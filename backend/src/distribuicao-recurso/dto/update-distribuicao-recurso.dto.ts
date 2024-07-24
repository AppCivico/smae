import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDistribuicaoParlamentarDto, CreateDistribuicaoRecursoDto } from './create-distribuicao-recurso.dto';
import {
    IsArray,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    MaxLength,
    ValidateIf,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
export class UpdateDistribuicaoRecursoDto extends PartialType(
    OmitType(CreateDistribuicaoRecursoDto, ['transferencia_id', 'registros_sei', 'parlamentares'])
) {
    @IsOptional()
    @IsArray()
    registros_sei?: {
        id?: number;
        nome: string | null;
        processo_sei: string;
    }[];

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

    @IsOptional()
    @IsNumberString(
        {},
        {
            message:
                '$property| Precisa ser um número com até 35 dígitos antes do ponto, e até 30 dígitos após, enviado em formato String',
        }
    )
    @ValidateIf((object, value) => value !== null)
    valor?: number;
}
