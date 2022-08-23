import { ApiProperty } from '@nestjs/swagger';
import { Departamento } from '../entities/departamento.entity';

export class ListDepartamentoDto {
    @ApiProperty({ description: 'Lista de Departamentos', })
    linhas: Departamento[];
}
