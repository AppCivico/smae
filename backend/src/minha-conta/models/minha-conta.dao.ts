import { ApiProperty } from "@nestjs/swagger";
import { PessoaFromJwt } from "src/auth/models/PessoaFromJwt";
export class MinhaContaDao {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: PessoaFromJwt
}