import { ApiProperty } from '@nestjs/swagger';
import { Cargo } from '../entities/cargo.entity';

export class ListCargoDto {
    @ApiProperty({ description: 'Lista de cargos', })
    linhas: Cargo[];
}
