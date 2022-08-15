import { ApiProperty } from "@nestjs/swagger";
export class PessoaFromJwt {
    @ApiProperty({ description: 'ID da Pessoa' })
    id: number;
    @ApiProperty({ description: 'Nome Social' })
    nome_exibicao: string;
    @ApiProperty({ description: 'ID da sessão' })
    session_id: number;
}