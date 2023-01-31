import { ApiProperty } from '@nestjs/swagger';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';

export class MinhaContaDto {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: PessoaFromJwt;
}
