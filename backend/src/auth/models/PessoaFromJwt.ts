import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
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

    public async assertHasMetaPdmAccess(meta_id: number, pessoaAcessoPdm: Prisma.PessoaAcessoPdmDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined>) {
        const varOuCrono = await this.getMetasPdmAccess(pessoaAcessoPdm);
        if (varOuCrono.includes(+meta_id) == false) {
            throw new HttpException(`Seu perfil no momento não pode acessar a meta ${meta_id}`, 400);
        }
        return;
    }

    public async getMetasPdmAccess(pessoaAcessoPdm: Prisma.PessoaAcessoPdmDelegate<Prisma.RejectOnNotFound | Prisma.RejectPerOperation | false | undefined>): Promise<number[]> {
        if (!this.privilegios) return [];

        if (!this.hasSomeRoles(['PDM.tecnico_cp', 'PDM.admin_cp']))
            throw new HttpException('Você precisa ser tecnico_cp ou admin_cp para acessar este recurso no momento', 400);

        const perfilAcesso = await pessoaAcessoPdm.findFirst({ where: { pessoa_id: this.id } });
        if (!perfilAcesso)
            throw new HttpException('Não foi encontrado um perfil calculado para o seu usuário. Verificar se há PDM ativo com ciclos no momento', 400);

        return [...perfilAcesso.metas_variaveis, ...perfilAcesso.metas_cronograma];

    }

}
