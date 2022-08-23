import { ApiProperty } from '@nestjs/swagger';
import { DivisaoTecnica } from '../entities/divisao-tecnica.entity';

export class ListDivisaoTecnicaDto {
    @ApiProperty({ description: 'Lista de Divisão Técnica', })
    linhas: DivisaoTecnica[];
}
