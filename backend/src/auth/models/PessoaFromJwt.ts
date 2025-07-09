import { BadRequestException, HttpException } from '@nestjs/common';
import { ModuloSistema, PdmPerfilTipo, Prisma } from 'src/generated/prisma/client';
import { plainToInstance } from 'class-transformer';
import { TipoPdmType } from '../../common/decorators/current-tipo-pdm';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { Arr } from '../../mf/metas/dash/metas.service';
import { AdminCpDbItem } from '../../pdm/pdm.service';
import { PessoaFromJwtBase } from './PessoaFromJwtBase';

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

    public async verificaPermissaoOrcamentoAdminOuCp(
        tipo: TipoPdmType,
        meta_id: number,
        prisma: Prisma.TransactionClient
    ) {
        if (tipo === '_PDM') {
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
        } else {
            const { ehAdmin, equipesIds, metaInfo } = await this.buscaMetaPdmEAcesso(prisma, meta_id, ['ADMIN', 'CP']);
            if (ehAdmin) return;

            const collab = await this.getEquipesColaborador(prisma);
            const participaEquipe = Arr.intersection(equipesIds, collab);

            if (!participaEquipe.length)
                throw new HttpException(
                    `Sem permissão no orçamento para meta: necessário ser colaborador na equipe de ` +
                        `técnico ou administrador, ou administrador do ${metaInfo.pdm.tipo == 'PDM' ? 'Programa de Metas' : 'Plano Setorial'}`,
                    400
                );
        }

        return;
    }

    public async verificaPermissaoOrcamentoPontoFocal(
        tipo: TipoPdmType,
        meta_id: number,
        prisma: Prisma.TransactionClient
    ): Promise<void> {
        if (tipo === '_PDM') {
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
        } else {
            const { ehAdmin, equipesIds, metaInfo } = await this.buscaMetaPdmEAcesso(prisma, meta_id, [
                'ADMIN',
                'CP',
                'PONTO_FOCAL',
            ]);
            if (ehAdmin) return;

            const collab = await this.getEquipesColaborador(prisma);
            const participaEquipe = Arr.intersection(equipesIds, collab);

            if (!participaEquipe.length)
                throw new HttpException(
                    `Sem permissão no orçamento para meta: necessário ser colaborador na equipe ou administrador do ` +
                        `${metaInfo.pdm.tipo == 'PDM' ? 'Programa de Metas' : 'Plano Setorial'}`,
                    400
                );
        }
    }

    private async buscaMetaPdmEAcesso(prisma: Prisma.TransactionClient, meta_id: number, filtros: PdmPerfilTipo[]) {
        let ehAdmin = false;
        const metaInfo = await prisma.meta.findFirstOrThrow({
            where: {
                id: meta_id,
                removido_em: null,
            },
            select: {
                pdm: { select: { ps_admin_cps: true, tipo: true, orgao_admin_id: true } },
            },
        });

        // verifica pelos privilégios de administrador, se tiver já retorna
        if (this.hasSomeRoles([metaInfo.pdm.tipo == 'PDM' ? 'CadastroPDM.administrador' : 'CadastroPS.administrador']))
            ehAdmin = true;

        // verifica pelos privilégios de administrador no orgão, se tiver já retorna
        if (
            this.hasSomeRoles([
                metaInfo.pdm.tipo == 'PDM' ? 'CadastroPDM.administrador_no_orgao' : 'CadastroPS.administrador_no_orgao',
            ]) &&
            this.orgao_id == metaInfo.pdm.orgao_admin_id
        )
            ehAdmin = true;

        let equipesIds: number[] = [];
        if (!ehAdmin) {
            const ps_admin_cps = Array.isArray(metaInfo.pdm.ps_admin_cps)
                ? plainToInstance(AdminCpDbItem, metaInfo.pdm.ps_admin_cps)
                : [];

            console.log('ps_admin_cps', ps_admin_cps);
            const equipes = ps_admin_cps.filter((r) => filtros.includes(r.tipo));
            console.log('equipes', equipes);

            equipesIds = equipes.map((r) => r.equipe_id);
        }

        return { ehAdmin, equipesIds, metaInfo };
    }

    public async orcamentoPermissaoMeta(prisma: Prisma.TransactionClient, meta_id: number, tipo: TipoPdmType) {
        let ehAdmin = false;
        let estaNaMetaCp = false;

        if (tipo == '_PDM') {
            ehAdmin = this.hasSomeRoles(['CadastroMeta.administrador_orcamento']);

            const metasRespCp = ehAdmin
                ? [] // economiza uma query
                : await this.getMetaIdsFromAnyModel(prisma.view_meta_pessoa_responsavel_na_cp);
            estaNaMetaCp = ehAdmin ? true : metasRespCp.includes(meta_id);
        } else {
            const { ehAdmin, equipesIds } = await this.buscaMetaPdmEAcesso(prisma, meta_id, ['ADMIN', 'CP']);
            if (ehAdmin) return { ehAdmin, estaNaMetaCp: true };

            const collab = await this.getEquipesColaborador(prisma);
            const participaEquipe = Arr.intersection(equipesIds, collab);

            estaNaMetaCp = participaEquipe.length > 0;
        }

        return {
            ehAdmin,
            estaNaMetaCp,
        };
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
                `Não é possível ${tipo} ${label} nesta requisição, foi enviando mais de um sistema: ${this.modulo_sistema
                    .map((r) => r)
                    .join(', ')}.\n\nRetorne ao menu principal, escolha um dos sistemas de navegação.`
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
