import { ApiProperty } from '@nestjs/swagger';

export class TipoDocumento {
    @ApiProperty({ description: 'ID' })
    id?: number;
    @ApiProperty({ description: 'Extensões aceitas' })
    extensoes?: string | null;
    @ApiProperty({ description: 'Descrição' })
    descricao?: string | null;
    @ApiProperty({ description: 'Título' })
    titulo: string;
    @ApiProperty({ description: 'Código' })
    codigo: string;
}
