import { ApiProperty, PickType } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { PessoaFromJwtBase } from '../../auth/models/PessoaFromJwtBase';

export class SessaoDto extends PickType(PessoaFromJwtBase, [
    'id',
    'nome_exibicao',
    'session_id',
    'privilegios',
    'sistemas',
    'orgao_id',
    'flags',
    'ip',
]) {
    @ApiProperty({ description: 'Lista de Módulos', enum: ModuloSistema, enumName: 'ModuloSistema' })
    sistemas_disponiveis: ModuloSistema[];

    modulos_sobrescritos: boolean;

    @ApiProperty({ description: 'Tamanho máximo permitido para upload em bytes' })
    max_upload_size: number;
}

export class MinhaContaDto {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: SessaoDto;
}

export class TesteDataDto {
    @IsDateYMD()
    data: Date;
}
