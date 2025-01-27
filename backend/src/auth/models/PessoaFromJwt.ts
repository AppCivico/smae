import { BadRequestException, HttpException } from '@nestjs/common';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { PessoaFromJwtBase } from './PessoaFromJwtBase';
import { ModuloSistema, Prisma } from '@prisma/client';

export type LogOpt = {
    pessoa_id?: number | null;
    pessoa_sessao_id?: number | null;
    ip?: string | null;
};

export class PessoaFromJwt extends PessoaFromJwtBase {
    private cacheEquipesCollab: number[] | null = null;
    private cacheEquipesResp: number[] | null = null;

    // facilitando pra ter que não ter que usar um método estático aqui
    constructor(opts: PessoaFromJwtBase) {
        super();
        Object.assign(this, opts);
    }

    public async getEquipesColaborador(prisma: Prisma.TransactionClient): Promise<number[]> {
        if (this.cacheEquipesCollab) return this.cacheEquipesCollab;

        const collab = await prisma.grupoResponsavelEquipeParticipante.findMany({
            where: { pessoa_id: this.id, removido_em: null },
            select: { grupo_responsavel_equipe_id: true },
        });

        this.cacheEquipesCollab = collab.map((r) => r.grupo_responsavel_equipe_id);

        return this.cacheEquipesCollab;
    }

    public async getEquipesResponsavel(prisma: Prisma.TransactionClient): Promise<number[]> {
        if (this.cacheEquipesResp) return this.cacheEquipesResp;

        const resp = await prisma.grupoResponsavelEquipeResponsavel.findMany({
            where: { pessoa_id: this.id, removido_em: null },
            select: { grupo_responsavel_equipe_id: true },
        });

        this.cacheEquipesResp = resp.map((r) => r.grupo_responsavel_equipe_id);

        return this.cacheEquipesResp;
    }

    // não requirido, mas se não existir não vai autorizar
    public hasSomeRoles(anyRequiredRole: ListaDePrivilegios[]) {
        if (!this.privilegios) return false;
        return anyRequiredRole.some((role) => this.privilegios.includes(role));
    }

    public cloneWithRoles(anyRequiredRole: ListaDePrivilegios[]): PessoaFromJwt {
        const fakeUser = new PessoaFromJwt(this);
        fakeUser.privilegios.push(...anyRequiredRole);
        return fakeUser;
    }

    public async assertHasMetaRespAccessNaCp(meta_id: number, prisma: Prisma.TransactionClient) {
        const metas = await this.getMetaIdsFromAnyModel(prisma.view_meta_pessoa_responsavel_na_cp);
        if (!metas.includes(+meta_id))
            throw new HttpException(
                `Seu perfil no momento não é responsável CP na meta ID ${meta_id}. Ação não pode ser efetuada.`,
                400
            );

        return;
    }

    public async verificaPermissaoOrcamentoNaMetaRespNaCp(meta_id: number, prisma: Prisma.TransactionClient) {
        // Verificar comentário abaixo sobre as permissões no PS
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
        // TODO aqui vai precisar carregar a meta do PS, ou receber o tipo do PDM, verificar de verdade a permissão
        // do Usuario
        // esse método é chamado em ... 16 lugares!!
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

    public assertOneModuloSistema(tipo: 'buscar' | 'criar' | 'editar' | 'remover', label: string): ModuloSistema {
        if (this.modulo_sistema.length != 1)
            throw new BadRequestException(
                `Apenas um smae-sistema pode enviado por vez para tipo=${tipo} label=${label}.`
            );
        return this.modulo_sistema[0];
    }

    getLogData(): LogOpt {
        return {
            ip: this.ip,
            pessoa_id: this.id,
            pessoa_sessao_id: this.session_id,
        };
    }
}
