import { ApiHideProperty } from "@nestjs/swagger";
import { PessoaFisica } from "@prisma/client";
import { Orgao } from "src/orgao/entities/orgao.entity";

export class Pessoa {
    @ApiHideProperty()
    id?: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string

    @ApiHideProperty()
    atualizado_em?: Date

    @ApiHideProperty()
    orgao?: Orgao

    @ApiHideProperty()
    token_acesso_api?: string;
    @ApiHideProperty()
    session_id?: number;
    @ApiHideProperty()
    senha_bloqueada?: boolean

    @ApiHideProperty()
    pessoa_fisica?: PessoaFisica | null


}
