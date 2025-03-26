import { ApiProperty } from '@nestjs/swagger';

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
