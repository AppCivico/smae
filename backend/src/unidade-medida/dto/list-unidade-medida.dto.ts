import { ApiProperty } from '@nestjs/swagger';
import { UnidadeMedida } from './../entities/unidade-medida.entity';

export class ListUnidadeMedidaDto {
    @ApiProperty({ description: 'Lista de Unidade de Medida', })
    linhas: UnidadeMedida[];
}
