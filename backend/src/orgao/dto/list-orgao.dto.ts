import { ApiProperty } from '@nestjs/swagger';
import { OrgaoCompletoDto } from '../entities/orgao.entity';

export class ListOrgaoDto {
    @ApiProperty({ description: 'Lista de Órgão' })
    linhas: OrgaoCompletoDto[];
}
