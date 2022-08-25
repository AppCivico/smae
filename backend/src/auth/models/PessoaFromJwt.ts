import { PessoaFromJwtBase } from "src/auth/models/PessoaFromJwtBase";

export class PessoaFromJwt extends PessoaFromJwtBase {

    // facilitando pra ter que não ter que usar um método estático aqui
    constructor(opts: PessoaFromJwtBase) {
        super()
        this.id = opts.id;
        this.nome_exibicao = opts.nome_exibicao;
        this.session_id = opts.session_id;
        this.privilegios = opts.privilegios;
        this.modulos = opts.modulos;
        this.orgao_id = opts.orgao_id;
    }

    // não requirido, mas se não existir não vai autorizar
    public hasSomeRoles(anyRequiredRole: string[]) {
        if (!this.privilegios) return false;
        return anyRequiredRole.some((role) => this.privilegios.includes(role));
    }
}