import { ApiProperty } from '@nestjs/swagger';
import { FeatureFlagDto } from './FeatureFlagDto';

export class PessoaFromJwtBase {
    @ApiProperty({ description: 'ID da Pessoa' })
    id: number;
    @ApiProperty({ description: 'Nome Social' })
    nome_exibicao: string;
    @ApiProperty({ description: 'ID da sessão' })
    session_id: number;

    @ApiProperty({ description: 'Lista de privilegios' })
    privilegios: string[];

    @ApiProperty({ description: 'Lista de Módulos' })
    modulos: string[];

    orgao_id: undefined | number;

    flags: FeatureFlagDto;
}
