import { ApiProperty } from '@nestjs/swagger';
import { Orgao } from '../entities/orgao.entity';

export class ListOrgaoDto {
    @ApiProperty({ description: 'Lista de Órgão' })
    linhas: Orgao[];
}
