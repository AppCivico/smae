import { ApiProperty } from '@nestjs/swagger';

export class FonteRecurso {
    @ApiProperty({ description: 'ID' })
    id?: number;
    @ApiProperty({ description: 'Sigla' })
    sigla?: string | null;
    @ApiProperty({ description: 'Fonte' })
    fonte: string;
}
