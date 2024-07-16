import { ApiProperty } from '@nestjs/swagger';
import { OdsDto } from '../entities/ods.entity';

export class ListOdsDto {
    @ApiProperty({ description: 'Lista de ODS' })
    linhas: OdsDto[];
}
