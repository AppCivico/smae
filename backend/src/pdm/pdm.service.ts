import { BadRequestException, ForbiddenException, HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CicloFisicoFase, PdmPerfilTipo, Prisma, TipoPdm } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { DateTime } from 'luxon';
import { VariavelService } from 'src/variavel/variavel.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { ReadOnlyBooleanType } from '../common/TypeReadOnly';
import { Date2YMD, DateYMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { JOB_PDM_CICLO_LOCK } from '../common/dto/locks';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreatePdmDocumentDto } from './dto/create-pdm-document.dto';
import { CreatePdmAdminCPDto, CreatePdmDto, CreatePdmTecnicoCPDto } from './dto/create-pdm.dto';
import { FilterPdmDto } from './dto/filter-pdm.dto';
import { CicloFisicoDto, OrcamentoConfig } from './dto/list-pdm.dto';
import { Pdm } from './dto/pdm.dto';
import { UpdatePdmOrcamentoConfigDto } from './dto/update-pdm-orcamento-config.dto';
import { UpdatePdmDto } from './dto/update-pdm.dto';
import { ListPdm } from './entities/list-pdm.entity';
import { PdmDocument } from './entities/pdm-document.entity';

type CicloFisicoResumo = {
    id: number;
    pdm_id: number;
    data_ciclo: Date;
    ciclo_fase_atual_id: number | null;
    CicloFaseAtual: CicloFisicoFase | null;
};

class AdminCpDbItem {
    orgao_id: number;
    pessoa_id: number;
}

@Injectable()
export class PdmService {
    private readonly logger = new Logger(PdmService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService,
        private readonly variavelService: VariavelService
    ) {}

    async create(createPdmDto: CreatePdmDto, user: PessoaFromJwt) {
        const tipo = createPdmDto.tipo !== undefined ? createPdmDto.tipo : 'PDM';
        if (tipo == 'PDM') {
            if (!user.hasSomeRoles(['CadastroPdm.inserir'])) {
                throw new ForbiddenException('Você não tem permissão para inserir Plano de Metas');
            }
        } else if (tipo == 'PS') {
            if (!user.hasSomeRoles(['CadastroPS.administrador', 'CadastroPS.administrador_no_orgao'])) {
                throw new ForbiddenException('Você não tem permissão para inserir Plano Setorial');
            }
        }

        const similarExists = await this.prisma.pdm.count({
            where: {
                tipo: tipo,
                descricao: { equals: createPdmDto.nome, mode: 'insensitive' },
            },
        });
        if (similarExists > 0)
            throw new HttpException('descricao| Descrição igual ou semelhante já existe em outro registro ativo', 400);

        let arquivo_logo_id: undefined | number;
        if (createPdmDto.upload_logo) {
            arquivo_logo_id = this.uploadService.checkUploadOrDownloadToken(createPdmDto.upload_logo);
        }

        delete createPdmDto.upload_logo;

        if (createPdmDto.possui_atividade && !createPdmDto.possui_iniciativa)
            throw new HttpException('possui_atividade| possui_iniciativa precisa ser True para ativar Atividades', 400);

        const created = await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
            let ps_admin_cp: CreatePdmAdminCPDto | undefined = undefined;
            let ps_tecnico_cp: CreatePdmTecnicoCPDto | undefined = undefined;
            if (createPdmDto.ps_admin_cp) ps_admin_cp = createPdmDto.ps_admin_cp;
            if (createPdmDto.ps_tecnico_cp) ps_tecnico_cp = createPdmDto.ps_tecnico_cp;
            delete createPdmDto.ps_admin_cp;
            delete createPdmDto.ps_tecnico_cp;

            const pdm = await prisma.pdm.create({
                data: {
                    criado_por: user.id,
                    criado_em: new Date(Date.now()),
                    arquivo_logo_id: arquivo_logo_id,
                    ...(createPdmDto as any),
                },
                select: { id: true },
            });

            if (ps_admin_cp || ps_tecnico_cp) {
                this.logger.log(`criando ps_admin_cp e ps_tecnico_cp`);
                await this.update(pdm.id, { ps_admin_cp, ps_tecnico_cp }, user);
            }

            if (createPdmDto.tipo == 'PDM') {
                this.logger.log(`Chamando monta_ciclos_pdm...`);
                await prisma.$queryRaw`select monta_ciclos_pdm(${pdm.id}::int, false)`;
            }

            return pdm;
        });

        return created;
    }

    private async getPermissionSet(user: PessoaFromJwt) {
        const permissionsSet: Prisma.Enumerable<Prisma.PdmWhereInput> = [];

        const tipoList: Prisma.Enumerable<Prisma.PdmWhereInput> = [];

        if (user.hasSomeRoles(['PS.ponto_focal', 'PS.admin_cp', 'PS.tecnico_cp', 'CadastroPS.administrador'])) {
            tipoList.push({
                tipo: 'PS',
            });
        }
        if (user.hasSomeRoles(['CadastroPS.administrador_no_orgao'])) {
            // TODO validar se vai ser assim mesmo
            tipoList.push({
                tipo: 'PS',
                PdmPerfil: {
                    some: {
                        removido_em: null,
                        tipo: 'ADMIN',
                        pessoa_id: user.id,
                        orgao_id: user.orgao_id,
                    },
                },
            });
        }

        // talvez tenha que liberar pra mais pessoas, mas na teoria seria isso
        // mas tem GET no /pdm o tempo inteiro no frontend, então talvez precise liberar pra mais perfis
        if (
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
            tipoList.push({
                tipo: 'PDM',
            });
        }

        console.log(tipoList);
        permissionsSet.push({
            OR: tipoList,
        });

        return permissionsSet;
    }

    async findAll(tipo: TipoPdm, filters: FilterPdmDto, user: PessoaFromJwt): Promise<ListPdm[]> {
        const active = filters.ativo;

        const listActive = await this.prisma.pdm.findMany({
            where: {
                ativo: active,
                tipo: tipo,
                AND: await this.getPermissionSet(user),
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
            },
            orderBy: [{ ativo: 'desc' }, { data_inicio: 'desc' }, { data_fim: 'desc' }],
        });

        const listActiveTmp = listActive.map((pdm) => {
            let logo = null;
            if (pdm.arquivo_logo_id) {
                logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token;
            }

            return {
                ...pdm,
                pode_editar: this.calcPodeEditar(pdm, user),
                arquivo_logo_id: undefined,
                logo: logo,
                data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
                data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
                data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
                periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
                periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(
                    pdm.periodo_do_ciclo_participativo_inicio
                ),
            };
        });

        return listActiveTmp;
    }

    calcPodeEditar(pdm: { tipo: TipoPdm; ps_admin_cps: Prisma.JsonValue | null }, user: PessoaFromJwt): boolean {
        if (pdm.tipo == 'PS') {
            let podeEditar = user.hasSomeRoles(['CadastroPS.administrador']);

            if (!podeEditar) {
                const dbValue = pdm.ps_admin_cps?.valueOf();

                if (
                    user.orgao_id &&
                    Array.isArray(dbValue) &&
                    user.hasSomeRoles(['CadastroPS.administrador_no_orgao'])
                ) {
                    const parsed = plainToInstance(AdminCpDbItem, dbValue);

                    // está em algum item
                    podeEditar = parsed.some((item) => +item.pessoa_id == +user.id);

                    // e todos os itens são do mesmo órgão
                    podeEditar = podeEditar && parsed.every((item) => +item.orgao_id == +user.orgao_id!);
                }

                podeEditar = false;
            }

            return podeEditar;
        } else if (pdm.tipo == 'PDM') {
            return user.hasSomeRoles(['CadastroPdm.editar']);
        }
        return false;
    }

    async getDetail(id: number, user: PessoaFromJwt, readonly: ReadOnlyBooleanType): Promise<Pdm> {
        const pdm = await this.loadPdm(id, user, readonly);

        if (pdm.arquivo_logo_id) {
            pdm.logo = this.uploadService.getDownloadToken(pdm.arquivo_logo_id, '30d').download_token;
        }

        return {
            ...pdm,
            pode_editar: this.calcPodeEditar(pdm, user),
            data_fim: Date2YMD.toStringOrNull(pdm.data_fim),
            data_inicio: Date2YMD.toStringOrNull(pdm.data_inicio),
            data_publicacao: Date2YMD.toStringOrNull(pdm.data_publicacao),
            periodo_do_ciclo_participativo_fim: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_fim),
            periodo_do_ciclo_participativo_inicio: Date2YMD.toStringOrNull(pdm.periodo_do_ciclo_participativo_inicio),
        };
    }

    private async loadPdm(id: number, user: PessoaFromJwt, readonly: ReadOnlyBooleanType) {
        const pdm = await this.prisma.pdm.findFirst({
            where: {
                id: id,
                removido_em: null,
            },
        });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const pode_editar = this.calcPodeEditar(pdm, user);
        if (!pode_editar && readonly == 'ReadWrite') {
            throw new ForbiddenException(
                `Você não tem permissão para editar este ${pdm.tipo == 'PDM' ? 'Plano de Metas' : 'Plano Setorial'}`
            );
        }

        return pdm;
    }

    private async verificarPrivilegiosEdicao(
        updatePdmDto: UpdatePdmDto,
        user: PessoaFromJwt,
        pdm: { ativo: boolean; tipo: TipoPdm; ps_admin_cps: Prisma.JsonValue | null }
    ) {
        if (
            pdm.tipo == 'PDM' &&
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === true &&
            user.hasSomeRoles(['CadastroPdm.ativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode ativar Plano de Metas`);
        } else if (
            pdm.tipo == 'PDM' &&
            updatePdmDto.ativo !== pdm.ativo &&
            updatePdmDto.ativo === false &&
            user.hasSomeRoles(['CadastroPdm.inativar']) === false
        ) {
            throw new ForbiddenException(`Você não pode inativar Plano de Metas`);
        }

        this.calcPodeEditar(pdm, user);

        // TODO: plano setorial verificar se é admin no órgão, se só tiver pessoas do órgão dele, pode desativar/ativar
    }

    async update(id: number, dto: UpdatePdmDto, user: PessoaFromJwt) {
        const pdm = await this.loadPdm(id, user, 'ReadWrite');
        await this.verificarPrivilegiosEdicao(dto, user, pdm);

        if (dto.nome) {
            const similarExists = await this.prisma.pdm.count({
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
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
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
                if (ativarPdm == false)
                    await prismaTx.pdm.update({
                        where: { id: id },
                        data: {
                            desativado_por: user.id,
                            desativado_em: now,
                        },
                    });
            }

            const ps_admin_cp = dto.ps_admin_cp;
            delete dto.ps_admin_cp;
            const ps_tecnico_cp = dto.ps_tecnico_cp;
            delete dto.ps_tecnico_cp;

            console.log(ps_admin_cp)

            await prismaTx.pdm.update({
                where: { id: id },
                data: {
                    atualizado_por: user.id,
                    atualizado_em: now,
                    ...dto,
                    ativo: ativarPdm,
                    arquivo_logo_id: arquivo_logo_id,
                },
                select: { id: true },
            });

            if (ps_admin_cp) await this.upsertPerfil(id, 'ADMIN', user, prismaTx, now, ps_admin_cp);
            if (ps_tecnico_cp) await this.upsertPerfil(id, 'CP', user, prismaTx, now, ps_tecnico_cp);

            if (verificarCiclos) {
                this.logger.log(`chamando monta_ciclos_pdm...`);
                this.logger.log(JSON.stringify(await prismaTx.$queryRaw`select monta_ciclos_pdm(${id}::int, false)`));
            }
        });

        if (verificarCiclos) await this.executaJobCicloFisico(ativarPdm, id, now);

        // força o carregamento da tabela pdmOrcamentoConfig
        await this.getOrcamentoConfig(id, true);

        return { id: id };
    }

    private async upsertPerfil(
        pdm_id: number,
        tipo: PdmPerfilTipo,
        user: PessoaFromJwt,
        prismaTx: Prisma.TransactionClient,
        now: Date,
        data: {
            participantes: number[];
        }
    ) {
        const prevVersion = await prismaTx.pdmPerfil.findMany({
            where: { pdm_id, removido_em: null },
            select: { pessoa_id: true },
        });

        const pComPriv: { pessoa_id: number; orgao_id: number }[] = await (
            this.prisma[tipo == 'ADMIN' ? 'view_pessoa_ps_admin_cp' : 'view_pessoa_ps_tecnico_cp'] as any
        ).findMany({
            where: {
                pessoa_id: { in: data.participantes },
            },
        });

        console.log('pComPriv' , pComPriv);

        const keptRecord: number[] = prevVersion.map((r) => r.pessoa_id);

        for (const pessoaId of keptRecord) {
            if (!data.participantes.includes(pessoaId)) {
                // O participante estava presente na versão anterior, mas não na nova versão
                this.logger.log(`participante removido: ${pessoaId}`);
                await prismaTx.pdmPerfil.updateMany({
                    where: {
                        pessoa_id: pessoaId,
                        pdm_id,
                        tipo: tipo,
                        removido_em: null,
                    },
                    data: { removido_em: now },
                });
            }
        }

        const cpItens: AdminCpDbItem[] = [];
        for (const pessoaId of data.participantes) {
            const pessoa = pComPriv.filter((r) => r.pessoa_id == pessoaId)[0];
            if (!pessoa)
                throw new BadRequestException(
                    `Pessoa ID ${pessoaId} não pode ser ${tipo == 'ADMIN' ? 'administrador' : 'coordenador'}. Necessário ter o privilégio.`
                );
            cpItens.push({
                orgao_id: pessoa.orgao_id,
                pessoa_id: pessoa.pessoa_id,
            });

            if (!keptRecord.includes(pessoaId)) {
                // O participante é novo, crie um novo registro
                this.logger.log(`Novo participante: ${pessoa.pessoa_id}`);
                await prismaTx.pdmPerfil.create({
                    data: {
                        pdm_id,
                        tipo,
                        criado_por: user.id,
                        criado_em: now,
                        orgao_id: pessoa.orgao_id,
                        pessoa_id: pessoa.pessoa_id,
                    },
                });
            } else {
                this.logger.log(`participante mantido sem alterações: ${pessoaId}`);
            }
        }
        if (tipo == 'ADMIN')
            await prismaTx.pdm.update({
                where: { id: pdm_id },
                data: {
                    ps_admin_cps: cpItens as any,
                },
            });
    }

    private async executaJobCicloFisico(ativo: boolean | undefined, pdmId: number, now: Date) {
        // se esse pdm é pra estar ativado,
        // verificar se há algum item com acordar_ciclo_em, se não existir,
        // precisa encontrar qual é o mes corrente que deve acordar
        // ps: na hora de buscar o mes corrente, vamos usar a data final das fase, no lugar da data do ciclo
        if (ativo) {
            const updatedRows = await this.prisma.$executeRaw`
                update ciclo_fisico
                set
                    acordar_ciclo_em = now(),
                    acordar_ciclo_executou_em = null -- garante que será executado imediatamente após o save
                where id = (
                    select a.ciclo_fisico_id
                    from ciclo_fisico_fase a
                    join ciclo_fisico b on b.id=a.ciclo_fisico_id
                    where b.pdm_id = ${pdmId}::int
                    and data_fim <= date_trunc('day', now() at time zone ${SYSTEM_TIMEZONE}::varchar)
                    order by data_fim desc
                    limit 1
                )
                and (select count(1) from ciclo_fisico where acordar_ciclo_em is not null and pdm_id = ${pdmId}::int) = 0;`;
            this.logger.log(`atualizacao de acordar_ciclos atualizou ${updatedRows} linha`);
        }

        // imediatamente, roda quantas vezes for necessário as evoluções de ciclo
        while (1) {
            const keepGoing = await this.verificaCiclosPendentes(Date2YMD.toString(now));
            if (!keepGoing) break;
        }
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

    async append_document(pdm_id: number, createPdmDocDto: CreatePdmDocumentDto, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivoId = this.uploadService.checkUploadOrDownloadToken(createPdmDocDto.upload_token);

        const arquivo = await this.prisma.arquivoDocumento.create({
            data: {
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                arquivo_id: arquivoId,
                pdm_id: pdm_id,
            },
            select: {
                id: true,
            },
        });

        return { id: arquivo.id };
    }

    async list_document(pdm_id: number, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        const arquivos: PdmDocument[] = await this.prisma.arquivoDocumento.findMany({
            where: { pdm_id: pdm_id, removido_em: null },
            select: {
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true,
                    },
                },
            },
        });
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos;
    }

    async remove_document(pdm_id: number, pdmDocId: number, user: PessoaFromJwt) {
        const pdm = await this.prisma.pdm.count({ where: { id: pdm_id } });
        if (!pdm) throw new HttpException('PDM não encontrado', 404);

        await this.prisma.arquivoDocumento.updateMany({
            where: { pdm_id: pdm_id, removido_em: null, id: pdmDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    @Cron('0 * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_PDM_CRONTAB'])) return;

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação dos ciclos`);
                const locked: {
                    locked: boolean;
                    now_ymd: DateYMD;
                }[] = await prismaTx.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_PDM_CICLO_LOCK}) as locked,
                (now() at time zone ${SYSTEM_TIMEZONE}::varchar)::date::text as now_ymd
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                // não passa a TX, ou seja, ele que seja responsável por sua própria $transaction
                while (1) {
                    const keepGoing = await this.verificaCiclosPendentes(locked[0].now_ymd);
                    if (!keepGoing) break;
                }

                // TODO isso aqui não volta um ARRAY de number não, volta um {"variaveis": []}
                const varsSuspensas = await this.variavelService.processVariaveisSuspensas(prismaTx);

                if (varsSuspensas.length) {
                    await this.variavelService.recalc_variaveis_acumulada(varsSuspensas, prismaTx);
                    await this.variavelService.recalc_indicador_usando_variaveis(varsSuspensas, prismaTx);
                }

                this.logger.debug(`Atualizando metas consolidadas`);
                await prismaTx.$queryRaw`
                    SELECT f_add_refresh_meta_task(meta_id)::text
                    FROM meta_status_consolidado_cf cf
                    WHERE (atualizado_em at time zone ${SYSTEM_TIMEZONE})::date != current_date at time zone ${SYSTEM_TIMEZONE}
                `;
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    private async verificaCiclosPendentes(hoje: DateYMD) {
        console.log(hoje);
        this.logger.debug(`Verificando ciclos físicos com tick faltando...`);

        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                acordar_ciclo_em: {
                    lt: new Date(Date.now()),
                },
                OR: [
                    { acordar_ciclo_errmsg: null },
                    {
                        // retry a cada 15 minutos, mesmo que tenha erro
                        acordar_ciclo_executou_em: {
                            lt: DateTime.now().minus({ minutes: 15 }).toJSDate(),
                        },
                        acordar_ciclo_errmsg: { not: null },
                    },
                ],
                // evitar loops infinitos, verificar que tem pelo menos 1 min desde a ultima execução
                AND: [
                    {
                        OR: [
                            { acordar_ciclo_executou_em: null },
                            {
                                acordar_ciclo_executou_em: {
                                    lt: DateTime.now().minus({ minutes: 1 }).toJSDate(),
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                pdm_id: true,
                id: true,
                data_ciclo: true,
                ativo: true,
                ciclo_fase_atual_id: true,
                acordar_ciclo_errmsg: true,
                pdm: {
                    select: { ativo: true },
                },
                CicloFaseAtual: true,
            },
            orderBy: {
                data_ciclo: 'asc',
            },
            take: 1,
        });
        if (!cf) {
            this.logger.log('Não há Ciclo Físico com processamento pendente');
            return false;
        }

        this.logger.log(`Executando ciclo ${JSON.stringify(cf)} hoje=${hoje} (data hora pelo banco)`);

        try {
            if (cf.acordar_ciclo_errmsg) {
                this.logger.warn(
                    `Mensagem de erro anterior: ${cf.acordar_ciclo_errmsg}, limpando mensagem e tentando novamente...`
                );
                await this.prisma.cicloFisico.update({
                    where: { id: cf.id },
                    data: { acordar_ciclo_errmsg: null },
                });
            }

            if (cf.pdm.ativo) {
                await this.verificaFases(cf);
            } else {
                this.logger.warn('PDM foi desativado, não há mais ciclos até a proxima ativação');

                await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                    await prismaTxn.cicloFisico.update({
                        where: {
                            id: cf.id,
                        },
                        data: {
                            acordar_ciclo_em: null,
                            acordar_ciclo_executou_em: new Date(Date.now()),
                            ciclo_fase_atual_id: null,
                            ativo: false,
                        },
                    });
                });
            }
        } catch (error) {
            this.logger.error(error);
            await this.prisma.cicloFisico.update({
                where: {
                    id: cf.id,
                },
                data: {
                    acordar_ciclo_errmsg: `${error}`,
                    acordar_ciclo_executou_em: new Date(Date.now()),
                },
            });
        }

        return true;
    }

    private async verificaFases(cf: CicloFisicoResumo) {
        const hojeEmSp = DateTime.local({ zone: SYSTEM_TIMEZONE }).toJSDate();
        this.logger.log(`Verificando ciclo atual ${cf.data_ciclo} - Hoje em SP = ${Date2YMD.toString(hojeEmSp)}`);

        if (cf.CicloFaseAtual) {
            this.logger.log(
                'No banco, fase atual é ' +
                    cf.CicloFaseAtual.id +
                    ` com inicio em ${Date2YMD.toString(cf.CicloFaseAtual.data_inicio)} e fim ${Date2YMD.toString(
                        cf.CicloFaseAtual.data_fim
                    )}`
            );
        } else {
            this.logger.log(`Não há nenhuma fase atualmente associada com o Ciclo Fisico`);
            this.logger.debug(
                'ciclo_fase_atual_id está null, provavelmente o ciclo não deveria ter sido executado ainda,' +
                    ' ou o PDM acabou de ser re-ativado, ou é a primeira vez do ciclo'
            );
        }

        const fase_corrente = await this.prisma.cicloFisicoFase.findFirst({
            where: {
                ciclo_fisico: { pdm_id: cf.pdm_id },
                data_inicio: { lte: hojeEmSp },
                data_fim: { gte: hojeEmSp }, // termina dentro da data corrente
            },
            orderBy: { data_inicio: 'desc' },
            take: 1,
        });

        if (!fase_corrente) {
            await this.desativaCicloParaSempre({ id: cf.id, pdm_id: cf.pdm_id });
            return;
        }

        this.logger.log(`Fase corrente: ${JSON.stringify(fase_corrente)}`);
        if (cf.ciclo_fase_atual_id === null || cf.ciclo_fase_atual_id !== fase_corrente.id) {
            await this.cicloFisicoAtualizaFase(cf, fase_corrente);
        } else {
            // aqui não precisa de transaction pois ele tenta primeiro atualizar a função
            // e se falhar, vai rolar o retry
            this.logger.log(`Recalculando permissões de acesso ao PDM (nova meta?)`);
            await this.prisma.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, ${cf.id}::int)`;

            await this.prisma.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(fase_corrente.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ativo: true,
                },
            });
        }
    }

    private async cicloFisicoAtualizaFase(cf: CicloFisicoResumo, fase_corrente: CicloFisicoFase) {
        const pdm_id = cf.pdm_id;
        let ciclo_fisico_id = fase_corrente.ciclo_fisico_id;

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            if (cf.ciclo_fase_atual_id === null)
                this.logger.log(`Iniciando ciclo id=${cf.id}, data ${cf.data_ciclo}) pela primeira vez!`);

            // se mudou de ciclo_fisico, precisa fechar e re-abrir
            if (fase_corrente.ciclo_fisico_id !== cf.id) {
                this.logger.log(`Desativando o ciclo id=${cf.id}, data ${cf.data_ciclo})...`);
                // aqui entraria um código pra fazer o fechamento,
                // se precisar disparar algum email ou algo do tipo
                await prismaTxn.cicloFisico.update({
                    where: { id: cf.id },
                    data: {
                        acordar_ciclo_em: null,
                        acordar_ciclo_executou_em: new Date(Date.now()),
                        ativo: false,
                    },
                });

                ciclo_fisico_id = fase_corrente.ciclo_fisico_id;
            }

            this.logger.log(
                `Trocando fase do ciclo de ${cf.ciclo_fase_atual_id ?? 'null'} para ${fase_corrente.id} (${
                    fase_corrente.ciclo_fase
                })`
            );

            await prismaTxn.cicloFisico.update({
                where: { id: ciclo_fisico_id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(fase_corrente.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ciclo_fase_atual_id: fase_corrente.id,
                    ativo: true,
                },
            });

            this.logger.log(`chamando atualiza_fase_meta_pdm(${pdm_id}, ${ciclo_fisico_id})`);
            await prismaTxn.$queryRaw`select atualiza_fase_meta_pdm(${pdm_id}::int, ${ciclo_fisico_id}::int)`;
        });
    }

    private async desativaCicloParaSempre(cf: { id: number; pdm_id: number }) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            this.logger.log(`Não há próximos ciclos!`);
            // aqui entraria um código pra fazer o ultimo fechamento, se precisar disparar algum email ou algo do tipo

            await prismaTxn.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: null,
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ciclo_fase_atual_id: null,
                    ativo: false,
                },
            });

            this.logger.log(`Recalculando atualiza_fase_meta_pdm(${cf.pdm_id}, NULL) para desativar as metas`);
            await prismaTxn.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, NULL)`;
        });
    }

    async getCicloAtivo(pdm_id: number): Promise<CicloFisicoDto | null> {
        let ciclo: CicloFisicoDto | null = null;
        const found = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdm_id, ativo: true },
            include: {
                fases: {
                    orderBy: { data_inicio: 'asc' },
                },
            },
        });
        if (found) {
            ciclo = {
                id: found.id,
                data_ciclo: Date2YMD.toString(found.data_ciclo),
                fases: [],
                ativo: found.ativo,
            };
            for (const fase of found.fases) {
                ciclo.fases.push({
                    id: fase.id,
                    ciclo_fase: fase.ciclo_fase,
                    data_inicio: Date2YMD.toString(fase.data_inicio),
                    data_fim: Date2YMD.toString(fase.data_fim),
                    fase_corrente: found.ciclo_fase_atual_id == fase.id,
                });
            }
        }

        return ciclo;
    }

    async getOrcamentoConfig(pdm_id: number, deleteExtraYears = false): Promise<OrcamentoConfig[] | null> {
        const pdm = await this.prisma.pdm.findFirstOrThrow({
            where: { id: pdm_id },
            select: {
                data_inicio: true,
                data_fim: true,
            },
        });

        const rows: {
            ano_referencia: number;
            id: number;
            pdm_id: number;
            previsao_custo_disponivel: boolean;
            planejado_disponivel: boolean;
            execucao_disponivel: boolean;
            execucao_disponivel_meses: number[];
        }[] = await this.prisma.$queryRaw`
            select
                extract('year' from x.x)::int as ano_referencia,
                ${pdm_id}::int as pdm_id,
                coalesce(previsao_custo_disponivel, true) as previsao_custo_disponivel,
                coalesce(planejado_disponivel, false) as planejado_disponivel,
                coalesce(execucao_disponivel, false) as execucao_disponivel,
                coalesce(execucao_disponivel_meses, '{3,6,9,12}'::int[]) as execucao_disponivel_meses,
                oc.id as id
            FROM generate_series(${pdm.data_inicio}, ${pdm.data_fim}, '1 year'::interval) x
            LEFT JOIN meta_orcamento_config oc ON oc.pdm_id = ${pdm_id}::int AND oc.ano_referencia = extract('year' from x.x)
        `;

        const anoVistos: number[] = [];
        for (const r of rows) {
            anoVistos.push(r.ano_referencia);
            if (r.id === null) {
                const created_orcamento_config = await this.prisma.$transaction(
                    async (prismaTx: Prisma.TransactionClient) => {
                        await prismaTx.pdmOrcamentoConfig.deleteMany({
                            where: {
                                ano_referencia: r.ano_referencia,
                                pdm_id: pdm_id,
                            },
                        });

                        return await prismaTx.pdmOrcamentoConfig.create({
                            data: {
                                ano_referencia: r.ano_referencia,
                                pdm_id: pdm_id,
                            },
                            select: { id: true },
                        });
                    },
                    { isolationLevel: 'Serializable' }
                );

                const row_without_id_idx = rows.findIndex((rwi) => rwi.ano_referencia === r.ano_referencia);
                rows[row_without_id_idx].id = created_orcamento_config.id;
            }
        }

        if (deleteExtraYears)
            // just in case, apagar anos que estão fora do periodo
            await this.prisma.pdmOrcamentoConfig.deleteMany({
                where: {
                    ano_referencia: { notIn: anoVistos },
                    pdm_id: pdm_id,
                },
            });

        return rows;
    }

    async updatePdmOrcamentoConfig(
        pdm_id: number,
        updatePdmOrcamentoConfigDto: UpdatePdmOrcamentoConfigDto,
        user: PessoaFromJwt
    ) {
        const pdm = await this.loadPdm(pdm_id, user, 'ReadWrite');

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
}
