import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDistribuicaoRecursoDto } from './create-distribuicao-recurso.dto';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';
export class UpdateDistribuicaoRecursoDto extends PartialType(
    OmitType(CreateDistribuicaoRecursoDto, ['transferencia_id', 'registros_sei'])
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
}
