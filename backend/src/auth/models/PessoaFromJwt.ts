import { HttpException } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { PessoaFromJwtBase } from './PessoaFromJwtBase';

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

    public async assertHasMetaRespAccess(meta_id: number, metaResponsavel: any) {
        const varOuCrono = await this.getMetasOndeSouResponsavel(metaResponsavel);
        if (varOuCrono.includes(+meta_id) == false) {
            throw new HttpException(`Seu perfil no momento não pode acessar a meta ${meta_id}`, 400);
        }
        return;
    }

    public async getMetasOndeSouResponsavel(
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
