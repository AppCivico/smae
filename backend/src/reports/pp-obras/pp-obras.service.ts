import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
    CategoriaProcessoSei,
    ContratoPrazoUnidade,
    ProjetoOrigemTipo,
    ProjetoStatus,
    StatusContrato,
    TipoProjeto,
} from '@prisma/client';
import { formataSEI } from 'src/common/formata-sei';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { TarefaUtilsService } from 'src/pp/tarefa/tarefa.service.utils';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { ProjetoGetPermissionSet, ProjetoService } from '../../pp/projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DefaultCsvOptions, FileOutput, ReportableService } from '../utils/utils.service';
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
        const out: FileOutput[] = [
            {
                name: 'info.json',
                buffer: Buffer.from(
                    JSON.stringify({
                        params: dto,
                        horario: Date2YMD.tzSp2UTC(new Date()),
                    }),
                    'utf8'
                ),
            },
        ];
        ctx.progress(50);

        const whereCond = await this.buildFilteredWhereStr(dto, user);
        await ctx.resumoSaida('Obras', whereCond.count);

        const baseQuery = this.buildObrasBaseQuery(true);
        const obrasQuery = `${baseQuery} ${whereCond.whereString}`;

        out.push(await this.streamQueryToCSV(obrasQuery, whereCond.queryParams, 'obras.csv'));

        out.push(
            await this.streamQueryToCSV(
                `SELECT
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
                    ) as dependencias
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
                LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
                JOIN tarefa t ON t.tarefa_cronograma_id = tc.id AND t.removido_em IS NULL
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'cronograma.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
                    projeto.id AS projeto_id,
                    regiao.descricao AS descricao,
                    regiao.pdm_codigo_sufixo AS sigla,
                    regiao.nivel AS nivel
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                JOIN projeto_regiao ON projeto_regiao.projeto_id = projeto.id AND projeto_regiao.removido_em IS NULL
                JOIN regiao ON regiao.id = projeto_regiao.regiao_id AND regiao.removido_em IS NULL
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'regioes.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
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
                    (
                        SELECT string_agg(r.codigo::text, '|')
                        FROM projeto_acompanhamento_risco ar
                        JOIN projeto_risco r ON ar.projeto_risco_id = r.id AND r.removido_em IS NULL
                        WHERE ar.projeto_acompanhamento_id = projeto_acompanhamento.id
                    ) AS riscos
                FROM projeto
                JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id
                JOIN projeto_acompanhamento_item ON projeto_acompanhamento_item.projeto_acompanhamento_id = projeto_acompanhamento.id
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'acompanhamentos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
                    projeto.id AS projeto_id,
                    projeto_fonte_recurso.valor_percentual,
                    projeto_fonte_recurso.valor_nominal,
                    projeto_fonte_recurso.fonte_recurso_ano,
                    projeto_fonte_recurso.fonte_recurso_cod_sof
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                JOIN projeto_fonte_recurso ON projeto_fonte_recurso.projeto_id = projeto.id
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'fontes_recurso.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
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
                        SELECT string_agg(contrato_sei.numero_sei::text, '|')
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
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'contratos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
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
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'aditivos.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
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
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'origens.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
                    projeto.id AS obra_id,
                    projeto_registro_sei.categoria,
                    projeto_registro_sei.processo_sei,
                    projeto_registro_sei.descricao,
                    projeto_registro_sei.link,
                    projeto_registro_sei.comentarios,
                    projeto_registro_sei.observacoes
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                JOIN projeto_registro_sei ON projeto_registro_sei.projeto_id = projeto.id AND projeto_registro_sei.removido_em IS NULL
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'processos_sei.csv'
            )
        );

        out.push(
            await this.streamQueryToCSV(
                `SELECT
                    projeto.id AS projeto_id,
                    geo.endereco_exibicao AS endereco,
                    geo.geom_geojson AS geojson
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
                JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
                JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
                ${whereCond.whereString}
                `,
                whereCond.queryParams,
                'enderecos.csv'
            )
        );

        return out;
    }

    private async streamQueryToCSV(query: string, params: any[], filename: string): Promise<FileOutput> {
        const parser = new AsyncParser({
            ...DefaultCsvOptions,
            transforms: defaultTransform,
            withBOM: true,
        });

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
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        const perms = await ProjetoGetPermissionSet(this.tipo, user ? user : undefined);

        const allowed = await this.prisma.projeto.findMany({
            where: {
                AND: perms,
                removido_em: null,
                // importante manter o portfolio_id aqui, pois é utilizado no filtro de compartilhamento
                // e aqui também
                portfolio_id: filters.portfolio_id,
                portfolio: { modelo_clonagem: false }, // não traz portfólios que são modelos para clonagem
                // reduz o número de linhas pra não virar um "IN" gigante
                tipo: this.tipo,
                orgao_responsavel_id: filters.orgao_responsavel_id ? filters.orgao_responsavel_id : undefined,
                grupo_tematico_id: filters.grupo_tematico_id ? filters.grupo_tematico_id : undefined,
            },
            select: { id: true },
        });

        const allowed_shared = await this.prisma.portfolioProjetoCompartilhado.findMany({
            where: {
                projeto: {
                    AND: perms,
                    portfolio: { modelo_clonagem: false }, // não traz portfólios que são modelos para clonagem
                },
                removido_em: null,
                portfolio_id: filters.portfolio_id,
            },
            select: { projeto_id: true },
        });

        // Adicionando projetos compartilhados.
        // Deve ser adicionado apenas projetos que não sejam originalmente do portfolio utilizado no filtro.
        allowed.push(
            ...allowed_shared
                .filter((n) => !allowed.find((m) => m.id === n.projeto_id))
                .map((n) => ({ id: n.projeto_id }))
        );

        if (allowed.length === 0) {
            return { whereString: 'WHERE false', queryParams: [], count: allowed.length };
        }

        whereConditions.push(`projeto.id = ANY($${paramIndex}::int[])`);
        queryParams.push(allowed.map((n) => n.id));
        paramIndex++;

        // não usa o filtro do portfolio_id, pois já foi aplicado no filtro de permissões

        if (filters.orgao_responsavel_id) {
            whereConditions.push(`projeto.orgao_responsavel_id = $${paramIndex}`);
            queryParams.push(filters.orgao_responsavel_id);
            paramIndex++;
        }

        if (filters.grupo_tematico_id) {
            whereConditions.push(`projeto.grupo_tematico_id = $${paramIndex}`);
            queryParams.push(filters.grupo_tematico_id);
            paramIndex++;
        }

        if (filters.projeto_regiao_id) {
            whereConditions.push(
                `EXISTS (SELECT 1 FROM projeto_regioes WHERE projeto_id = projeto.id AND regiao_id = $${paramIndex})`
            );
            queryParams.push(filters.projeto_regiao_id);
            paramIndex++;
        }

        if (filters.periodo) {
            whereConditions.push(`projeto.previsao_inicio >= $${paramIndex}`);
            queryParams.push(filters.periodo);
            paramIndex++;
        }

        whereConditions.push(`projeto.removido_em IS NULL`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : 'WHERE TRUE';
        return { whereString, queryParams, count: allowed.length };
    }

    private buildObrasBaseQuery(includeEtiquetas: boolean): string {
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
        )
        ${
            includeEtiquetas
                ? `,
        projeto_etiquetas AS (
            SELECT
                projeto_id,
                string_agg(pt.descricao, '|') AS etiquetas
            FROM projeto_tag pt
            JOIN projeto p ON pt.id = ANY(p.tags) AND p.removido_em IS NULL
            WHERE pt.removido_em IS NULL
            GROUP BY projeto_id
        )`
                : ''
        }`;

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
            sp.titulos AS portfolios_compartilhados_titulos
            ${includeEtiquetas ? ', et.etiquetas' : ''}
        `;

        const fromAndJoins = `
        FROM projeto
          LEFT JOIN portfolio ON portfolio.id = projeto.portfolio_id AND portfolio.removido_em IS NULL
          LEFT JOIN shared_portfolios sp ON sp.projeto_id = projeto.id
          LEFT JOIN projeto_regioes pr ON pr.projeto_id = projeto.id
          ${includeEtiquetas ? 'LEFT JOIN projeto_etiquetas et ON et.projeto_id = projeto.id' : ''}
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
        const baseQuery = this.buildObrasBaseQuery(false);

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

    private async queryDataCronograma(whereCond: WhereCond, out: RelObrasCronogramaDto[]) {
        const sql = `SELECT
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
            ) as dependencias
            FROM projeto
            JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
            LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = projeto.id AND tc.removido_em IS NULL
            LEFT JOIN pessoa resp ON resp.id = projeto.responsavel_id
            JOIN tarefa t ON t.tarefa_cronograma_id = tc.id AND t.removido_em IS NULL
            ${whereCond.whereString}
        `;

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
                custo_estimado: db.custo_estimado ? db.custo_estimado : null,
                inicio_real: db.inicio_real ? Date2YMD.toString(db.inicio_real) : null,
                termino_real: db.termino_real ? Date2YMD.toString(db.termino_real) : null,
                duracao_real: db.duracao_real ? db.duracao_real : null,
                percentual_concluido: db.percentual_concluido ? db.percentual_concluido : null,
                custo_real: db.custo_real ? db.custo_real : null,
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

    private async queryDataRegioes(whereCond: WhereCond, out: RelObrasRegioesDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            regiao.descricao AS descricao,
            regiao.pdm_codigo_sufixo AS sigla,
            regiao.nivel AS nivel
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_regiao ON projeto_regiao.projeto_id = projeto.id AND projeto_regiao.removido_em IS NULL
          JOIN regiao ON regiao.id = projeto_regiao.regiao_id AND regiao.removido_em IS NULL
        ${whereCond.whereString}
        `;

        const data: RetornoDbRegioes[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsRegioes(data));
    }

    private convertRowsRegioes(input: RetornoDbRegioes[]): RelObrasRegioesDto[] {
        return input.map((db) => {
            return {
                obra_id: db.projeto_id,
                subprefeitura:
                    db.nivel == 3
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
                distrito:
                    db.nivel == 4
                        ? {
                              descricao: db.descricao,
                              sigla: db.sigla,
                          }
                        : null,
            };
        });
    }

    private async queryDataFontesRecurso(whereCond: WhereCond, out: RelObrasFontesRecursoDto[]) {
        const sql = `SELECT
            projeto.id AS projeto_id,
            projeto_fonte_recurso.valor_percentual,
            projeto_fonte_recurso.valor_nominal,
            projeto_fonte_recurso.fonte_recurso_ano,
            projeto_fonte_recurso.fonte_recurso_cod_sof
        FROM projeto
           JOIN portfolio ON projeto.portfolio_id = portfolio.id
           JOIN projeto_fonte_recurso ON projeto_fonte_recurso.projeto_id = projeto.id
        ${whereCond.whereString}
        `;

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

    private async queryDataContratos(whereCond: WhereCond, out: RelObrasContratosDto[]) {
        const sql = `SELECT
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
                SELECT string_agg(contrato_sei.numero_sei::text, '|')
                FROM contrato_sei
                WHERE contrato_sei.contrato_id = contrato.id
            ) AS processos_sei,
            (
                SELECT string_agg(cod_sof::text, '|')
                FROM contrato_fonte_recurso
                WHERE contrato_id = contrato.id
            ) AS fontes_recurso
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
          LEFT JOIN orgao ON orgao.id = contrato.orgao_id AND orgao.removido_em IS NULL
          LEFT JOIN modalidade_contratacao ON contrato.modalidade_contratacao_id = modalidade_contratacao.id AND modalidade_contratacao.removido_em IS NULL
        ${whereCond.whereString}
        `;

        const data: RetornoDbContratos[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsContratos(data));
    }

    private convertRowsContratos(input: RetornoDbContratos[]): RelObrasContratosDto[] {
        return input.map((db) => {
            // Os nros SEI são concatenados por |
            // É necessário fazer o split e aplicar a máscara (formataSEI)
            // E novamente concatenar por | para manter o padrão
            const processos_sei = db.processos_sei
                ? db.processos_sei
                      .split('|')
                      .map((nro) => formataSEI(nro))
                      .join('|')
                : null;

            return {
                id: db.id,
                obra_id: db.obra_id,
                numero: db.numero,
                exclusivo: db.exclusivo,
                processos_SEI: processos_sei,
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

    private async queryDataAditivos(whereCond: WhereCond, out: RelObrasAditivosDto[]) {
        const sql = `SELECT
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
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN contrato ON contrato.projeto_id = projeto.id AND contrato.removido_em IS NULL
          JOIN contrato_aditivo ON contrato_aditivo.contrato_id = contrato.id AND contrato_aditivo.removido_em IS NULL
          JOIN tipo_aditivo ON tipo_aditivo.id = contrato_aditivo.tipo_aditivo_id AND tipo_aditivo.removido_em IS NULL
        ${whereCond.whereString}
        `;

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

    private async queryDataAcompanhamentos(whereCond: WhereCond, out: RelObrasAcompanhamentosDto[]) {
        const sql = `SELECT
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
            (
                SELECT string_agg(r.codigo::text, '|')
                FROM projeto_acompanhamento_risco ar
                JOIN projeto_risco r ON ar.projeto_risco_id = r.id AND r.removido_em IS NULL
                WHERE ar.projeto_acompanhamento_id = projeto_acompanhamento.id
            ) AS riscos
        FROM projeto
          JOIN projeto_acompanhamento ON projeto_acompanhamento.projeto_id = projeto.id AND projeto_acompanhamento.removido_em IS NULL
          LEFT JOIN projeto_acompanhamento_item ON projeto_acompanhamento_item.projeto_acompanhamento_id = projeto_acompanhamento.id AND projeto_acompanhamento_item.removido_em IS NULL
          JOIN portfolio ON projeto.portfolio_id = portfolio.id AND portfolio.removido_em IS NULL
        ${whereCond.whereString}
        `;

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
            };
        });
    }

    private async queryDataOrigens(whereCond: WhereCond, out: RelObrasOrigemDto[]) {
        const sql = `SELECT
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
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_origem ON projeto_origem.projeto_id = projeto.id AND projeto_origem.removido_em IS NULL
          LEFT JOIN meta ON meta.id = projeto_origem.meta_id AND meta.removido_em IS NULL
          LEFT JOIN iniciativa ON iniciativa.id = projeto_origem.iniciativa_id AND iniciativa.removido_em IS NULL
          LEFT JOIN atividade ON atividade.id = projeto_origem.atividade_id AND atividade.removido_em IS NULL
          LEFT JOIN pdm ON pdm.id = meta.pdm_id
        ${whereCond.whereString}
        `;

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

    private async queryDataObrasSei(whereCond: WhereCond, out: RelObrasSeiDto[]) {
        const sql = `SELECT
            projeto.id AS obra_id,
            projeto_registro_sei.categoria,
            projeto_registro_sei.processo_sei,
            projeto_registro_sei.descricao,
            projeto_registro_sei.link,
            projeto_registro_sei.comentarios,
            projeto_registro_sei.observacoes
        FROM projeto
          JOIN portfolio ON projeto.portfolio_id = portfolio.id
          JOIN projeto_registro_sei ON projeto_registro_sei.projeto_id = projeto.id AND projeto_registro_sei.removido_em IS NULL
        ${whereCond.whereString}
        `;

        const data: RetornoDbObrasSEI[] = await this.prisma.$queryRawUnsafe(sql, ...whereCond.queryParams);

        out.push(...this.convertRowsObrasSei(data));
    }

    private convertRowsObrasSei(input: RetornoDbObrasSEI[]): RelObrasSeiDto[] {
        return input.map((db) => {
            return {
                obra_id: db.obra_id,
                categoria: db.categoria,
                processo_sei: formataSEI(db.processo_sei),
                descricao: db.descricao ?? null,
                link: db.link ?? null,
                comentarios: db.comentarios ?? null,
                observacoes: db.observacoes ?? null,
            };
        });
    }

    private async queryDataObrasGeoloc(whereCond: WhereCond, out: RelObrasGeolocDto[]) {
        const sql = `
                SELECT
                    projeto.id AS projeto_id,
                    geo.endereco_exibicao AS endereco,
                    geo.geom_geojson AS geojson
                FROM projeto
                JOIN portfolio ON projeto.portfolio_id = portfolio.id
                JOIN geo_localizacao_referencia geo_r ON geo_r.projeto_id = projeto.id AND geo_r.removido_em IS NULL
                JOIN geo_localizacao geo ON geo.id = geo_r.geo_localizacao_id
                ${whereCond.whereString}
            `;

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
            const geojson = db.geojson as JSONGeo;

            return {
                obra_id: db.projeto_id,
                endereco: db.endereco,
                cep: geojson.properties.cep,
            };
        });
    }
}
