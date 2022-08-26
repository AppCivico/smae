import { Orgao } from "src/orgao/entities/orgao.entity";


export class DetalhePessoaDto {
    atualizado_em?: Date
    desativado: boolean
    desativado_em?: Date
    desativado_motivo?: string | null
    id: number;
    email: string;
    nome_exibicao: string;
    nome_completo: string;
    lotacao?: string

    orgao?: Orgao | undefined
    pessoa_perfil_ids: number[]
}
