import { ApiProperty } from '@nestjs/swagger';
import { Ods } from '../entities/ods.entity';

export class ListOdsDto {
    @ApiProperty({ description: 'Lista de ODS' })
    linhas: Ods[];
}
