import { ApiProperty } from '@nestjs/swagger';

export class TipoOrgao {
    @ApiProperty({ description: 'ID do tipo do órgão' })
    id?: number;
    @ApiProperty({ description: 'Descrição do tipo' })
    descricao: string;
}
