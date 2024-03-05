import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagDto } from './FeatureFlagDto';
import { ModuloSistema } from '@prisma/client';

export class PessoaFromJwtBase {
    @ApiProperty({ description: 'ID da Pessoa' })
    id: number;
    @ApiProperty({ description: 'Nome Social' })
    nome_exibicao: string;
    @ApiProperty({ description: 'ID da sessão' })
    session_id: number;

    @ApiProperty({ description: 'Lista de privilégios' })
    privilegios: string[];

    @ApiProperty({ description: 'Lista de Módulos', enum: ModuloSistema, enumName: 'ModuloSistema' })
    sistemas: ModuloSistema[];

    @ApiProperty({ description: 'Lista de Módulos dos privilégios' })
    modulos: string[];

    orgao_id: undefined | number;

    flags: FeatureFlagDto;

    modulo_sistema: ModuloSistema[]
}
