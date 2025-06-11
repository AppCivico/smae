import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    Inject,
    Injectable,
    Logger,
    forwardRef,
} from '@nestjs/common';
import { PdmPerfilTipo, PerfilResponsavelEquipe, Prisma, TipoPdm } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { ReadOnlyBooleanType } from '../common/TypeReadOnly';
import { Date2YMD } from '../common/date2ymd';
import { PdmModoParaTipo, TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { EquipeRespService } from '../equipe-resp/equipe-resp.service';
import { PrismaService } from '../prisma/prisma.service';
import { ArquivoBaseDto } from '../upload/dto/create-upload.dto';
import { UploadService } from '../upload/upload.service';
import { CreatePdmDocumentDto, UpdatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmDto } from './dto/create-pdm.dto';
import { FilterPdmDto } from './dto/filter-pdm.dto';
import { OrcamentoConfig } from './dto/list-pdm.dto';
import { PdmDto, PlanoSetorialDto } from './dto/pdm.dto';
import { UpdatePdmOrcamentoConfigDto } from './dto/update-pdm-orcamento-config.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { ListPdm } from './entities/list-pdm.entity';
import { PdmItemDocumentDto } from './entities/pdm-document.entity';
import { PdmCicloService } from './pdm.ciclo.service';
import { EnsureString } from '../common/EnsureString';
import { AddTaskRecalcVariaveis } from '../variavel/variavel.service';

const MAPA_PERFIL_PERMISSAO: Record<PdmPerfilTipo, PerfilResponsavelEquipe> = {
    ADMIN: 'AdminPS',
    CP: 'TecnicoPS',
    PONTO_FOCAL: 'PontoFocalPS',
} as const;

export class AdminCpDbItem {
    tipo: PdmPerfilTipo;
    orgao_id: number;
    equipe_id: number;
}

export const PDMGetPermissionSet = async (tipo: TipoPdmType, user: PessoaFromJwt, prisma: PrismaService) => {
    const orList: Prisma.Enumerable<Prisma.PdmWhereInput> = [];

    const andList: Prisma.Enumerable<Prisma.PdmWhereInput> = [];

    if (
        (tipo == '_PS' || tipo == 'PDM_AS_PS') &&
        user.hasSomeRoles([
            'CadastroMetaPS.listar',
            'CadastroPS.administrador',
            'CadastroPS.administrador_no_orgao',
            'CadastroMetaPDM.listar',
            'CadastroPDM.administrador',
            'CadastroPDM.administrador_no_orgao',
            'SMAE.GrupoVariavel.participante',
        ])
    ) {
        const tipoPdm = PdmModoParaTipo(tipo);
        andList.push({
            tipo: tipoPdm,
        });

        if (user.hasSomeRoles(['CadastroPS.administrador', 'CadastroPDM.administrador'])) {
            Logger.log('Usuário com permissão total em *TODOS* PS/PDM');
            orList.push({
                // só pra ter algo, sempre vai dar true
                removido_em: null,
            });
        }

        if (orList.length == 0) {
            // cache warmup
            const collab = await user.getEquipesColaborador(prisma);

            if (user.hasSomeRoles(['CadastroPS.administrador_no_orgao', 'CadastroPDM.administrador_no_orgao'])) {
                Logger.log('Usuário com permissão total *no órgão* em PS/PDM no órgão');

                const orgaoId = user.orgao_id;
                if (!orgaoId) throw new HttpException('Usuário sem órgão associado', 400);

                orList.push({
                    tipo: tipoPdm,
                    OR: [
                        {
                            PdmPerfil: {
                                some: {
                                    removido_em: null,
                                    tipo: 'ADMIN',
                                    orgao_id: orgaoId,
                                    // não entra a equipe
                                },
                            },
                        },
                        {
                            criado_por: user.id,
                        },
                    ],
                });
            }

            if (user.hasSomeRoles(['SMAE.GrupoVariavel.participante'])) {
                Logger.log('Usuário pode ser participante em equipes PS/PDM');

                orList.push({
                    tipo: tipoPdm,
                    PdmPerfil: {
                        some: {
                            removido_em: null,
                            tipo: { in: ['CP', 'PONTO_FOCAL', 'ADMIN'] },
                            equipe_id: { in: collab },
                        },
                    },
                });
            }
        }

        // se continua vazio, não tem permissão em nenhuma situação
        if (orList.length == 0) {
            throw new HttpException('Não foi possível determinar permissões para Plano Setorial', 403);
        }
        andList.push({
            OR: orList,
        });
    } else if (tipo == '_PS') {
        throw new HttpException('Usuário sem permissão para acessar Plano Setorial.', 403);
    } else if (tipo == 'PDM_AS_PS') {
        throw new HttpException('Usuário sem permissão para acessar Programa de Metas (Módulo 3).', 403);
    }

    // talvez tenha que liberar pra mais pessoas, mas na teoria seria isso
    // mas tem GET no /pdm o tempo inteiro no frontend, então talvez precise liberar pra mais perfis
    if (
        tipo == '_PDM' &&
        user.hasSomeRoles([
            'PDM.ponto_focal',
            'PDM.tecnico_cp',
            'PDM.admin_cp',
            'CadastroPdm.inserir',
            'CadastroPdm.ativar',
            'CadastroPdm.editar',
            'CadastroPdm.inativar',
        ])
    ) {
        andList.push({
            tipo: 'PDM',
        });
    } else if (tipo == '_PDM') {
        throw new HttpException('Usuário sem permissão para acessar Programa de Metas (Módulo 1).', 403);
    }

    const ret: Prisma.Enumerable<Prisma.PdmWhereInput> = [];
    ret.push({
        AND: andList,
    });

    return ret;
};

@Injectable()
export class PdmService {
    private readonly logger = new Logger(PdmService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => UploadService))
        private readonly uploadService: UploadService,
        @Inject(forwardRef(() => EquipeRespService))
        private readonly equipeRespService: EquipeRespService,
        private readonly pdmCicloService: PdmCicloService
    ) {}

    async create(tipo: TipoPdmType, dto: CreatePdmDto, user: PessoaFromJwt) {
        const logger = LoggerWithLog('PdmService.create');
        if (tipo == '_PDM') {
            if (!user.hasSomeRoles(['CadastroPdm.inserir'])) {
                throw new ForbiddenException('Você não tem permissão para inserir Programas de Metas');
            }

            if (!dto.nivel_orcamento) throw new BadRequestException('Nível de Orçamento é obrigatório');
            this.removeCamposPlanoSetorial(dto);
        } else if (tipo == '_PS' || tipo == 'PDM_AS_PS') {
            if (
                !user.hasSomeRoles([
                    'CadastroPS.administrador',
                    'CadastroPDM.administrador',
                    'CadastroPS.administrador_no_orgao',
                    'CadastroPDM.administrador_no_orgao',
                ])
            ) {
                throw new ForbiddenException('Você não tem permissão para inserir Plano Setorial');
            }

            if (!dto.monitoramento_orcamento) {
                dto.nivel_orcamento = 'Meta';
            } else if (dto.nivel_orcamento && !dto.nivel_orcamento) {
                throw new BadRequestException('Nível de Orçamento é obrigatório');
            }

            if (!dto.orgao_admin_id && !user.hasSomeRoles(['CadastroPS.administrador']))
                throw new BadRequestException(
                    'Órgão Administrador é obrigatório para Plano Setorial quando não administrador de Plano Setorial'
                );
        }

        await this.verificaOrgaoAdmin(dto, this.prisma, user);
        await this.verificaPdmAnterioes(dto, this.prisma);

        this.verificaRotulos(dto);

        const similarExists = await this.prisma.pdm.count({
            where: {
                tipo: PdmModoParaTipo(tipo),
                descricao: { equals: dto.nome, mode: 'insensitive' },
            },
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let arquivo_logo_id: undefined | number;
        if (dto.upload_logo) {
            arquivo_logo_id = this.uploadService.checkUploadOrDownloadToken(dto.upload_logo);
        }

        delete dto.upload_logo;

        if (dto.possui_atividade && !dto.possui_iniciativa)
            throw new HttpException('possui_atividade| possui_iniciativa precisa ser True para ativar Atividades', 400);

        const now = new Date(Date.now());
        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pdm = await prismaTx.pdm.create({
                data: {
                    criado_por: user.id,
                    criado_em: now,
                    arquivo_logo_id: arquivo_logo_id,
                    nome: dto.nome,
                    descricao: EnsureString(dto.descricao),
                    prefeito: dto.prefeito,
                    equipe_tecnica: EnsureString(dto.equipe_tecnica),
                    data_inicio: dto.data_inicio,
                    data_fim: dto.data_fim,
                    data_publicacao: dto.data_publicacao,
                    periodo_do_ciclo_participativo_inicio: dto.periodo_do_ciclo_participativo_inicio,
                    periodo_do_ciclo_participativo_fim: dto.periodo_do_ciclo_participativo_fim,
                    rotulo_macro_tema: EnsureString(dto.rotulo_macro_tema, 'Macro Tema'),
                    rotulo_tema: EnsureString(dto.rotulo_tema, 'Tema'),
                    rotulo_sub_tema: EnsureString(dto.rotulo_sub_tema, 'Sub Tema'),
                    rotulo_contexto_meta: EnsureString(dto.rotulo_contexto_meta, 'Contexto'),
                    rotulo_complementacao_meta: EnsureString(dto.rotulo_complementacao_meta, 'Complementação'),
                    rotulo_iniciativa: EnsureString(dto.rotulo_iniciativa, 'Iniciativa'),
                    rotulo_atividade: EnsureString(dto.rotulo_atividade, 'Atividade'),
                    possui_macro_tema: dto.possui_macro_tema,
                    possui_tema: dto.possui_tema,
                    possui_sub_tema: dto.possui_sub_tema,
                    possui_contexto_meta: dto.possui_contexto_meta,
                    possui_complementacao_meta: dto.possui_complementacao_meta,
                    possui_iniciativa: dto.possui_iniciativa,
                    possui_atividade: dto.possui_atividade,
                    nivel_orcamento: dto.nivel_orcamento!,
                    legislacao_de_instituicao: EnsureString(dto.legislacao_de_instituicao),
                    orgao_admin_id: dto.orgao_admin_id,
                    monitoramento_orcamento: dto.monitoramento_orcamento,
                    pdm_anteriores: dto.pdm_anteriores,
                    tipo: PdmModoParaTipo(tipo),
                    ativo: false,
                    sistema: tipo == 'PDM_AS_PS' ? 'ProgramaDeMetas' : tipo == '_PDM' ? 'PDM' : 'PlanoSetorial',
                },
            });
            logger.log(`PDM criado com ID: ${pdm.id} e tipo: ${tipo}`);
            logger.log(`dto: ${JSON.stringify(pdm)}`);

            if (dto.ps_admin_cp || dto.ps_tecnico_cp || dto.ps_ponto_focal) {
                this.logger.log(`criando ps_admin_cp / ps_tecnico_cp / ps_ponto_focal`);
                await this.update(
                    tipo,
                    pdm.id,
                    {
                        ps_admin_cp: dto.ps_admin_cp,
                        ps_tecnico_cp: dto.ps_tecnico_cp,
                        ps_ponto_focal: dto.ps_ponto_focal,
                    },
                    user,
                    prismaTx,
                    logger
                );
            }

            if (tipo == '_PDM') {
                this.logger.log(`Chamando monta_ciclos_pdm...`);
                await prismaTx.$queryRaw`select monta_ciclos_pdm(${pdm.id}::int, false)`;
            } else {
                await this.pdmCicloService.updateCicloConfig(
                    tipo,
                    pdm.id,
                    {
                        data_inicio: dto.data_inicio,
                        data_fim: dto.data_fim,
                        meses: dto.meses ?? [],
                    },
                    user,
                    prismaTx
                );
            }

            await logger.saveLogs(prismaTx, user.getLogData());
            return pdm;
        });

        return created;
    }

    private removeCamposPlanoSetorial(dto: CreatePdmDto | UpdatePdmDto) {
        delete dto.legislacao_de_instituicao;
        delete dto.orgao_admin_id;
        delete dto.monitoramento_orcamento;
        delete dto.pdm_anteriores;
    }

    async findAllIds(tipo: TipoPdmType, user: PessoaFromJwt): Promise<number[]> {
        const active = true;

        const listActive = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
                ativo: active,
                tipo: PdmModoParaTipo(tipo),
                AND: await PDMGetPermissionSet(tipo, user, this.prisma),
            },
            select: {
                id: true,
            },
        });

        return listActive.map((pdm) => pdm.id);
    }

    async findAll(tipo: TipoPdmType, filters: FilterPdmDto, user: PessoaFromJwt): Promise<ListPdm[]> {
        const active = filters.ativo;

        const listActive = await this.prisma.pdm.findMany({
            where: {
                removido_em: null,
                ativo: active,
                tipo: PdmModoParaTipo(tipo),
                id: filters.id,
                AND: await PDMGetPermissionSet(tipo, user, this.prisma),
            },
            select: {
                id: true,
                nome: true,
                descricao: true,
                ativo: true,
                data_inicio: true,
                data_fim: true,
                equipe_tecnica: true,
                prefeito: true,
                data_publicacao: true,
                periodo_do_ciclo_participativo_inicio: true,
                periodo_do_ciclo_participativo_fim: true,
                rotulo_iniciativa: true,
                rotulo_atividade: true,
                rotulo_macro_tema: true,
                rotulo_tema: true,
                rotulo_sub_tema: true,
                rotulo_contexto_meta: true,
                rotulo_complementacao_meta: true,
                possui_macro_tema: true,
                possui_tema: true,
                possui_sub_tema: true,
                possui_contexto_meta: true,
                possui_complementacao_meta: true,
                possui_atividade: true,
                possui_iniciativa: true,
                arquivo_logo_id: true,
                nivel_orcamento: true,
                tipo: true,
                ps_admin_cps: true,
                orgao_admin_id: true,
                considerar_atraso_apos: true,
                sistema: true,
            },
            orderBy: [{ ativo: 'desc' }, { data_inicio: 'desc' }, { data_fim: 'desc' }],
        });

        const listActiveTmp = await Promise.all(
            listActive.map(async (pdm) => {
                let logo = null;
                if (pdm.arquivo_logo_id) {
                    logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token;
                }
                const pode_editar = await this.calcPodeEditar({ ...pdm, tipo: tipo }, user);

                return {
                    id: pdm.id,
                    nome: pdm.nome,
                    descricao: pdm.descricao,
                    ativo: pdm.ativo,
                    prefeito: pdm.prefeito,
                    rotulo_macro_tema: pdm.rotulo_macro_tema,
                    rotulo_tema: pdm.rotulo_tema,
                    rotulo_sub_tema: pdm.rotulo_sub_tema,
                    rotulo_contexto_meta: pdm.rotulo_contexto_meta,
                    rotulo_complementacao_meta: pdm.rotulo_complementacao_meta,
                    rotulo_iniciativa: pdm.rotulo_iniciativa,
                    rotulo_atividade: pdm.rotulo_atividade,
                    possui_macro_tema: pdm.possui_macro_tema,
                    possui_tema: pdm.possui_tema,
                    possui_sub_tema: pdm.possui_sub_tema,
                    possui_contexto_meta: pdm.possui_contexto_meta,
                    possui_complementacao_meta: pdm.possui_complementacao_meta,
                    possui_iniciativa: pdm.possui_iniciativa,
                    possui_atividade: pdm.possui_atividade,
                    nivel_orcamento: pdm.nivel_orcamento,
                    tipo: pdm.tipo,

                    pode_editar: pode_editar,
                    logo: logo,
                    data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
                    data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
                    data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
                    periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
                    periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(
                        pdm.periodo_do_ciclo_participativo_inicio
                    ),
                    considerar_atraso_apos: Date2YMD.toStringOrNull(pdm.considerar_atraso_apos),
                    sistema: pdm.sistema,
                } satisfies ListPdm;
            })
        );

        return listActiveTmp;
    }

    async calcPodeEditar(
        pdm: { tipo: TipoPdmType; ps_admin_cps: Prisma.JsonValue | null; orgao_admin_id: number | null },
        user: PessoaFromJwt
    ): Promise<boolean> {
        if (pdm.tipo == '_PS' || pdm.tipo == 'PDM_AS_PS') {
            if (user.hasSomeRoles(['CadastroPS.administrador', 'CadastroPDM.administrador'])) {
                this.logger.log('Usuário com permissão total em PS');
                return true;
            }
            if (!user.orgao_id) throw new HttpException('Usuário sem órgão associado, necessário para PS', 400);

            // é pra ficar assim mesmo, não adicionar a equipe
            if (
                user.hasSomeRoles(['CadastroPS.administrador_no_orgao', 'CadastroPDM.administrador_no_orgao']) &&
                pdm.orgao_admin_id
            ) {
                this.logger.log('Usuário com permissão total em PS no órgão');
                return user.orgao_id == pdm.orgao_admin_id;
            }

            const dbValue = pdm.ps_admin_cps?.valueOf();
            const collab = await user.getEquipesColaborador(this.prisma);
            let podeEditar = false;

            if (Array.isArray(dbValue)) {
                this.logger.log('Verificando permissão pelas equipes');

                const parsed = plainToInstance(AdminCpDbItem, dbValue);

                // se for ADMIN, pode editar o PDM/PS
                podeEditar = parsed.some(
                    (item) => item.tipo == 'ADMIN' && item.orgao_id == user.orgao_id && collab.includes(item.equipe_id)
                );

                if (!podeEditar) {
                    // e se for TEC todos os itens são do mesmo órgão
                    podeEditar = parsed.some(
                        (item) => item.tipo == 'CP' && item.orgao_id == user.orgao_id && collab.includes(item.equipe_id)
                    );
                }

                this.logger.verbose(`podeEditar: ${podeEditar}`);
                return podeEditar;
            }

            this.logger.verbose(`podeEditar: false`);
            // ponto focal nunca pode editar

            return false;
        } else if (pdm.tipo == '_PDM') {
            return user.hasSomeRoles(['CadastroPdm.editar']);
        }
        return false;
    }

    async getDetail(
        tipo: TipoPdmType,
        id: number,
        user: PessoaFromJwt,
        readonly: ReadOnlyBooleanType,
        exEquipe?: boolean
    ): Promise<PdmDto | PlanoSetorialDto> {
        const pdm = await this.loadPdm(tipo, id, user, readonly);

        if (pdm.arquivo_logo_id) {
            pdm.logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token;
        }

        const pdmConfig = await this.prisma.pdmCicloConfig.findFirst({
            where: {
                pdm_id: id,
                ultima_revisao: true,
            },
            select: { meses: true },
        });

        const pdmInfo: PdmDto = {
            id: pdm.id,
            nome: pdm.nome,
            descricao: pdm.descricao,
            prefeito: pdm.prefeito,
            equipe_tecnica: pdm.equipe_tecnica,
            rotulo_macro_tema: pdm.rotulo_macro_tema,
            rotulo_tema: pdm.rotulo_tema,
            rotulo_sub_tema: pdm.rotulo_sub_tema,
            rotulo_contexto_meta: pdm.rotulo_contexto_meta,
            rotulo_complementacao_meta: pdm.rotulo_complementacao_meta,
            possui_macro_tema: pdm.possui_macro_tema,
            possui_tema: pdm.possui_tema,
            possui_sub_tema: pdm.possui_sub_tema,
            possui_contexto_meta: pdm.possui_contexto_meta,
            possui_complementacao_meta: pdm.possui_complementacao_meta,
            logo: pdm.logo,
            ativo: pdm.ativo,
            rotulo_iniciativa: pdm.rotulo_iniciativa,
            rotulo_atividade: pdm.rotulo_atividade,
            possui_iniciativa: pdm.possui_iniciativa,
            possui_atividade: pdm.possui_atividade,
            nivel_orcamento: pdm.nivel_orcamento,
            tipo: pdm.tipo,
            sistema: pdm.sistema,
            meses: pdmConfig?.meses ?? [],
            pode_editar: await this.calcPodeEditar({ ...pdm, tipo }, user),
            data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
            data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
            data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
            periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
            periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_inicio),
            considerar_atraso_apos: Date2YMD.toStringOrNull(pdm.considerar_atraso_apos),
        };
        console.log(pdmInfo.pode_editar);

        let merged: PdmDto | PlanoSetorialDto = pdmInfo;
        if (tipo == '_PS' || tipo == 'PDM_AS_PS') {
            if (!pdm.monitoramento_orcamento) pdmInfo.nivel_orcamento = '';

            const pdmPerfis = await this.prisma.pdmPerfil.findMany({
                where: {
                    pdm_id: id,
                    tipo: { in: ['ADMIN', 'CP', 'PONTO_FOCAL'] },
                    relacionamento: 'PDM',
                    removido_em: null,
                },
                select: {
                    tipo: true,
                    equipe: { select: { id: true, titulo: true } },
                },
            });

            const ps_admin_cp = pdmPerfis.filter((perfil) => perfil.tipo === 'ADMIN');
            const ps_tecnico_cp = pdmPerfis.filter((perfil) => perfil.tipo === 'CP');
            const ps_ponto_focal = pdmPerfis.filter((perfil) => perfil.tipo === 'PONTO_FOCAL');

            const pdm_anteriores = pdm.pdm_anteriores.length
                ? await this.prisma.pdm.findMany({
                      where: { id: { in: pdm.pdm_anteriores } },
                      select: {
                          id: true,
                          nome: true,
                          orgao_admin: { select: { id: true, descricao: true, sigla: true } },
                      },
                  })
                : [];

            const expandeEquipe = function (item: { equipe: { id: number; titulo: string } }[]) {
                return item.map((item) => {
                    return { id: item.equipe.id, titulo: item.equipe.titulo };
                });
            };

            merged = {
                ...pdmInfo,
                legislacao_de_instituicao: pdm.legislacao_de_instituicao,
                monitoramento_orcamento: pdm.monitoramento_orcamento,
                orgao_admin: pdm.orgao_admin,
                pdm_anteriores: pdm_anteriores,
                ps_admin_cp: {
                    equipes: exEquipe ? expandeEquipe(ps_admin_cp) : ps_admin_cp.map((item) => item.equipe.id),
                },
                ps_tecnico_cp: {
                    equipes: exEquipe ? expandeEquipe(ps_tecnico_cp) : ps_tecnico_cp.map((item) => item.equipe.id),
                },
                ps_ponto_focal: {
                    equipes: exEquipe ? expandeEquipe(ps_ponto_focal) : ps_ponto_focal.map((item) => item.equipe.id),
                },
            } satisfies PlanoSetorialDto;
        }

        return merged;
    }

    private async loadPdm(
        tipo: TipoPdmType,
        id: number,
        user: PessoaFromJwt,
        readonly: ReadOnlyBooleanType,
        prismaCtx?: Prisma.TransactionClient
    ) {
        const prismaTx = prismaCtx || this.prisma;
        const pdm = await prismaTx.pdm.findFirst({
            where: {
                id: id,
                tipo: PdmModoParaTipo(tipo),
                removido_em: null,
            },
            include: {
                orgao_admin: {
                    select: { id: true, descricao: true, sigla: true },
                },
            },
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const pode_editar = await this.calcPodeEditar({ ...pdm, tipo }, user);
        if (!pode_editar && readonly == 'ReadWrite') {
            throw new ForbiddenException(
                `Você não tem permissão para editar este ${pdm.tipo == 'PDM' ? 'Programas de Metas' : 'Plano Setorial'}`
            );
        }

        return pdm;
    }

    private async verificarPrivilegiosEdicao(
        updatePdmDto: UpdatePdmDto | null,
        user: PessoaFromJwt,
        pdm: { ativo: boolean; tipo: TipoPdmType; orgao_admin_id: number | null; ps_admin_cps: Prisma.JsonValue | null }
    ) {
        if (
            updatePdmDto &&
            pdm.tipo == '_PDM' &&
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === true &&
            user.hasSomeRoles(['CadastroPdm.ativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode ativar Programas de Metas`);
        } else if (
            updatePdmDto &&
            pdm.tipo == '_PDM' &&
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === false &&
            user.hasSomeRoles(['CadastroPdm.inativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode inativar Programas de Metas`);
        }

        const podeEditar = await this.calcPodeEditar(pdm, user);
        if (!podeEditar)
            throw new ForbiddenException(
                `Você não tem permissão para ${
                    updatePdmDto ? 'editar' : 'remover'
                } este ${pdm.tipo == '_PDM' || pdm.tipo == 'PDM_AS_PS' ? 'Programas de Metas' : 'Plano Setorial'}`
            );
    }

    async delete(tipo: TipoPdmType, id: number, user: PessoaFromJwt): Promise<void> {
        const pdm = await this.loadPdm(tipo, id, user, 'ReadWrite');

        await this.verificarPrivilegiosEdicao({}, user, { ...pdm, tipo: tipo });

        const now = new Date(Date.now());
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const emUso = await prismaTx.pdm.count({
                where: {
                    pdm_anteriores: { has: id },
                    removido_em: null,
                },
            });
            if (emUso > 0) {
                const lista = await prismaTx.pdm.findMany({
                    where: {
                        pdm_anteriores: { has: id },
                        removido_em: null,
                    },
                    select: { id: true, nome: true },
                });
                throw new HttpException(
                    `Este ${tipo == '_PDM' ? 'Programas de Metas' : 'Plano Setorial'} está sendo referenciado como anterior por ${emUso} ${
                        emUso == 1 ? 'outro registro' : 'outros registros'
                    }: ${lista.map((item) => item.nome).join(', ')}`,
                    400
                );
            }

            await prismaTx.pdm.update({
                where: { id: id },
                data: {
                    removido_por: user.id,
                    removido_em: now,
                },
            });
        });
    }

    async update(
        tipo: TipoPdmType,
        id: number,
        dto: UpdatePdmDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient,
        loggerCtx?: LoggerWithLog
    ) {
        const pdm = await this.loadPdm(tipo, id, user, 'ReadWrite', prismaCtx);
        const prismaTx = prismaCtx || this.prisma;
        const logger = loggerCtx || LoggerWithLog('PdmService.update');
        logger.log(`updatePdmDto: ${JSON.stringify(dto)}`);
        await this.verificarPrivilegiosEdicao(dto, user, { ...pdm, tipo: tipo });
        if (tipo == '_PDM') {
            if (dto.nivel_orcamento == null) throw new BadRequestException('Nível de Orçamento é obrigatório no PDM.');

            this.removeCamposPlanoSetorial(dto);
        } else {
            if ('monitoramento_orcamento' in dto && !dto.monitoramento_orcamento) {
                dto.nivel_orcamento = 'Meta';
            }

            if ('nivel_orcamento' in dto || 'monitoramento_orcamento' in dto) {
                if (!dto.nivel_orcamento || !('monitoramento_orcamento' in dto))
                    throw new BadRequestException(
                        'Nível de Orçamento e Monitoramento de Orçamento são obrigatórios se enviar um deles.'
                    );
                if (dto.monitoramento_orcamento && !dto.nivel_orcamento)
                    throw new BadRequestException(
                        'Nível de Orçamento é obrigatório se Monitoramento de Orçamento verdadeiro.'
                    );
            }
        }

        await this.verificaOrgaoAdmin(dto, prismaTx, user);
        await this.verificaPdmAnterioes(dto, prismaTx);
        this.verificaRotulos(dto);

        if (dto.nome) {
            const similarExists = await prismaTx.pdm.count({
                where: {
                    tipo: pdm.tipo,
                    descricao: { equals: dto.nome, mode: 'insensitive' },
                    NOT: { id: id },
                },
            });
            if (similarExists > 0)
                throw new HttpException(
                    'descricao| Descrição igual ou semelhante já existe em outro registro ativo',
                    400
                );
        }

        let arquivo_logo_id: number | undefined | null;
        // se enviar vazio, transformar em null para limpar o logo
        if (dto.upload_logo == '') dto.upload_logo = null;
        if (dto.upload_logo) {
            arquivo_logo_id = this.uploadService.checkUploadOrDownloadToken(dto.upload_logo);
        } else if (dto.upload_logo === null) {
            arquivo_logo_id = null;
        }
        delete dto.upload_logo;

        const now = new Date(Date.now());
        let verificarCiclos = false;
        let ativarPdm: boolean | undefined = undefined;
        let verificarVariaveisGlobais = false;

        const performUpdate = async (prismaTx: Prisma.TransactionClient): Promise<void> => {
            if (pdm.tipo == 'PDM') {
                if (dto.ativo === true && pdm.ativo == false) {
                    ativarPdm = true;
                    await this.desativaPdmAtivo(prismaTx, now, user);
                    verificarCiclos = true;
                } else if (dto.ativo === false && pdm.ativo == true) {
                    ativarPdm = false;
                    await this.desativaPdm(prismaTx, id, now, user);
                    verificarCiclos = true;
                }

                delete dto.ativo;
            } else if (typeof dto.ativo == 'boolean' && dto.ativo !== pdm.ativo) {
                ativarPdm = dto.ativo;
                verificarVariaveisGlobais = true;
                if (ativarPdm == false)
                    await prismaTx.pdm.update({
                        where: { id: id },
                        data: {
                            desativado_por: user.id,
                            desativado_em: now,
                        },
                    });
            }

            if (
                (pdm.sistema == 'PlanoSetorial' || pdm.sistema == 'ProgramaDeMetas') &&
                ('meses' in dto || 'data_inicio' in dto || 'data_fim' in dto)
            ) {
                const cicloConfigAtiva = await prismaTx.pdmCicloConfig.findFirst({
                    where: {
                        pdm_id: id,
                        ultima_revisao: true,
                    },
                });

                const mesesSorted = dto.meses?.sort((a, b) => a - b).join(',');
                const currentMeses = cicloConfigAtiva?.meses.sort((a, b) => a - b).join(',');

                if (mesesSorted != currentMeses || dto.data_inicio != pdm.data_inicio || dto.data_fim != pdm.data_fim) {
                    await this.pdmCicloService.updateCicloConfig(
                        tipo,
                        pdm.id,
                        {
                            data_inicio: dto.data_inicio ?? pdm.data_inicio,
                            data_fim: dto.data_fim ?? pdm.data_fim,
                            meses: dto.meses ?? cicloConfigAtiva?.meses ?? [],
                        },
                        user,
                        prismaTx
                    );
                }
            }

            await prismaTx.pdm.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    nome: EnsureString(dto.nome),
                    descricao: EnsureString(dto.descricao),
                    prefeito: EnsureString(dto.prefeito, ''),
                    equipe_tecnica: EnsureString(dto.equipe_tecnica),
                    data_inicio: dto.data_inicio,
                    data_fim: dto.data_fim,
                    data_publicacao: dto.data_publicacao,
                    periodo_do_ciclo_participativo_inicio: dto.periodo_do_ciclo_participativo_inicio,
                    periodo_do_ciclo_participativo_fim: dto.periodo_do_ciclo_participativo_fim,
                    rotulo_macro_tema: EnsureString(dto.rotulo_macro_tema, 'Macro Tema'),
                    rotulo_tema: EnsureString(dto.rotulo_tema, 'Tema'),
                    rotulo_sub_tema: EnsureString(dto.rotulo_sub_tema, 'Sub Tema'),
                    rotulo_contexto_meta: EnsureString(dto.rotulo_contexto_meta, 'Contexto'),
                    rotulo_complementacao_meta: EnsureString(dto.rotulo_complementacao_meta, 'Complementação'),
                    rotulo_iniciativa: EnsureString(dto.rotulo_iniciativa, 'Iniciativa'),
                    rotulo_atividade: EnsureString(dto.rotulo_atividade, 'Atividade'),
                    possui_macro_tema: dto.possui_macro_tema,
                    possui_tema: dto.possui_tema,
                    possui_sub_tema: dto.possui_sub_tema,
                    possui_contexto_meta: dto.possui_contexto_meta,
                    possui_complementacao_meta: dto.possui_complementacao_meta,
                    possui_iniciativa: dto.possui_iniciativa,
                    possui_atividade: dto.possui_atividade,
                    nivel_orcamento: dto.nivel_orcamento!,
                    legislacao_de_instituicao: EnsureString(dto.legislacao_de_instituicao),
                    orgao_admin_id: dto.orgao_admin_id,
                    monitoramento_orcamento: dto.monitoramento_orcamento,
                    pdm_anteriores: dto.pdm_anteriores,
                    ativo: ativarPdm,
                    arquivo_logo_id: arquivo_logo_id,
                },
                select: { id: true },
            });

            const updated = await prismaTx.pdm.findFirstOrThrow({
                where: { id: id },
                select: { orgao_admin_id: true },
            });

            if (dto.ps_admin_cp) {
                const pessoas = await this.upsertPdmResponsaveis(id, 'ADMIN', user, prismaTx, now, dto.ps_admin_cp);
                const orgaosIguais = pessoas
                    .map((p) => p.orgao_id)
                    .every((orgaoId) => orgaoId == updated.orgao_admin_id);
                if (!orgaosIguais) {
                    throw new BadRequestException('Todos os administradores CP devem ser do mesmo órgão administrador');
                }
            }
            if (dto.ps_tecnico_cp) await this.upsertPdmResponsaveis(id, 'CP', user, prismaTx, now, dto.ps_tecnico_cp);
            if (dto.ps_ponto_focal)
                await this.upsertPdmResponsaveis(id, 'PONTO_FOCAL', user, prismaTx, now, dto.ps_ponto_focal);

            if (dto.ps_admin_cp || dto.ps_tecnico_cp || dto.ps_ponto_focal) {
                const cachedView = await prismaTx.pdm.findFirst({
                    where: { id: id },
                    select: {
                        PdmPerfil: {
                            where: {
                                relacionamento: 'PDM',
                                removido_em: null,
                            },
                            select: {
                                tipo: true,
                                equipe_id: true,
                                orgao_id: true,
                            },
                        },
                    },
                });
                await prismaTx.pdm.update({
                    where: { id: id },
                    data: {
                        ps_admin_cps: cachedView?.PdmPerfil ?? [],
                    },
                });
            }

            if (verificarCiclos) {
                this.logger.log(`chamando monta_ciclos_pdm...`);
                this.logger.log(JSON.stringify(await prismaTx.$queryRaw`select monta_ciclos_pdm(${id}::int, false)`));
            }

            if (verificarVariaveisGlobais) {
                await AddTaskRecalcVariaveis(prismaTx, { pdmId: id });
            }
        };

        if (prismaCtx) {
            await performUpdate(prismaCtx);
        } else {
            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                await performUpdate(prismaTx);
            });
        }

        if (verificarCiclos) await this.pdmCicloService.executaJobCicloFisico(ativarPdm, id, now);

        // força o carregamento da tabela pdmOrcamentoConfig
        await this.getOrcamentoConfig(tipo, id, true, prismaTx);

        return { id: id };
    }

    private async verificaOrgaoAdmin(dto: UpdatePdmDto, prismaTx: Prisma.TransactionClient, user: PessoaFromJwt) {
        if (dto.orgao_admin_id) {
            const org = await prismaTx.orgao.findFirstOrThrow({
                where: { id: dto.orgao_admin_id, removido_em: null },
                select: { id: true, descricao: true, sigla: true },
            });

            if (!user.hasSomeRoles(['CadastroPS.administrador', 'CadastroPDM.administrador'])) {
                if (user.hasSomeRoles(['CadastroPS.administrador_no_orgao', 'CadastroPDM.administrador_no_orgao'])) {
                    if (user.orgao_id != dto.orgao_admin_id) {
                        throw new BadRequestException(
                            `Você não tem permissão no órgão ${org.descricao} (${org.sigla})`
                        );
                    }
                }
            }
        }
    }

    private async verificaPdmAnterioes(dto: UpdatePdmDto, prismaTx: Prisma.TransactionClient) {
        if (Array.isArray(dto.pdm_anteriores)) {
            const qtde = await prismaTx.pdm.count({
                where: { id: { in: dto.pdm_anteriores }, tipo: 'PS', removido_em: null },
            });
            if (qtde != dto.pdm_anteriores.length) {
                throw new BadRequestException('pdm_anteriores| Um ou mais Plano Setoriais anteriores não são válidos');
            }
        }
    }

    private async upsertPdmResponsaveis(
        pdm_id: number,
        tipo: PdmPerfilTipo,
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient,
        now: Date,
        data: {
            equipes: number[];
        }
    ): Promise<AdminCpDbItem[]> {
        const prevVersion = await prismaTx.pdmPerfil.findMany({
            where: { pdm_id, removido_em: null, tipo: tipo },
            select: { equipe_id: true },
        });

        const tipoEquipe = MAPA_PERFIL_PERMISSAO[tipo];
        if (!tipoEquipe) {
            throw new BadRequestException('Tipo de equipe inválido');
        }

        const keptRecord: number[] = prevVersion.map((r) => r.equipe_id);

        for (const equipe_id of keptRecord) {
            if (!data.equipes.includes(equipe_id)) {
                // O participante estava presente na versão anterior, mas não na nova versão
                this.logger.log(`equipe removida: ${equipe_id}`);
                await prismaTx.pdmPerfil.updateMany({
                    where: {
                        equipe_id: equipe_id,
                        relacionamento: 'PDM',
                        pdm_id,
                        tipo: tipo,
                        removido_em: null,
                    },
                    data: { removido_em: now, removido_por: user.id },
                });
            }
        }

        const cpItens: AdminCpDbItem[] = [];
        for (const equipe_id of data.equipes) {
            const equipe = await prismaTx.grupoResponsavelEquipe.findFirst({
                where: {
                    id: equipe_id,
                    removido_em: null,
                    perfil: tipoEquipe,
                },
                select: {
                    id: true,
                    orgao_id: true,
                },
            });
            if (!equipe) throw new BadRequestException(`Equipe ID ${equipe_id} inválida ou de tipo incorreto.`);
            cpItens.push({
                tipo: tipo,
                orgao_id: equipe.orgao_id,
                equipe_id: equipe.id,
            });

            if (!keptRecord.includes(equipe_id)) {
                // A equipe é nova, crie um novo registro
                this.logger.log(`Novo participante: ${equipe.id}`);
                await prismaTx.pdmPerfil.create({
                    data: {
                        relacionamento: 'PDM',
                        pdm_id,
                        tipo,
                        criado_por: user.id,
                        criado_em: now,
                        orgao_id: equipe.orgao_id,
                        equipe_id: equipe.id,
                        removido_em: null,
                        removido_por: null,
                    },
                });
            } else {
                this.logger.log(`Equipe mantida sem alterações: ${equipe.id}`);
            }
        }

        // Depois te todos os updates, pega todas as pessoas afetadas
        const pessoasAfetadas = new Set<number>();
        for (const equipe_id of [...keptRecord, ...data.equipes]) {
            const membros = await prismaTx.grupoResponsavelEquipeParticipante.findMany({
                where: {
                    grupo_responsavel_equipe_id: equipe_id,
                    removido_em: null,
                },
                select: { pessoa_id: true },
            });
            for (const r of membros) {
                pessoasAfetadas.add(r.pessoa_id);
            }
        }

        const promessas: Promise<void>[] = [];
        for (const pessoaId of pessoasAfetadas) {
            promessas.push(this.equipeRespService.recalculaPessoaPdmTipos(pessoaId, prismaTx));
        }
        await Promise.all(promessas);

        return cpItens;
    }

    private async desativaPdm(prismaTx: Prisma.TransactionClient, id: number, now: Date, user: PessoaFromJwt) {
        await prismaTx.pdm.update({
            where: { id: id },
            data: {
                ativo: false,
                desativado_em: now,
                desativado_por: user.id,
            },
            select: { id: true },
        });

        // notifica o cicloFisico
        await prismaTx.cicloFisico.updateMany({
            where: {
                pdm_id: id,
                ativo: true,
            },
            data: {
                acordar_ciclo_em: now,
            },
        });
    }

    private async desativaPdmAtivo(prismaTx: Prisma.TransactionClient, now: Date, user: PessoaFromJwt) {
        const pdmAtivoExistente = await prismaTx.pdm.findFirst({ where: { ativo: true, tipo: 'PDM' } });
        if (!pdmAtivoExistente) return;

        await prismaTx.cicloFisico.updateMany({
            where: {
                pdm_id: pdmAtivoExistente.id,
                ativo: true,
            },
            data: {
                acordar_ciclo_em: now,
            },
        });

        await prismaTx.pdm.update({
            where: {
                id: pdmAtivoExistente.id,
            },
            data: {
                ativo: false,
                desativado_em: now,
                desativado_por: user.id,
            },
        });
    }

    async append_document(tipo: TipoPdmType, pdm_id: number, dto: CreatePdmDocumentDto, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id, tipo: PdmModoParaTipo(tipo) } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivoId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const r = await this.prisma.pdmDocumento.create({
                    data: {
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                        arquivo_id: arquivoId,
                        descricao: dto.descricao,
                        pdm_id: pdm_id,
                    },
                    select: {
                        id: true,
                    },
                });

                // tem que rodar depois, pois se não, ainda não tem o vinculo com o projeto
                if (dto.diretorio_caminho)
                    await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token, prismaTx);

                return r;
            }
        );

        return { id: documento.id };
    }

    async list_document(tipo: TipoPdmType, pdm_id: number, user: PessoaFromJwt): Promise<PdmItemDocumentDto[]> {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id, tipo: PdmModoParaTipo(tipo) } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const documentosDB = await this.prisma.pdmDocumento.findMany({
            where: { pdm_id: pdm_id, removido_em: null },
            select: {
                id: true,
                descricao: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        const documentosRet: PdmItemDocumentDto[] = documentosDB.map((d) => {
            return {
                id: d.id,
                descricao: d.descricao,
                arquivo: {
                    id: d.arquivo.id,
                    tamanho_bytes: d.arquivo.tamanho_bytes,
                    descricao: null,
                    nome_original: d.arquivo.nome_original,
                    diretorio_caminho: d.arquivo.diretorio_caminho,
                    download_token: this.uploadService.getDownloadToken(d.arquivo.id, '1d').download_token,
                } satisfies ArquivoBaseDto,
            } satisfies PdmItemDocumentDto;
        });

        return documentosRet;
    }
    async updateDocumento(
        tipo: TipoPdmType,
        pdm_id: number,
        documentoId: number,
        dto: UpdatePdmDocumentDto,
        user: PessoaFromJwt
    ) {
        this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                return await prismaTx.pdmDocumento.update({
                    where: {
                        id: documentoId,
                        pdm: { tipo: PdmModoParaTipo(tipo), id: pdm_id },
                        pdm_id: pdm_id,
                    },
                    data: {
                        descricao: dto.descricao,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });
            }
        );

        return { id: documento.id };
    }

    async remove_document(tipo: TipoPdmType, pdm_id: number, pdmDocId: number, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id, tipo: PdmModoParaTipo(tipo) } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        await this.prisma.pdmDocumento.updateMany({
            where: { pdm_id: pdm_id, removido_em: null, id: pdmDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async getOrcamentoConfig(
        tipo: TipoPdmType,
        pdm_id: number,
        deleteExtraYears = false,
        prismaCtx?: Prisma.TransactionClient
    ): Promise<OrcamentoConfig[] | null> {
        this.logger.log(`getOrcamentoConfig(${tipo}, ${pdm_id}) with prismaCtx=${!!prismaCtx}`);
        const prismaTx = prismaCtx || this.prisma;
        const pdm = await prismaTx.pdm.findFirstOrThrow({
            where: { id: pdm_id, tipo: PdmModoParaTipo(tipo) },
            select: {
                data_inicio: true,
                data_fim: true,
                monitoramento_orcamento: true,
            },
        });
        if (!pdm.monitoramento_orcamento) return null;

        const defaultConfig: Record<
            TipoPdm,
            {
                previsao_custo_disponivel: boolean;
                planejado_disponivel: boolean;
                execucao_disponivel: boolean;
                execucao_disponivel_meses: number[];
            }
        > = {
            PDM: {
                previsao_custo_disponivel: true,
                planejado_disponivel: false,
                execucao_disponivel: false,
                execucao_disponivel_meses: [3, 6, 9, 12],
            },
            PS: {
                previsao_custo_disponivel: true,
                planejado_disponivel: true,
                execucao_disponivel: true,
                execucao_disponivel_meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            },
        };

        const pdmConfig = defaultConfig[PdmModoParaTipo(tipo)];

        const rows: {
            ano_referencia: number;
            id: number;
            pdm_id: number;
            previsao_custo_disponivel: boolean;
            planejado_disponivel: boolean;
            execucao_disponivel: boolean;
            execucao_disponivel_meses: number[];
        }[] = await prismaTx.$queryRaw`
            select
                extract('year' from x.x)::int as ano_referencia,
                ${pdm_id}::int as pdm_id,
                coalesce(previsao_custo_disponivel, ${pdmConfig.previsao_custo_disponivel}::boolean) as previsao_custo_disponivel,
                coalesce(planejado_disponivel, ${pdmConfig.planejado_disponivel}::boolean) as planejado_disponivel,
                coalesce(execucao_disponivel, ${pdmConfig.execucao_disponivel}::boolean) as execucao_disponivel,
                coalesce(execucao_disponivel_meses, ${pdmConfig.execucao_disponivel_meses}::int[]) as execucao_disponivel_meses,
                oc.id as id
            FROM generate_series(${Date2YMD.toStringOrNull(pdm.data_inicio)}::date, ${Date2YMD.toStringOrNull(pdm.data_fim)}::date, '1 year'::interval) x
            LEFT JOIN meta_orcamento_config oc ON oc.pdm_id = ${pdm_id}::int AND oc.ano_referencia = extract('year' from x.x)
        `;

        const anoVistos: number[] = [];
        for (const r of rows) {
            anoVistos.push(r.ano_referencia);
            if (r.id !== null) continue;

            const performUpdate = async (prismaTx: Prisma.TransactionClient): Promise<number> => {
                await prismaTx.pdmOrcamentoConfig.deleteMany({
                    where: {
                        ano_referencia: r.ano_referencia,
                        pdm_id: pdm_id,
                    },
                });

                const created = await prismaTx.pdmOrcamentoConfig.create({
                    data: {
                        ano_referencia: r.ano_referencia,
                        pdm_id: pdm_id,
                        execucao_disponivel: pdmConfig.execucao_disponivel,
                        execucao_disponivel_meses: pdmConfig.execucao_disponivel_meses,
                        planejado_disponivel: pdmConfig.planejado_disponivel,
                        previsao_custo_disponivel: pdmConfig.previsao_custo_disponivel,
                    },
                    select: { id: true },
                });
                return created.id;
            };

            let created_orcamento_config_id: number;
            if (prismaCtx) {
                created_orcamento_config_id = await performUpdate(prismaCtx);
            } else {
                await this.prisma.$transaction(
                    async (prismaTx: Prisma.TransactionClient) => {
                        created_orcamento_config_id = await performUpdate(prismaTx);
                    },
                    { isolationLevel: 'Serializable' }
                );
            }

            const row_without_id_idx = rows.findIndex((rwi) => rwi.ano_referencia === r.ano_referencia);
            rows[row_without_id_idx].id = created_orcamento_config_id!;
        }

        if (deleteExtraYears)
            // just in case, apagar anos que estão fora do periodo
            await prismaTx.pdmOrcamentoConfig.deleteMany({
                where: {
                    ano_referencia: { notIn: anoVistos },
                    pdm_id: pdm_id,
                },
            });

        return rows;
    }

    async updatePdmOrcamentoConfig(
        tipo: TipoPdmType,
        pdm_id: number,
        updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto,
        user: PessoaFromJwt
    ) {
        const pdm = await this.loadPdm(tipo, pdm_id, user, 'ReadWrite');

        return await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            const operations = [];

            for (const orcamentoConfig of Object.values(updatePdmOrcamentoConfigDto.orcamento_config)) {
                const pdmOrcamentoConfig = await prisma.pdmOrcamentoConfig.findFirst({
                    where: {
                        pdm_id: pdm.id,
                        id: orcamentoConfig.id,
                    },
                });
                if (!pdmOrcamentoConfig) continue;

                operations.push(
                    prisma.pdmOrcamentoConfig.update({
                        where: { id: pdmOrcamentoConfig.id },
                        data: {
                            previsao_custo_disponivel: orcamentoConfig.previsao_custo_disponivel,
                            planejado_disponivel: orcamentoConfig.planejado_disponivel,
                            execucao_disponivel: orcamentoConfig.execucao_disponivel,
                            execucao_disponivel_meses: orcamentoConfig.execucao_disponivel_meses,
                        },
                        select: { id: true },
                    })
                );
            }

            return await Promise.all(operations);
        });
    }

    private verificaRotulos(dto: CreatePdmDto | UpdatePdmDto) {
        const rotulosA = [dto.rotulo_macro_tema, dto.rotulo_tema, dto.rotulo_sub_tema].filter(
            (r) => r !== null && r !== undefined
        );
        const uniqueRotulosA = new Set(rotulosA);
        if (rotulosA.length !== uniqueRotulosA.size) {
            throw new BadRequestException('Os rótulos para macrotema, tema e subtema devem ser únicos');
        }

        const rotulosB = [dto.rotulo_contexto_meta, dto.rotulo_complementacao_meta].filter(
            (r) => r !== null && r !== undefined
        );
        const uniqueRotulosB = new Set(rotulosB);
        if (rotulosB.length !== uniqueRotulosB.size) {
            throw new BadRequestException('Os rótulos para contexto e complementação de meta devem ser únicos');
        }

        const rotulosC = [dto.rotulo_iniciativa, dto.rotulo_atividade].filter((r) => r !== null && r !== undefined);
        const uniqueRotulosC = new Set(rotulosC);
        if (rotulosC.length !== uniqueRotulosC.size) {
            throw new BadRequestException('Os rótulos para iniciativa e atividade devem ser únicos');
        }
    }
}
