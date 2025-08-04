import { ApiProperty } from '@nestjs/swagger';
import { ModuloSistema, PerfilResponsavelEquipe } from 'src/generated/prisma/client';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FeatureFlagDto } from './FeatureFlagDto';

export class PessoaFromJwtBase {
    @ApiProperty({ description: 'ID da Pessoa' })
    id: number;
    @ApiProperty({ description: 'Nome Social' })
    nome_exibicao: string;
    @ApiProperty({ description: 'ID da sessão' })
    session_id: number;

    @ApiProperty({ description: 'Lista de privilégios' })
    privilegios: ListaDePrivilegios[];

    @ApiProperty({ description: 'Lista de Módulos', enum: ModuloSistema, enumName: 'ModuloSistema' })
    sistemas: ModuloSistema[];

    orgao_id: undefined | number;

    flags: FeatureFlagDto;

    modulo_sistema: ModuloSistema[];

    ip: string | null;

    @ApiProperty({
        description: 'Lista de perfis nas equipes que o usuário participa em Programa de Metas',
        isArray: true,
    })
    perfis_equipe_pdm: PerfilResponsavelEquipe[];

    @ApiProperty({
        description: 'Lista de perfis nas equipes que o usuário participa em Planos Setoriais',
        isArray: true,
    })
    perfis_equipe_ps: PerfilResponsavelEquipe[];

    sobreescrever_modulos: boolean;
    modulos_permitidos: ModuloSistema[];
}
