import { ApiProperty } from '@nestjs/swagger';
import { Coordenadoria } from '../entities/coordenadoria.entity';

export class ListCoordenadoriaDto {
    @ApiProperty({ description: 'Lista de coordenadorias', })
    linhas: Coordenadoria[];
}
