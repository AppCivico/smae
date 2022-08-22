import { ApiHideProperty } from "@nestjs/swagger";

export class Pessoa {
    @ApiHideProperty()
    id?: number;
    email: string;
    @ApiHideProperty()
    token_acesso_api?: string;
    nome_exibicao: string;
    nome_completo: string;
    @ApiHideProperty()
    session_id?: number;
    @ApiHideProperty()
    senha_bloqueada: boolean
}
