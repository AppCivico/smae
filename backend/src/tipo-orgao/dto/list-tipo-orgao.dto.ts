import { ApiProperty } from '@nestjs/swagger';
import { TipoOrgao } from '../entities/tipo-orgao.entity';

export class ListTipoOrgaoDto {
    @ApiProperty({ description: 'Lista de Tipo de Órgão' })
    linhas: TipoOrgao[];
}
