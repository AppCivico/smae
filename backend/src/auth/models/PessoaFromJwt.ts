import { HttpException } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { PessoaFromJwtBase } from './PessoaFromJwtBase';
import { Prisma } from '@prisma/client';

export class PessoaFromJwt extends PessoaFromJwtBase {
    // facilitando pra ter que não ter que usar um método estático aqui
    constructor(opts: PessoaFromJwtBase) {
        super();
        Object.assign(this, opts);
    }

    // não requirido, mas se não existir não vai autorizar
    public hasSomeRoles(anyRequiredRole: ListaDePrivilegios[]) {
        if (!this.privilegios) return false;
        return anyRequiredRole.some((role) => this.privilegios.includes(role));
    }

    public async assertHasMetaRespAccess(meta_id: number, prisma: Prisma.TransactionClient) {
        const metas = await this.getMetaIdsFromAnyModel(prisma.view_meta_pessoa_responsavel);
        if (!metas.includes(+meta_id))
            throw new HttpException(`Seu perfil no momento não pode acessar a meta ${meta_id}`, 400);

        return;
    }

    public async verificaPermissaoOrcamentoNaMetaRespNaCp(meta_id: number, prisma: Prisma.TransactionClient) {
        const isAdmin = this.hasSomeRoles(['CadastroMeta.administrador_orcamento']);
        if (isAdmin) return;

        const metas = await prisma.view_meta_pessoa_responsavel_na_cp.findMany({
            where: { pessoa_id: this.id },
            select: { meta_id: true },
        });

        if (!metas.map((r) => r.meta_id).includes(+meta_id))
            throw new HttpException(
                `Sem permissão para editar o orçamento na meta, necessário ser responsável na coordenadoria de planejamento`,
                400
            );
        return;
    }

    public async verificaPermissaoOrcamentoNaMeta(meta_id: number, prisma: Prisma.TransactionClient): Promise<void> {
        const isAdmin = this.hasSomeRoles(['CadastroMeta.administrador_orcamento']);
        if (isAdmin) return;

        const metas = await prisma.view_meta_responsavel_orcamento.findMany({
            where: { pessoa_id: this.id },
            select: { meta_id: true },
        });

        if (!metas.map((r) => r.meta_id).includes(+meta_id))
            throw new HttpException(
                `Sem permissão para editar o orçamento na meta, necessário ser responsável na meta`,
                400
            );
    }

    public async getMetaIdsFromAnyModel(
        metaResponsavel: any // não consegui mais usar o delegate do prisma, o building fica em loop pra sempre....
    ): Promise<number[]> {
        if (!this.privilegios) return [];

        const metas: { meta_id: number }[] = await metaResponsavel.findMany({
            where: { pessoa_id: this.id },
            select: { meta_id: true },
        });

        return metas.map((r) => r.meta_id);
    }
}
