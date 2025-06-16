import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, ValidateNested } from 'class-validator';
import { MAX_EPOCH } from '../../common/dto/consts';

export class TipoVersionDto {
    @ApiProperty({
        description: 'Nome do tipo de entidade para sincronizar',
        example: 'orgao',
    })
    @IsString()
    tipo: string;

    @ApiPropertyOptional({
        description: 'Versão do schema para este tipo específico. Se null ou não informado, fará sync completo',
        example: '2024.0.1',
        nullable: true,
    })
    @IsOptional()
    versao?: string | null;
}

export class SyncCadastroBasicoRequestDto {
    @ApiPropertyOptional({
        description: 'Timestamp (epoch-ms) para buscar registros alterados após essa data',
        example: 1749640235000,
    })
    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => (value ? Number(value) : undefined))
    @Max(MAX_EPOCH)
    atualizado_em?: number;

    @ApiPropertyOptional({
        description: 'Array de tipos e suas versões. Se não informado, todos os tipos serão sincronizados',
        example: [
            { tipo: 'orgao', versao: '2024.0.1' },
            { tipo: 'regiao', versao: null },
            { tipo: 'unidadeMedida', versao: '2024.0.1' },
        ],
        type: [TipoVersionDto],
    })
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TipoVersionDto)
    tipos?: TipoVersionDto[];
}

export class SyncCadastroBasicoDto {
    @ApiProperty({ description: 'Tipo da entidade sincronizada (ex: orgao, regiao, etc)' })
    tipo: string;

    @ApiProperty({ description: 'Versão atual do schema da entidade' })
    versao: string;

    @ApiProperty({
        description: 'Indica se o schema está desatualizado e é necessário refazer a sincronização completa',
    })
    schema_desatualizado: boolean;

    @ApiProperty({ description: 'Lista de registros ativos da entidade (linhas completas)' })
    linhas: any[];

    @ApiProperty({ description: 'Lista de IDs de registros da entidade que foram removidos logicamente' })
    removidos: number[];
}

export class SyncCadastroBasicoRespostaDto {
    @ApiProperty({ description: 'Lista de entidades básicas sincronizadas, uma por tipo (ex: orgao, regiao, etc)' })
    dados: SyncCadastroBasicoDto[];

    @ApiProperty({ description: 'Timestamp atual do servidor para controle de próxima sincronização' })
    timestamp: number;
}
