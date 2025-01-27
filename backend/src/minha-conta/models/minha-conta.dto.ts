import { ApiProperty, PickType } from '@nestjs/swagger';
import { PessoaFromJwtBase } from '../../auth/models/PessoaFromJwtBase';
import { ModuloSistema, TipoPdm } from '@prisma/client';

export class SessaoDto extends PickType(PessoaFromJwtBase, [
    'id',
    'nome_exibicao',
    'session_id',
    'privilegios',
    'sistemas',
    'orgao_id',
    'flags',
]) {
    @ApiProperty({ description: 'Lista de Módulos', enum: ModuloSistema, enumName: 'ModuloSistema' })
    sistemas_disponiveis: ModuloSistema[];

    modulos_sobrescritos: boolean;

    equipe_pdm_tipos: TipoPdm[];
}

export class MinhaContaDto {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: SessaoDto;
}
