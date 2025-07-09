import { ApiProperty, PickType } from '@nestjs/swagger';
import { ModuloSistema } from 'src/generated/prisma/client';
import { PessoaFromJwtBase } from '../../auth/models/PessoaFromJwtBase';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { Transform } from 'class-transformer';
import { DateTransform } from '../../auth/transforms/date.transform';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

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
}

export class MinhaContaDto {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: SessaoDto;
}

export class TesteDataDto {
    @IsDateYMD()
    data: Date;
}
