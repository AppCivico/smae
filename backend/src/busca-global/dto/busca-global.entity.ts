// dto/unified-search.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModuloSistema } from 'src/generated/prisma/client';

export class UnifiedTableMetadadoDto {
    @ApiProperty()
    key: string;

    @ApiPropertyOptional()
    value: string | number | null;
}

export class UnifiedTableHeadersDto {
    @ApiProperty({ description: 'Header for main column (address/distance)' })
    mainColumn: string;

    @ApiProperty({ description: 'Header for column 1' })
    col1: string;

    @ApiProperty({ description: 'Header for column 2' })
    col2: string;

    @ApiProperty({ description: 'Header for column 3' })
    col3: string;

    @ApiProperty({ description: 'Header for column 4' })
    col4: string;

    @ApiProperty({ description: 'Header for column 5' })
    col5: string;

    @ApiProperty({ description: 'Header for dynamic metadata column' })
    dynamic_metadados: string;
}

export class UnifiedTableRowDto {
    @ApiProperty({ description: 'Unique identifier for the row' })
    row_id: string;

    modulo_sistema: ModuloSistema;

    @ApiProperty()
    entity_id: number;

    @ApiProperty({ description: 'Formatted address and distance' })
    mainColumn: string;

    @ApiPropertyOptional({ description: 'Column 1 value (Portfolio/Macro Tema)' })
    col1?: string | null;

    @ApiProperty({ description: 'Column 2 value (Nome/Título)' })
    col2: string;

    @ApiPropertyOptional({
        description: 'Column 3 value (Órgão - array of strings)',
        type: [String],
    })
    col3?: string[] | null;

    @ApiPropertyOptional({ description: 'Column 4 value (Status)' })
    col4?: string | null;

    @ApiPropertyOptional({ description: 'Column 5 value (fixed data)' })
    col5?: string | null; // This will be the "Metadados" placeholder

    @ApiProperty({
        type: [UnifiedTableMetadadoDto],
        description: 'Dynamic metadata key-value pairs',
    })
    dynamic_metadados: UnifiedTableMetadadoDto[];

    // Internal properties for processing
    distancia_metros_sort?: number;
    original_processing_order: number;
}

export class UnifiedTableResponseDto {
    @ApiProperty({ type: UnifiedTableHeadersDto })
    headers: UnifiedTableHeadersDto;

    @ApiProperty({ type: [UnifiedTableRowDto] })
    rows: UnifiedTableRowDto[];
}
