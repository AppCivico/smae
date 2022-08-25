import { ApiHideProperty } from "@nestjs/swagger";
import { Orgao } from "src/orgao/entities/orgao.entity";

export class Pessoa {
    @ApiHideProperty()
    id?: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;

    atualizado_em?: Date
    orgao?: Orgao
    locacao?: string

    @ApiHideProperty()
    token_acesso_api?: string;
    @ApiHideProperty()
    session_id?: number;
    @ApiHideProperty()
    senha_bloqueada?: boolean


}
