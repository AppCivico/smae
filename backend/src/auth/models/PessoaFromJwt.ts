import { PessoaFromJwtBase } from "./PessoaFromJwtBase";


export class PessoaFromJwt extends PessoaFromJwtBase {

    // facilitando pra ter que não ter que usar um método estático aqui
    constructor(opts: PessoaFromJwtBase) {
        super()
        Object.assign(this, opts)
    }

    // não requirido, mas se não existir não vai autorizar
    public hasSomeRoles(anyRequiredRole: string[]) {
        if (!this.privilegios) return false;
        return anyRequiredRole.some((role) => this.privilegios.includes(role));
    }
}