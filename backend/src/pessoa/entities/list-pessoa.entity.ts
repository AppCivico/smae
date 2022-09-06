import { ApiHideProperty } from "@nestjs/swagger";
import { PessoaFisica } from "@prisma/client";
import { Orgao } from "src/orgao/entities/orgao.entity";

export class ListPessoa {

    id: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string | null

    desativado: boolean

    atualizado_em: Date
    desativado_em?: Date | undefined

    orgao_id?: number | null
    perfil_acesso_ids: number[]
    desativado_motivo?: string | null
    cargo?: string | null
    registro_funcionario?: string | null
    cpf?: string | null

    @ApiHideProperty()
    PessoaFisica?: PessoaFisica
}
