import { ApiProperty } from "@nestjs/swagger";
import { PessoaFromJwt } from "src/auth/models/PessoaFromJwt";
export class MinhaContaDto {
    @ApiProperty({ description: 'Dados da sessão' })
    sessao: PessoaFromJwt
}