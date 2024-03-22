import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDistribuicaoRecursoDto } from './create-distribuicao-recurso.dto';
import { IsArray, IsOptional } from 'class-validator';

export class UpdateDistribuicaoRecursoDto extends PartialType(
    OmitType(CreateDistribuicaoRecursoDto, ['transferencia_id', 'registros_sei'])
) {
    @IsOptional()
    @IsArray()
    registros_sei?: {
        id?: number;
        processo_sei: string;
    }[];
}
