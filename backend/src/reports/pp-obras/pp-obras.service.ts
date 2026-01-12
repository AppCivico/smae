import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
    CategoriaProcessoSei,
    ContratoPrazoUnidade,
    Prisma,
    ProjetoOrigemTipo,
    ProjetoStatus,
    StatusContrato,
    TipoProjeto,
} from '@prisma/client';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { Html2Text } from '../../common/Html2Text';
import { ProjetoGetPermissionSet, ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, Path2FileName, ReportableService } from '../utils/utils.service';
import { CreateRelObrasDto } from './dto/create-obras.dto';
import {
    PPObrasRelatorioDto,
    RelObrasAcompanhamentosDto,
    RelObrasAditivosDto,
    RelObrasContratosDto,
    RelObrasCronogramaDto,
    RelObrasDto,
    RelObrasFontesRecursoDto,
    RelObrasGeolocDto,
    RelObrasOrigemDto,
    RelObrasRegioesDto,
    RelObrasSeiDto,
} from './entities/obras.entity';
import { ReportContext } from '../relatorios/helpers/reports.contexto';

const {
    AsyncParser,
    transforms: { flatten },
} = require('json2csv');

type WhereCond = {
    whereString: string;
    queryParams: any[];
};

const defaultTransform = [flatten({ paths: [] })];

class RetornoDbProjeto {
    id: number;
    portfolio_id: number;
    portfolio_titulo: string;
    meta_id?: number;
    meta_nome?: string;
    pdm_id?: number;
    pdm_nome?: string;
    grupo_tematico_id?: number;
    grupo_tematico_nome?: string;
    tipo_intervencao_id?: number;
    tipo_intervencao_nome?: string;
    tipo_intervencao_conceito?: string;
    equipamento_id?: number;
    equipamento_nome?: string;
    origem_tipo: ProjetoOrigemTipo;
    descricao?: string;
    nome: string;
    codigo?: string;
    detalhamento?: string;
    secretario_colaborador?: string;
    previsao_inicio?: Date;
    previsao_termino?: Date;
    inicio_planejado?: Date;
    termino_planejado?: Date;
    data_inauguracao_planejada?: Date;
    previsao_duracao?: number;
    previsao_custo?: number;
    custo_planejado?: number;
    secretario_responsavel?: string;
    secretario_executivo?: string;
    status: ProjetoStatus;
    subprefeituras: string;
    orgao_responsavel_id: number;
    orgao_responsavel_sigla: string;
    orgao_responsavel_descricao: string;
    orgao_gestor_id: number;
    orgao_gestor_sigla: string;
    orgao_gestor_descricao: string;
    orgao_executor_id: number;
    orgao_executor_sigla: string;
    orgao_executor_descricao: string;
    orgao_origem_id: number;
    orgao_origem_sigla: string;
    orgao_origem_descricao: string;
    orgao_colaborador_sigla: string;
    orgao_colaborador_id: number;
    orgao_colaborador_descricao: string;
    assessores: string;
    pontos_focais_colaboradores: string;
    responsavel_id: number;
    responsavel_nome_exibicao: string;
    mdo_observacoes?: string;

    programa_habitacional?: string;
    n_unidades_habitacionais?: number;
    n_familias_beneficiadas?: number;
    n_unidades_atendidas?: number;

    orgao_id: number;
    orgao_sigla: string;
    orgao_descricao: string;

    projeto_etapa: string | null;

    empreendimento_id?: number;
    empreendimento_identificador?: string;
    etiquetas: string;

    portfolios_compartilhados_titulos: string | null;
}

class RetornoDbCronograma {
    projeto_id: number;
    projeto_codigo: string;
    id: number;
    hierarquia?: string;
    numero: number;
    nivel: number;
    tarefa: string;
    inicio_planejado?: Date;
    termino_planejado?: Date;
    custo_estimado?: number;
    inicio_real?: Date;
    termino_real?: Date;
    duracao_real?: number;
    percentual_concluido?: number;
    custo_real?: number;
    dependencias?: string;

    responsavel_id: number;
    responsavel_nome_exibicao: string;

    atraso?: number;

    backup_custo_estimado?: number;
    backup_custo_real?: number;
    custo_estimado_anualizado?: JSON;
    custo_real_anualizado?: JSON;
}

class RetornoDbRegioes {
    projeto_id: number;
    nivel: number;
    descricao: string;
    sigla: string;
}

class RetornoDbFontesRecurso {
    projeto_id: number;
    fonte_recurso_cod_sof: string;
    fonte_recurso_ano: number;
    valor_percentual?: number;
    valor_nominal?: number;
}

class RetornoDbAditivos {
    aditivo_id: number;
    contrato_id: number;
    numero: number;
    tipo_aditivo_id: number;
    tipo_aditivo_nome: string;
    data: Date | null;
    data_termino_atual: Date | null;
    valor_com_reajuste: number | null;
    percentual_medido: number | null;
}

class RetornoDbContratos {
    id: number;
    obra_id: number;
    numero: string;
    exclusivo: boolean;
    status: StatusContrato;
    objeto: string | null;
    descricao_detalhada: string | null;
    contratante: string | null;
    empresa_contratada: string | null;
    prazo: number | null;
    unidade_prazo: ContratoPrazoUnidade | null;
    data_inicio: Date | null;
    data_termino: Date | null;
    valor: number | null;
    valor_reajustado: number | null;
    observacoes: string | null;
    data_base: string | null;
    modalidade_contratacao_id: number | null;
    modalidade_contratacao_nome: string | null;
    orgao_id: number | null;
    orgao_sigla: string | null;
    orgao_descricao: string | null;
    valor_com_reajuste: number | null;
    data_termino_atualizada: Date | null;
    percentual_medido: number | null;
    processos_sei: string | null;
    fontes_recurso: string | null;
}

class RetornoDbOrigens {
    projeto_id: number;
    pdm_id: number | null;
    pdm_titulo: string | null;
    meta_id: number | null;
    meta_titulo: string | null;
    iniciativa_id: number | null;
    iniciativa_titulo: string | null;
    atividade_id: number | null;
    atividade_titulo: string | null;
}

class RetornoDbAcompanhamentos {
    projeto_id: number;
    projeto_codigo: string;
    data_registro: Date;
    participantes: string;
    cronograma_paralizado: boolean;
    prazo_encaminhamento: Date | null;
    pauta: string | null;
    prazo_realizado: Date | null;
    detalhamento: string | null;
    encaminhamento: string | null;
    responsavel: string | null;
    observacao: string | null;
    detalhamento_status: string | null;
    pontos_atencao: string | null;
    riscos: string | null;
    pauta_texto: string | null;
    detalhamento_texto: string | null;
    pontos_atencao_texto: string | null;
}

class RetornoDbObrasSEI {
    obra_id: number;
    categoria: CategoriaProcessoSei;
    processo_sei: string;
    descricao: string | null;
    link: string | null;
    comentarios: string | null;
    observacoes: string | null;
}

class RetornoDbLoc {
    projeto_id: number;
    endereco: string;
    geojson: unknown;
    distrito: string | null;
    subprefeitura: string | null;
    zona: string | null;
}

@Injectable()
export class PPObrasService implements ReportableService {
    private tipo: TipoProjeto = 'MDO';

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => TarefaService)) private readonly tarefasService: TarefaService,
        @Inject(forwardRef(() => TarefaUtilsService)) private readonly tarefasUtilsService: TarefaUtilsService
    ) {}

    async asJSON(dto: CreateRelObrasDto, user: PessoaFromJwt | null): Promise<PPObrasRelatorioDto> {
        const out_obras: RelObrasDto[] = [];
        const out_cronogramas: RelObrasCronogramaDto[] = [];
        const out_acompanhamentos: RelObrasAcompanhamentosDto[] = [];
        const out_regioes: RelObrasRegioesDto[] = [];
        const out_fontes_recurso: RelObrasFontesRecursoDto[] = [];
        const out_contratos: RelObrasContratosDto[] = [];
        const out_aditivos: RelObrasAditivosDto[] = [];
        const out_origens: RelObrasOrigemDto[] = [];
        const out_processos_sei: RelObrasSeiDto[] = [];
        const out_enderecos: RelObrasGeolocDto[] = [];

        const whereCond = await this.buildFilteredWhereStr(dto, user);

        await this.queryDataObras(whereCond, out_obras);
        await this.queryDataCronograma(whereCond, out_cronogramas);
        await this.queryDataAcompanhamentos(whereCond, out_acompanhamentos);
        await this.queryDataRegioes(whereCond, out_regioes);
        await this.queryDataFontesRecurso(whereCond, out_fontes_recurso);
        await this.queryDataContratos(whereCond, out_contratos);
        await this.queryDataAditivos(whereCond, out_aditivos);
        await this.queryDataOrigens(whereCond, out_origens);
        await this.queryDataObrasSei(whereCond, out_processos_sei);
        await this.queryDataObrasGeoloc(whereCond, out_enderecos);

        return {
            linhas: out_obras,
            cronograma: out_cronogramas,
            acompanhamentos: out_acompanhamentos,
            regioes: out_regioes,
            fontes_recurso: out_fontes_recurso,
            contratos: out_contratos,
            aditivos: out_aditivos,
            origens: out_origens,
            processos_sei: out_processos_sei,
            enderecos: out_enderecos,
        };
    }

    async toFileOutput(dto: CreateRelObrasDto, ctx: ReportContext, user: PessoaFromJwt | null): Promise<FileOutput[]> {
        const out: FileOutput[] = [];
        ctx.progress(50);

        const whereCond = await this.buildFilteredWhereStr(dto, user);

        const countProjetos = await this.prisma.$queryRawUnsafe<{ count: number }[]>(
            `SELECT COUNT(*) FROM projeto ${whereCond.whereString}`,
            ...whereCond.queryParams
        );

        await ctx.resumoSaida('Obras', countProjetos[0].count);

        out.push(
            await this.streamQueryToCSV(
                `${this.buildObrasBaseQuery()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'obras.csv'
            )
        );

        const cronogramaFields = [
            'projeto_id',
            'projeto_codigo',
            'id',
            'hierarquia',
            'numero',
            'nivel',
            'tarefa',
            'inicio_planejado',
            'termino_planejado',
            'custo_estimado',
            'inicio_real',
            'termino_real',
            'duracao_real',
            'percentual_concluido',
            'custo_real',
            'dependencias',
            'atraso',
            'responsavel_id',
            'responsavel_nome_exibicao',
        ];

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataCronograma()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'cronograma.csv',
                cronogramaFields
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataRegioes()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'regioes.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataAcompanhamentos()}
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'acompanhamentos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataFontesRecurso()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'fontes_recurso.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataContratos()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'contratos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataAditivos()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'aditivos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataOrigens()} ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'origens.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataObrasSei()} ${whereCond.whereString}`,
                whereCond.queryParams,
                'processos_sei.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `${this._queryDataObrasGeoLoc()} ${whereCond.whereString} ${this._queryDataObrasGeoLocFilter()}`,
                whereCond.queryParams,
                'enderecos.csv'
            )
        );

        return out;
    }

    private async streamQueryToCSV(
        query: string,
        params: any[],
        filename: string,
        fields?: string[]
    ): Promise<FileOutput> {
        const parserOptions = {
            ...DefaultCsvOptions,
            transforms: defaultTransform,
            withBOM: true,
            ...(fields ? { fields } : {}),
        };

        const parser = new AsyncParser(parserOptions);

        const chunks: Buffer[] = [];

        // Add TypeScript types to event handlers
        parser.processor
            .on('data', (chunk: Buffer) => chunks.push(chunk))
            .on('end', () => {})
            .on('error', (err: Error) => {
                throw err;
            });

        // Type assertion for Prisma cursor
        const cursor = await this.prisma.$queryRawUnsafe<any[]>(query, ...params);

        // Properly typed row iteration
        for await (const row of cursor) {
            parser.input.push(JSON.stringify(row));
        }

        parser.input.push(null);

        await new Promise((resolve) => parser.processor.on('finish', resolve));

        return { name: filename, buffer: Buffer.concat(chunks) };
    }

    private async buildFilteredWhereStr(
        filters: CreateRelObrasDto,
        user: PessoaFromJwt | null
    ): Promise<WhereCond & { count: number }> {
        const perms = await ProjetoGetPermissionSet(this.tipo, user ? user : undefined);

        // Primeiro, obtenha todos os projetos (diretos e compartilhados) que atendem aos critérios básicos
        const baseWhere: Prisma.ProjetoWhereInput = {
            AND: perms,
            removido_em: null,
            tipo: this.tipo,
            portfolio: { modelo_clonagem: false }, // não traz portfólios que são modelos para clonagem
            orgao_responsavel_id: filters.orgao_responsavel_id ? filters.orgao_responsavel_id : undefined,
            grupo_tematico_id: filters.grupo_tematico_id ? filters.grupo_tematico_id : undefined,
            previsao_inicio: filters.periodo ? { gte: filters.periodo } : undefined,
        };

        // Obtém projetos diretos do portfólio
        const allowed = await this.prisma.projeto.findMany({
            where: {
                ...baseWhere,
                portfolio_id: filters.portfolio_id,
            },
            select: { id: true },
        });

        // Obtém projetos compartilhados com o portfólio
        const allowed_shared = await this.prisma.portfolioProjetoCompartilhado.findMany({
            where: {
                projeto: baseWhere,
                removido_em: null,
                portfolio_id: filters.portfolio_id,
            },
            select: { projeto_id: true },
        });

        // Mescla ambas as listas, removendo duplicados
        const projectIdSet = new Set<number>();
        allowed.forEach((p) => projectIdSet.add(p.id));
        allowed_shared.forEach((s) => projectIdSet.add(s.projeto_id));
        let allProjectIds = Array.from(projectIdSet);

        // Aplica o filtro regiao_id se necessário
        if (filters.regiao_id) {
            // Obtém projetos que possuem a região especificada
            const projectsWithRegion = await this.prisma.projetoRegiao.findMany({
                where: {
                    projeto_id: { in: allProjectIds },
                    regiao_id: filters.regiao_id,
                    removido_em: null,
                },
                select: { projeto_id: true },
            });

            // Filtra para incluir apenas projetos com essa região
            allProjectIds = projectsWithRegion.map((p) => p.projeto_id);
        }

        if (allProjectIds.length === 0) {
            return { whereString: 'WHERE false', queryParams: [], count: 0 };
        }

        // Retorna uma condição WHERE simples com os IDs de projetos filtrados
        return {
            whereString: 'WHERE projeto.id = ANY($1::int[])',
            queryParams: [allProjectIds],
            count: allProjectIds.length,
        };
    }

    private buildObrasBaseQuery(): string {
        const ctes = `
        WITH shared_portfolios AS (
            SELECT
                ppc.projeto_id,
                string_agg(p.titulo, ' | ') AS titulos
            FROM portfolio_projeto_compartilhado ppc
            JOIN portfolio p ON p.id = ppc.portfolio_id AND p.removido_em IS NULL
            WHERE ppc.removido_em IS NULL
            GROUP BY ppc.projeto_id
        ),
        projeto_regioes AS (
            SELECT
                pr.projeto_id,
                string_agg(r.descricao, '|') AS subprefeituras
            FROM projeto_regiao pr
            JOIN regiao r ON r.id = pr.regiao_id
            WHERE pr.removido_em IS NULL AND r.removido_em IS NULL
            GROUP BY pr.projeto_id
        )`;

        const selectFields = `
        SELECT
            projeto.id,
            projeto.portfolio_id,
            portfolio.titulo as portfolio_titulo,
            projeto.meta_id,
            meta.titulo as meta_nome,
            pdm.id as pdm_id,
            pdm.nome as pdm_nome,
            projeto.nome,
            projeto.codigo,
            projeto.objeto,
            projeto.objetivo,
            tc.previsao_inicio AS inicio_planejado,
            tc.previsao_termino AS termino_planejado,
            projeto.previsao_inicio AS previsao_inicio,
            projeto.previsao_termino AS previsao_termino,
            coalesce(tc.previsao_duracao, projeto.previsao_duracao) AS previsao_duracao,
            projeto.previsao_custo AS previsao_custo,
            tc.previsao_custo AS custo_planejado,
            projeto.escopo,
            projeto.nao_escopo,
            projeto.secretario_responsavel,
            projeto.secretario_executivo,
            projeto.coordenador_ue,
            projeto.data_aprovacao,
            projeto.data_revisao,
            projeto.versao,
            projeto.status,
            orgao_responsavel.id AS orgao_responsavel_id,
            orgao_responsavel.sigla AS orgao_responsavel_sigla,
            orgao_responsavel.descricao AS orgao_responsavel_descricao,
            resp.id AS responsavel_id,
            resp.nome_exibicao AS responsavel_nome_exibicao,
            orgao_gestor.id as orgao_gestor_id,
            orgao_gestor.sigla as orgao_gestor_sigla,
            orgao_gestor.descricao as orgao_gestor_descricao,
            (SELECT string_agg(nome_exibicao, '|') FROM pessoa WHERE id = ANY(projeto.responsaveis_no_orgao_gestor)) as assessores,
            (SELECT string_agg(nome_exibicao, '|') FROM pessoa WHERE id = ANY(projeto.colaboradores_no_orgao)) as pontos_focais_colaboradores,
            r.valor_percentual AS fonte_recurso_valor_pct,
            r.valor_nominal AS fonte_recurso_valor_nominal,
            o.id AS orgao_id,
            o.sigla AS orgao_sigla,
            o.descricao AS orgao_descricao,
            orgao_executor.id AS orgao_executor_id,
            orgao_executor.sigla AS orgao_executor_sigla,
            orgao_executor.descricao AS orgao_executor_descricao,
            orgao_origem.id AS orgao_origem_id,
            orgao_origem.sigla AS orgao_origem_sigla,
            orgao_origem.descricao AS orgao_origem_descricao,
            orgao_colaborador.id AS orgao_colaborador_id,
            orgao_colaborador.sigla AS orgao_colaborador_sigla,
            orgao_colaborador.descricao AS orgao_colaborador_descricao,
            pe.descricao AS projeto_etapa,
            grupo_tematico.id AS grupo_tematico_id,
            grupo_tematico.nome AS grupo_tematico_nome,
            tipo_intervencao.id AS tipo_intervencao_id,
            tipo_intervencao.nome AS tipo_intervencao_nome,
            tipo_intervencao.conceito AS tipo_intervencao_conceito,
            equipamento.id AS equipamento_id,
            equipamento.nome AS equipamento_nome,
            mdo_detalhamento AS detalhamento,
            origem_tipo,
            origem_outro as descricao,
            secretario_colaborador,
            mdo_previsao_inauguracao as data_inauguracao_planejada,
            pr.subprefeituras,
            projeto.mdo_programa_habitacional as programa_habitacional,
            projeto.mdo_n_unidades_habitacionais AS n_unidades_habitacionais,
            projeto.mdo_n_familias_beneficiadas AS n_familias_beneficiadas,
            projeto.mdo_n_unidades_atendidas AS n_unidades_atendidas,
            empreendimento.id AS empreendimento_id,
            empreendimento.identificador AS empreendimento_identificador,
            projeto.mdo_observacoes,
            sp.titulos AS portfolios_compartilhados_titulos,
            (
                SELECT
                    string_agg(pt.descricao, '|')
                FROM projeto_tag pt
                WHERE pt.id = ANY(projeto.tags)
                AND pt.removido_em IS NULL
            ) as etiquetas
        `;

        const fromAndJoins = `
        FROM projeto
          LEFT JOIN portfolio ON portfolio.id = projeto.portfolio_id AND portfolio.removido_em IS NULL
          LEFT JOIN shared_portfolios sp ON sp.projeto_id = projeto.id
          LEFT JOIN projeto_regioes pr ON pr.projeto_id = projeto.id
          LEFT JOIN meta ON meta.id = projeto.meta_id AND meta.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id
          LEFT JOIN grupo_tematico ON grupo_tematico.id = projeto.grupo_tematico_id AND grupo_tematico.removido_em IS NULL
          LEFT JOIN tipo_intervencao ON tipo_intervencao.id = projeto.tipo_intervencao_id AND tipo_intervencao.removido_em IS NULL
          LEFT JOIN equipamento ON equipamento.id = projeto.equipamento_id AND equipamento.removido_em IS NULL
          LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
          LEFT JOIN projeto_fonte_recurso r ON r.projeto_id = projeto.id
          LEFT JOIN projeto_orgao_participante po ON po.projeto_id = projeto.id
          LEFT JOIN orgao o ON po.orgao_id = o.id
          LEFT JOIN orgao orgao_responsavel ON orgao_responsavel.id = projeto.orgao_responsavel_id
          LEFT JOIN orgao orgao_gestor ON orgao_gestor.id = projeto.orgao_gestor_id
          LEFT JOIN orgao orgao_executor ON orgao_executor.id = projeto.orgao_executor_id
          LEFT JOIN orgao orgao_origem ON orgao_origem.id = projeto.orgao_origem_id
          LEFT JOIN orgao orgao_colaborador ON orgao_colaborador.id = projeto.orgao_colaborador_id
          LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
          LEFT JOIN projeto_etapa pe ON pe.id = projeto.projeto_etapa_id
          LEFT JOIN empreendimento ON empreendimento.id = projeto.empreendimento_id AND empreendimento.removido_em IS NULL
        `;

        return `${ctes} ${selectFields} ${fromAndJoins}`;
    }

    private async queryDataObras(whereCond: WhereCond, out: RelObrasDto[]) {
        // Usa o mesmo SQL base para todas as consultas de obras, com a possibilidade de incluir etiquetas
        const baseQuery = this.buildObrasBaseQuery();

        // Combine the base query with the dynamic WHERE clause
        const sql = `${baseQuery} ${whereCond.whereString}`;

        const data: RetornoDbProjeto[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        this.convertRowsObrasInto(data, out);
    }

    private convertRowsObrasInto(input: RetornoDbProjeto[], out: RelObrasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                portfolio_id: db.portfolio_id,
                portfolio_titulo: db.portfolio_titulo,
                pdm_id: db.pdm_id ? db.pdm_id : null,
                pdm_nome: db.pdm_nome ? db.pdm_nome : null,
                meta_id: db.meta_id ? db.meta_id : null,
                meta_nome: db.meta_nome ? db.meta_nome : null,
                grupo_tematico_id: db.grupo_tematico_id ? db.grupo_tematico_id : null,
                grupo_tematico_nome: db.grupo_tematico_nome ? db.grupo_tematico_nome : null,
                tipo_obra_id: db.tipo_intervencao_id ? db.tipo_intervencao_id : null,
                tipo_obra_nome: db.tipo_intervencao_nome ? db.tipo_intervencao_nome : null,
                tipo_obra_conceito: db.tipo_intervencao_conceito ? db.tipo_intervencao_conceito : null,
                equipamento_id: db.equipamento_id ? db.equipamento_id : null,
                equipamento_nome: db.equipamento_nome ? db.equipamento_nome : null,
                empreendimento_id: db.empreendimento_id ? db.empreendimento_id : null,
                empreendimento_identificador: db.empreendimento_identificador ? db.empreendimento_identificador : null,
                nome: db.nome,
                codigo: db.codigo ? db.codigo : null,
                detalhamento: db.detalhamento ?? null,
                origem_tipo: db.origem_tipo,
                descricao: db.descricao ?? null,
                secretario_colaborador: db.secretario_colaborador,
                previsao_inicio: db.previsao_inicio ? Date2YMD.toString(db.previsao_inicio) : null,
                previsao_termino: db.previsao_termino ? Date2YMD.toString(db.previsao_termino) : null,
                inicio_planejado: db.inicio_planejado ? Date2YMD.toString(db.inicio_planejado) : null,
                termino_planejado: db.termino_planejado ? Date2YMD.toString(db.termino_planejado) : null,
                previsao_duracao: db.previsao_duracao ? db.previsao_duracao : null,
                previsao_custo: db.previsao_custo ? db.previsao_custo : null,
                custo_planejado: db.custo_planejado ? db.custo_planejado : null,
                etiquetas: db.etiquetas ?? null,
                data_inauguracao_planejada: db.data_inauguracao_planejada
                    ? Date2YMD.toString(db.data_inauguracao_planejada)
                    : null,
                secretario_responsavel: db.secretario_responsavel,
                secretario_executivo: db.secretario_executivo,
                status: db.status,
                subprefeituras: db.subprefeituras,
                etapa: db.projeto_etapa ? db.projeto_etapa : null,
                n_familias_beneficiadas: db.n_familias_beneficiadas ? db.n_familias_beneficiadas : null,
                n_unidades_habitacionais: db.n_unidades_habitacionais ? db.n_unidades_habitacionais : null,
                n_unidades_atendidas: db.n_unidades_atendidas ? db.n_unidades_atendidas : null,
                programa_habitacional: db.programa_habitacional ? db.programa_habitacional : null,
                pontos_focais_colaboradores: db.pontos_focais_colaboradores,
                observacoes: db.mdo_observacoes ? db.mdo_observacoes : null,
                orgao_executor: db.orgao_executor_id
                    ? {
                          id: db.orgao_executor_id,
                          sigla: db.orgao_executor_sigla,
                          descricao: db.orgao_executor_descricao,
                      }
                    : null,
                orgao_origem: db.orgao_origem_id
                    ? { id: db.orgao_origem_id, sigla: db.orgao_origem_sigla, descricao: db.orgao_origem_descricao }
                    : null,

                orgao_responsavel: db.orgao_responsavel_id
                    ? {
                          id: db.orgao_responsavel_id,
                          sigla: db.orgao_responsavel_sigla,
                          descricao: db.orgao_responsavel_descricao,
                      }
                    : null,

                orgao_gestor: {
                    id: db.orgao_gestor_id,
                    sigla: db.orgao_gestor_sigla,
                    descricao: db.orgao_gestor_descricao,
                },

                orgao_colaborador: db.orgao_colaborador_id
                    ? {
                          id: db.orgao_colaborador_id,
                          sigla: db.orgao_colaborador_sigla,
                          descricao: db.orgao_colaborador_descricao,
                      }
                    : null,
                assessores: db.assessores,

                responsavel: db.responsavel_id
                    ? {
                          id: db.responsavel_id,
                          nome_exibicao: db.responsavel_nome_exibicao,
                      }
                    : null,
                portfolios_compartilhados: db.portfolios_compartilhados_titulos,
            });
        }
    }

    private _queryDataCronograma() {
        return `
            SELECT
                tc.projeto_id AS projeto_id,
                projeto.codigo AS projeto_codigo,
                tc.atraso,
                resp.id AS responsavel_id,
                resp.nome_exibicao AS responsavel_nome_exibicao,
                t.id,
                t.numero,
                t.nivel,
                '' AS hierarquia,
                t.tarefa,
                t.inicio_planejado,
                t.termino_planejado,
                t.custo_estimado,
                t.inicio_real,
                t.termino_real,
                t.duracao_real,
                t.percentual_concluido,
                t.custo_real,
                (
                    SELECT
                      string_agg(json_build_object('id', td.dependencia_tarefa_id, 'tipo', td.tipo, 'latencia', td.latencia) #>> '{}', '/')
                    FROM tarefa_dependente td
                    JOIN tarefa t2 ON t2.id = td.dependencia_tarefa_id AND t2.removido_em IS NULL
                    WHERE td.tarefa_id = t.id
                ) as dependencias,
                t.custo_estimado_anualizado,
                t.custo_real_anualizado,
                t.backup_custo_estimado,
                t.backup_custo_real
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
                LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
                JOIN tarefa t ON t.tarefa_cronograma_id = tc.id AND t.removido_em IS NULL`;
    }

    private async queryDataCronograma(whereCond: WhereCond, out: RelObrasCronogramaDto[]) {
        const sql = `${this._queryDataCronograma()} ${whereCond.whereString}`;

        const data: RetornoDbCronograma[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        await this.putRowsCronogramaInto(data, out);
    }

    private async putRowsCronogramaInto(input: RetornoDbCronograma[], out: RelObrasCronogramaDto[]) {
        for (const db of input) {
            interface dependenciaRow {
                id: number;
                tipo: string;
                latencia: number;
            }

            await this.projetoService.findOne(this.tipo, db.projeto_id, undefined, 'ReadOnly');

            const tarefaCronoId = await this.prisma.tarefaCronograma.findFirst({
                where: {
                    projeto_id: db.projeto_id,
                    removido_em: null,
                },
                select: { id: true },
            });

            let tarefasHierarquia: Record<string, string> = {};
            if (tarefaCronoId) tarefasHierarquia = await this.tarefasService.tarefasHierarquia(tarefaCronoId.id);

            // Tratando custo real e custo estimado anualizados.
            // Esses campos tem regras que olham para a duração da tarefa. Mas aqui podemos apenas verificar se estão definidos.
            // Caso a tarefa seja anualizada, teremos valores nesses campos. E caso não tenham, utilizaremos os backups.
            let custo_real: number | string | null;
            let custo_estimado: number | string | null;
            if (db.custo_real_anualizado !== null && db.custo_real_anualizado !== undefined) {
                // JSON que segue o padrão {"2023" : 0} ou {"2025" : null}
                // Vamos exibir como "$ano: valor"
                const custoRealAnualizadoObj = db.custo_real_anualizado as Record<string, any>;
                const anoKeys = Object.keys(custoRealAnualizadoObj);
                const custoRealParts = anoKeys.map((ano) => {
                    const valor = custoRealAnualizadoObj[ano];
                    // Se o valor do ano for null, usar backup (sem estrutura de ano) ou null
                    if (valor !== null) {
                        return `${ano}: ${valor}`;
                    } else if (db.backup_custo_real !== null && db.backup_custo_real !== undefined) {
                        return db.backup_custo_real;
                    } else {
                        return null;
                    }
                });
                custo_real = custoRealParts.filter((v) => v !== null).join(' ; ');
            } else {
                custo_real = db.backup_custo_real ?? null;
            }

            if (db.custo_estimado_anualizado !== null && db.custo_estimado_anualizado !== undefined) {
                const custoEstimadoAnualizadoObj = db.custo_estimado_anualizado as Record<string, any>;
                const anoKeys = Object.keys(custoEstimadoAnualizadoObj);
                const custoEstimadoParts = anoKeys.map((ano) => {
                    const valor = custoEstimadoAnualizadoObj[ano];
                    // Se o valor do ano for null, usar backup (sem estrutura de ano) ou null
                    if (valor !== null) {
                        return `${ano}: ${valor}`;
                    } else if (db.backup_custo_estimado !== null && db.backup_custo_estimado !== undefined) {
                        return db.backup_custo_estimado;
                    } else {
                        return null;
                    }
                });
                custo_estimado = custoEstimadoParts.filter((v) => v !== null).join(' ; ');
            } else {
                custo_estimado = db.backup_custo_estimado ?? null;
            }

            out.push({
                obra_id: db.projeto_id,
                obra_codigo: db.projeto_codigo,
                tarefa_id: db.id,
                hirearquia: tarefasHierarquia[db.id],
                numero: db.numero,
                nivel: db.nivel,
                tarefa: db.tarefa,
                inicio_planejado: db.inicio_planejado ? Date2YMD.toString(db.inicio_planejado) : null,
                termino_planejado: db.termino_planejado ? Date2YMD.toString(db.termino_planejado) : null,
                custo_estimado: custo_estimado,
                inicio_real: db.inicio_real ? Date2YMD.toString(db.inicio_real) : null,
                termino_real: db.termino_real ? Date2YMD.toString(db.termino_real) : null,
                duracao_real: db.duracao_real ? db.duracao_real : null,
                percentual_concluido: db.percentual_concluido ? db.percentual_concluido : null,
                custo_real: custo_real,
                dependencias: db.dependencias
                    ? db.dependencias
                          .split('/')
                          .map((e) => {
                              const row: dependenciaRow = JSON.parse(e);

                              const hierarquia = tarefasHierarquia[row.id];
                              const tipo = this.tarefasUtilsService.tarefaDependenteTipoSigla(row.tipo);
                              const latencia_str = row.latencia == 0 ? '' : row.latencia;

                              return `${hierarquia} ${tipo} ${latencia_str}`;
                          })
                          .join('/')
                    : null,
                atraso: db.atraso ? db.atraso : null,
                responsavel: db.responsavel_id
                    ? {
                          id: db.responsavel_id,
                          nome_exibicao: db.responsavel_nome_exibicao,
                      }
                    : null,
            });
        }
    }

    private _queryDataRegioes() {
        return `
            SELECT
                projeto.id AS projeto_id,
                regiao.descricao AS descricao,
                regiao.pdm_codigo_sufixo AS sigla,
                regiao.nivel AS nivel
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            JOIN projeto_regiao ON projeto_regiao.projeto_id = projeto.id AND projeto_regiao.removido_em IS NULL
            JOIN regiao ON regiao.id = projeto_regiao.regiao_id AND regiao.removido_em IS NULL
        `;
    }
    private async queryDataRegioes(whereCond: WhereCond, out: RelObrasRegioesDto[]) {
        const sql = `${this._queryDataRegioes()} ${whereCond.whereString}`;

        const data: RetornoDbRegioes[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsRegioes(data));
    }

    private convertRowsRegioes(input: RetornoDbRegioes[]): RelObrasRegioesDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                distrito:
                    db.nivel == 4
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
                subprefeitura:
                    db.nivel == 3
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
            };
        });
    }

    private _queryDataFontesRecurso() {
        return `SELECT
                projeto.id AS projeto_id,
                projeto_fonte_recurso.valor_percentual,
                projeto_fonte_recurso.valor_nominal,
                projeto_fonte_recurso.fonte_recurso_ano,
                projeto_fonte_recurso.fonte_recurso_cod_sof
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            JOIN projeto_fonte_recurso ON projeto_fonte_recurso.projeto_id = projeto.id
        `;
    }

    private async queryDataFontesRecurso(whereCond: WhereCond, out: RelObrasFontesRecursoDto[]) {
        const sql = `${this._queryDataFontesRecurso()} ${whereCond.whereString}`;

        const data: RetornoDbFontesRecurso[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsFontesRecurso(data));
    }

    private convertRowsFontesRecurso(input: RetornoDbFontesRecurso[]): RelObrasFontesRecursoDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                fonte_recurso_ano: db.fonte_recurso_ano,
                fonte_recurso_cod_sof: db.fonte_recurso_cod_sof,
                valor_percentual: db.valor_percentual ? db.valor_percentual : null,
                valor_nominal: db.valor_nominal ? db.valor_nominal : null,
            };
        });
    }

    private _queryDataContratos() {
        return `SELECT
            contrato.id AS id,
            projeto.id AS obra_id,
            contrato.numero AS numero,
            contrato.contrato_exclusivo AS exclusivo,
            contrato.status AS status,
            contrato.objeto_resumo AS objeto,
            contrato.objeto_detalhado AS descricao_detalhada,
            contrato.contratante AS contratante,
            contrato.empresa_contratada AS empresa_contratada,
            contrato.prazo_numero AS prazo,
            contrato.prazo_unidade AS unidade_prazo,
            contrato.data_inicio AS data_inicio,
            contrato.data_termino AS data_termino,
            contrato.observacoes AS observacoes,
            contrato.data_base_mes::text || '/' ||  contrato.data_base_ano::text AS data_base,
            modalidade_contratacao.id AS modalidade_contratacao_id,
            modalidade_contratacao.nome AS modalidade_contratacao_nome,
            orgao.id AS orgao_id,
            orgao.sigla AS orgao_sigla,
            orgao.descricao AS orgao_descricao,
            contrato.valor AS valor,
            (
                SELECT max(valor)
                FROM contrato_aditivo
                JOIN tipo_aditivo ON tipo_aditivo.id = contrato_aditivo.tipo_aditivo_id AND tipo_aditivo.removido_em IS NULL
                WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL AND tipo_aditivo.habilita_valor = true GROUP BY contrato_aditivo.data ORDER BY contrato_aditivo.data DESC LIMIT 1
            ) AS valor_reajustado,
            (
                SELECT valor FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL ORDER BY contrato_aditivo.data DESC LIMIT 1
            ) AS valor_com_reajuste,
            (
                SELECT max(data_termino_atualizada) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
            ) AS data_termino_atualizada,
            (
                SELECT max(percentual_medido) FROM contrato_aditivo WHERE contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
            ) AS percentual_medido,
            (
                SELECT string_agg(format_proc_sei_sinproc(contrato_sei.numero_sei::text), '|')
                FROM contrato_sei
                WHERE contrato_sei.contrato_id = contrato.id
            ) AS processos_sei,
            (
                SELECT string_agg(cod_sof::text, '|')
                FROM contrato_fonte_recurso
                WHERE contrato_id = contrato.id
            ) AS fontes_recurso
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
          LEFT JOIN orgao ON orgao.id = contrato.orgao_id AND orgao.removido_em IS NULL
          LEFT JOIN modalidade_contratacao ON contrato.modalidade_contratacao_id = modalidade_contratacao.id AND modalidade_contratacao.removido_em IS NULL
        `;
    }

    private async queryDataContratos(whereCond: WhereCond, out: RelObrasContratosDto[]) {
        const sql = `${this._queryDataContratos()} ${whereCond.whereString}`;

        const data: RetornoDbContratos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsContratos(data));
    }

    private convertRowsContratos(input: RetornoDbContratos[]): RelObrasContratosDto[] {
        return input.map((db) => {
            return {
                id: db.id,
                obra_id: db.obra_id,
                numero: db.numero,
                exclusivo: db.exclusivo,
                processos_SEI: db.processos_sei,
                status: db.status,
                modalidade_licitacao: db.modalidade_contratacao_id
                    ? { id: db.modalidade_contratacao_id!, nome: db.modalidade_contratacao_nome!.toString() }
                    : null,
                fontes_recurso: db.fontes_recurso,
                area_gestora: db.orgao_id
                    ? { id: db.orgao_id, sigla: db.orgao_sigla!.toString(), descricao: db.orgao_descricao!.toString() }
                    : null,
                objeto: db.objeto,
                descricao_detalhada: db.descricao_detalhada,
                contratante: db.contratante,
                empresa_contratada: db.empresa_contratada,
                prazo: db.prazo,
                unidade_prazo: db.unidade_prazo,
                data_base: db.data_base,
                data_inicio: db.data_inicio,
                data_termino: db.data_termino,
                data_termino_atualizada: db.data_termino_atualizada,
                valor: db.valor,
                valor_reajustado: db.valor_reajustado,
                percentual_medido: db.percentual_medido,
                observacoes: db.observacoes,
            };
        });
    }

    private _queryDataAditivos() {
        return `SELECT
            contrato_aditivo.id AS aditivo_id,
            contrato.id AS contrato_id,
            contrato_aditivo.numero AS numero,
            tipo_aditivo.id AS tipo_aditivo_id,
            tipo_aditivo.nome AS tipo_aditivo_nome,
            contrato_aditivo.data,
            contrato_aditivo.data_termino_atualizada AS data_termino_atual,
            contrato_aditivo.valor AS valor_com_reajuste,
            contrato_aditivo.percentual_medido
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
          JOIN contrato_aditivo ON contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
          JOIN tipo_aditivo ON tipo_aditivo.id = contrato_aditivo.tipo_aditivo_id AND tipo_aditivo.removido_em IS NULL
        `;
    }

    private async queryDataAditivos(whereCond: WhereCond, out: RelObrasAditivosDto[]) {
        const sql = `${this._queryDataAditivos()} ${whereCond.whereString}`;

        const data: RetornoDbAditivos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsAditivos(data));
    }

    private convertRowsAditivos(input: RetornoDbAditivos[]): RelObrasAditivosDto[] {
        return input.map((db) => {
            return {
                id: db.aditivo_id,
                contrato_id: db.contrato_id,
                tipo: { id: db.tipo_aditivo_id, nome: db.tipo_aditivo_nome },
                data: db.data ?? null,
                valor_com_reajuste: db.valor_com_reajuste ?? null,
                percentual_medido: db.percentual_medido ?? null,
                data_termino_atual: db.data_termino_atual ?? null,
            };
        });
    }

    private _queryDataAcompanhamentos() {
        return `
            SELECT
                projeto.id AS projeto_id,
                projeto.codigo AS projeto_codigo,
                projeto_acompanhamento.data_registro,
                projeto_acompanhamento.participantes,
                projeto_acompanhamento.cronograma_paralisado,
                projeto_acompanhamento_item.prazo_encaminhamento,
                projeto_acompanhamento.pauta,
                projeto_acompanhamento_item.prazo_realizado,
                projeto_acompanhamento.detalhamento,
                projeto_acompanhamento_item.encaminhamento,
                projeto_acompanhamento_item.responsavel,
                projeto_acompanhamento.observacao,
                projeto_acompanhamento.detalhamento_status,
                projeto_acompanhamento.pontos_atencao,
                projeto_acompanhamento.pauta AS pauta_texto,
                projeto_acompanhamento.detalhamento AS detalhamento_texto,
                projeto_acompanhamento.pontos_atencao AS pontos_atencao_texto,
                (
                    SELECT string_agg(r.codigo::text, '|')
                    FROM projeto_acompanhamento_risco ar
                    JOIN projeto_risco r ON ar.projeto_risco_id = r.id AND r.removido_em IS NULL
                    WHERE ar.projeto_acompanhamento_id = projeto_acompanhamento.id
                ) AS riscos
            FROM projeto
            JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id
                AND projeto_acompanhamento.removido_em IS NULL
            LEFT JOIN projeto_acompanhamento_item ON projeto_acompanhamento_item.projeto_acompanhamento_id = projeto_acompanhamento.id
                AND projeto_acompanhamento_item.removido_em IS NULL
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
        `;
    }

    private async queryDataAcompanhamentos(whereCond: WhereCond, out: RelObrasAcompanhamentosDto[]) {
        const sql = `${this._queryDataAcompanhamentos()} ${whereCond.whereString}`;

        const data: RetornoDbAcompanhamentos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsAcompanhamentos(data));
    }

    private convertRowsAcompanhamentos(input: RetornoDbAcompanhamentos[]): RelObrasAcompanhamentosDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                obra_codigo: db.projeto_codigo,
                data_registro: Date2YMD.toString(db.data_registro),
                participantes: db.participantes,
                cronograma_paralizado: db.cronograma_paralizado,
                pauta: db.pauta,
                prazo_encaminhamento: db.prazo_encaminhamento ? Date2YMD.toString(db.prazo_encaminhamento) : null,
                prazo_realizado: db.prazo_realizado ? Date2YMD.toString(db.prazo_realizado) : null,
                detalhamento: db.detalhamento ? db.detalhamento : null,
                encaminhamento: db.encaminhamento ? db.encaminhamento : null,
                responsavel: db.responsavel ? db.responsavel : null,
                observacao: db.observacao ? db.observacao : null,
                detalhamento_status: db.detalhamento_status ? db.detalhamento_status : null,
                pontos_atencao: db.pontos_atencao ? db.pontos_atencao : null,
                riscos: db.riscos ? db.riscos : null,
                pauta_texto: Html2Text(db.pauta),
                detalhamento_texto: Html2Text(db.detalhamento),
                pontos_atencao_texto: Html2Text(db.pontos_atencao),
            };
        });
    }

    private _queryDataOrigens() {
        return `SELECT
            projeto.id AS projeto_id,
            meta.pdm_id,
            pdm.nome AS pdm_titulo,
            meta.id as meta_id,
            meta.titulo as meta_titulo,
            iniciativa.id iniciativa_id,
            iniciativa.titulo as iniciativa_titulo,
            atividade.id atividade_id,
            atividade.titulo as atividade_titulo
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN projeto_origem ON projeto_origem.projeto_id = projeto.id AND projeto_origem.removido_em IS NULL
          LEFT JOIN meta ON meta.id = projeto_origem.meta_id AND meta.removido_em IS NULL
          LEFT JOIN iniciativa ON iniciativa.id = projeto_origem.iniciativa_id AND iniciativa.removido_em IS NULL
          LEFT JOIN atividade ON atividade.id = projeto_origem.atividade_id AND atividade.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id
        `;
    }

    private async queryDataOrigens(whereCond: WhereCond, out: RelObrasOrigemDto[]) {
        const sql = `${this._queryDataOrigens()} ${whereCond.whereString}`;

        const data: RetornoDbOrigens[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsOrigens(data));
    }

    private convertRowsOrigens(input: RetornoDbOrigens[]): RelObrasOrigemDto[] {
        return input.map((db) => {
            return {
                projeto_id: db.projeto_id,
                pdm_id: db.pdm_id ?? null,
                pdm_titulo: db.pdm_titulo ?? null,
                meta_id: db.meta_id ?? null,
                meta_titulo: db.meta_titulo ?? null,
                iniciativa_id: db.iniciativa_id ?? null,
                iniciativa_titulo: db.iniciativa_titulo ?? null,
                atividade_id: db.atividade_id ?? null,
                atividade_titulo: db.atividade_titulo ?? null,
            };
        });
    }

    private _queryDataObrasSei() {
        return `SELECT
            projeto.id AS obra_id,
            projeto_registro_sei.categoria,
            format_proc_sei_sinproc(projeto_registro_sei.processo_sei) AS processo_sei,
            projeto_registro_sei.descricao,
            projeto_registro_sei.link,
            projeto_registro_sei.comentarios,
            projeto_registro_sei.observacoes
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
          JOIN projeto_registro_sei ON projeto_registro_sei.projeto_id = projeto.id AND projeto_registro_sei.removido_em IS NULL
        `;
    }

    private async queryDataObrasSei(whereCond: WhereCond, out: RelObrasSeiDto[]) {
        const sql = `${this._queryDataObrasSei()} ${whereCond.whereString}`;

        const data: RetornoDbObrasSEI[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsObrasSei(data));
    }

    private convertRowsObrasSei(input: RetornoDbObrasSEI[]): RelObrasSeiDto[] {
        return input.map((db) => {
            return {
                obra_id: db.obra_id,
                categoria: db.categoria,
                processo_sei: db.processo_sei,
                descricao: db.descricao ?? null,
                link: db.link ?? null,
                comentarios: db.comentarios ?? null,
                observacoes: db.observacoes ?? null,
            };
        });
    }

    private _queryDataObrasGeoLoc() {
        return `SELECT
                projeto.id AS projeto_id,
                geo.endereco_exibicao AS endereco,
                geo.geom_geojson AS geojson,
                COALESCE(
                    zona_agg_geo.zona,
                    zona_agg_regiao.zona
                ) AS zona,
                COALESCE(
                    distrito_agg_geo.distrito,
                    distrito_agg_regiao.distrito
                ) AS distrito,
                COALESCE(
                    subprefeitura_agg_geo.subprefeitura,
                    subprefeitura_agg_regiao.subprefeitura
                ) AS subprefeitura
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            LEFT JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
            LEFT JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS zona
                FROM unnest(geo.calc_regioes_nivel_2) AS regiao_id
                JOIN regiao r ON r.id = regiao_id
            ) zona_agg_geo ON geo.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS subprefeitura
                FROM unnest(geo.calc_regioes_nivel_3) AS regiao_id
                JOIN regiao r ON r.id = regiao_id
            ) subprefeitura_agg_geo ON geo.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS distrito
                FROM unnest(geo.calc_regioes_nivel_4) AS regiao_id
                JOIN regiao r ON r.id = regiao_id
            ) distrito_agg_geo ON geo.id IS NOT NULL
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS zona
                FROM projeto_regiao pr2
                JOIN regiao r ON r.id = pr2.regiao_id AND r.nivel = 2 AND r.removido_em IS NULL
                WHERE pr2.projeto_id = projeto.id AND pr2.removido_em IS NULL
            ) zona_agg_regiao ON geo_r.id IS NULL
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS subprefeitura
                FROM projeto_regiao pr2
                JOIN regiao r ON r.id = pr2.regiao_id AND r.nivel = 3 AND r.removido_em IS NULL
                WHERE pr2.projeto_id = projeto.id AND pr2.removido_em IS NULL
            ) subprefeitura_agg_regiao ON geo_r.id IS NULL
            LEFT JOIN LATERAL (
                SELECT STRING_AGG(DISTINCT r.descricao, '|') AS distrito
                FROM projeto_regiao pr2
                JOIN regiao r ON r.id = pr2.regiao_id AND r.nivel = 4 AND r.removido_em IS NULL
                WHERE pr2.projeto_id = projeto.id AND pr2.removido_em IS NULL
            ) distrito_agg_regiao ON geo_r.id IS NULL
        `;
    }

    private _queryDataObrasGeoLocFilter() {
        return `AND (
            geo_r.id IS NOT NULL OR EXISTS (
                SELECT 1 FROM projeto_regiao pr
                WHERE pr.projeto_id = projeto.id AND pr.removido_em IS NULL
            )
        )`;
    }

    private async queryDataObrasGeoloc(whereCond: WhereCond, out: RelObrasGeolocDto[]) {
        const sql = `${this._queryDataObrasGeoLoc()} ${whereCond.whereString} ${this._queryDataObrasGeoLocFilter()}`;

        const data: RetornoDbLoc[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsLoc(data));
    }

    private convertRowsLoc(input: RetornoDbLoc[]): RelObrasGeolocDto[] {
        interface JSONGeo {
            properties: {
                cep: string;
            };
        }

        return input.map((db) => {
            const geojson = db.geojson as JSONGeo | null;

            return {
                obra_id: db.projeto_id,
                endereco: db.endereco ?? null,
                cep: geojson?.properties?.cep ?? null,
                zona: db.zona ?? null,
                distrito: db.distrito ?? null,
                subprefeitura: db.subprefeitura ?? null,
            };
        });
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
