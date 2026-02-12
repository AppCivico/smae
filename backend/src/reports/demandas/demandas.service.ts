import { Injectable } from '@nestjs/common';
import { Date2YMD } from 'src/common/date2ymd';
import { CsvWriterOptions, WriteCsvToFile } from 'src/common/helpers/CsvWriter';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportContext } from '../relatorios/helpers/reports.contexto';
import {
    DefaultCsvOptions,
    DefaultTransforms,
    FileOutput,
    Path2FileName,
    ReportableService,
} from '../utils/utils.service';
import { CreateRelDemandasDto } from './dto/create-demandas.dto';
import { DemandasRelatorioDto, RelDemandasDto, RelDemandasEnderecosDto } from './entities/demandas.entity';

type WhereCond = {
    whereString: string;
    queryParams: any[];
};

class RetornoDbDemandas {
    id: number;
    versao: number;
    status: string;
    data_registro: Date;
    data_publicado: Date | null;
    orgao_nome_exibicao: string;
    unidade_responsavel: string;
    nome_responsavel: string;
    cargo_responsavel: string;
    email_responsavel: string;
    telefone_responsavel: string;
    nome_projeto: string;
    descricao: string;
    justificativa: string;
    valor: number;
    finalidade: string;
    observacao: string | null;
    area_tematica_nome: string;
    acoes_concatenadas: string | null;
}

class RetornoDbEnderecos {
    demanda_id: number;
    nome_projeto: string;
    cep: string | null;
    endereco: string | null;
    bairro: string | null;
    subprefeitura: string | null;
    distrito: string | null;
}

@Injectable()
export class DemandasService implements ReportableService {
    constructor(private readonly prisma: PrismaService) {}

    async asJSON(dto: CreateRelDemandasDto, user: PessoaFromJwt | null = null): Promise<DemandasRelatorioDto> {
        const whereCond = await this.buildFilteredWhereStr(dto, user);
        const out_demandas: RelDemandasDto[] = [];
        const out_enderecos: RelDemandasEnderecosDto[] = [];

        const sql = `
            WITH acoes_agg AS (
                SELECT
                    da.demanda_id,
                    STRING_AGG(a.nome, ', ' ORDER BY a.nome) AS acoes_concatenadas
                FROM demanda_acao da
                JOIN acao a ON a.id = da.acao_id AND a.removido_em IS NULL
                WHERE da.removido_em IS NULL
                GROUP BY da.demanda_id
            )
            SELECT
                d.id,
                d.versao,
                d.status::text AS status,
                d.data_registro,
                d.data_publicado,
                o.descricao AS orgao_nome_exibicao,
                d.unidade_responsavel,
                d.nome_responsavel,
                d.cargo_responsavel,
                d.email_responsavel,
                d.telefone_responsavel,
                d.nome_projeto,
                d.descricao,
                d.justificativa,
                d.valor,
                d.finalidade::text AS finalidade,
                d.observacao,
                at.nome AS area_tematica_nome,
                acoes.acoes_concatenadas
            FROM demanda d
            JOIN orgao o ON o.id = d.orgao_id
            JOIN area_tematica at ON at.id = d.area_tematica_id
            LEFT JOIN acoes_agg acoes ON acoes.demanda_id = d.id
            ${whereCond.whereString}
            ORDER BY d.data_registro DESC, d.id
        `;

        const rows = await this.prisma.$queryRawUnsafe<RetornoDbDemandas[]>(sql, ...whereCond.queryParams);

        this.convertRowsDemandasInto(rows, out_demandas);

        // Buscar endereços separadamente
        const whereEnderecosString = whereCond.whereString
            ? whereCond.whereString + ' AND glr.demanda_id IS NOT NULL AND glr.removido_em IS NULL'
            : 'WHERE glr.demanda_id IS NOT NULL AND glr.removido_em IS NULL';

        const sqlEnderecos = `
            SELECT
                glr.demanda_id,
                d.nome_projeto,
                CASE 
                    WHEN glr.tipo = 'Endereco' AND g.geom_geojson->'properties'->>'cep' IS NOT NULL 
                    THEN g.geom_geojson->'properties'->>'cep' 
                END AS cep,
                CASE 
                    WHEN glr.tipo = 'Endereco' AND g.geom_geojson->'properties'->>'rua' IS NOT NULL 
                    THEN g.geom_geojson->'properties'->>'rua' 
                END AS endereco,
                CASE 
                    WHEN glr.tipo = 'Endereco' AND g.geom_geojson->'properties'->>'bairro' IS NOT NULL 
                    THEN g.geom_geojson->'properties'->>'bairro' 
                END AS bairro,
                (
                    SELECT STRING_AGG(DISTINCT r.descricao, ', ' ORDER BY r.descricao)
                    FROM UNNEST(g.calc_regioes_nivel_3) AS regiao_id
                    JOIN regiao r ON r.id = regiao_id AND r.nivel = 3
                ) AS subprefeitura,
                (
                    SELECT STRING_AGG(DISTINCT r.descricao, ', ' ORDER BY r.descricao)
                    FROM UNNEST(g.calc_regioes_nivel_4) AS regiao_id
                    JOIN regiao r ON r.id = regiao_id AND r.nivel = 4
                ) AS distrito
            FROM geo_localizacao_referencia glr
            LEFT JOIN geo_localizacao g ON g.id = glr.geo_localizacao_id
            JOIN demanda d ON d.id = glr.demanda_id
            ${whereEnderecosString}
            ORDER BY d.nome_projeto, glr.id
        `;

        const rowsEnderecos = await this.prisma.$queryRawUnsafe<RetornoDbEnderecos[]>(
            sqlEnderecos,
            ...whereCond.queryParams
        );

        this.convertRowsEnderecosInto(rowsEnderecos, out_enderecos);

        return {
            linhas: out_demandas,
            enderecos: out_enderecos,
        };
    }

    private async buildFilteredWhereStr(filters: CreateRelDemandasDto, user: PessoaFromJwt | null): Promise<WhereCond> {
        const whereConditions: string[] = [];
        const queryParams: any[] = [];

        let paramIndex = 1;

        // Regra de permissão: Gestor Municipal só vê registros do seu órgão
        // SERI (com role CadastroDemanda.validar) vê todos
        if (user && !user.hasSomeRoles(['CadastroDemanda.validar'])) {
            // Gestor Municipal - apenas do seu órgão
            if (user.orgao_id) {
                whereConditions.push(`d.orgao_id = $${paramIndex}`);
                queryParams.push(user.orgao_id);
                paramIndex++;
            }
        }

        if (filters.status && filters.status.length > 0) {
            const statusPlaceholders = filters.status.map(() => `$${paramIndex++}`).join(', ');
            whereConditions.push(`d.status::text IN (${statusPlaceholders})`);
            queryParams.push(...filters.status.map((s) => s.toString()));
        }

        if (filters.data_registro_inicio) {
            whereConditions.push(`d.data_registro >= $${paramIndex}::timestamptz`);
            queryParams.push(filters.data_registro_inicio);
            paramIndex++;
        }

        if (filters.data_registro_fim) {
            whereConditions.push(`d.data_registro <= $${paramIndex}::timestamptz`);
            queryParams.push(filters.data_registro_fim);
            paramIndex++;
        }

        if (filters.orgao_id) {
            whereConditions.push(`d.orgao_id = $${paramIndex}`);
            queryParams.push(filters.orgao_id);
            paramIndex++;
        }

        if (filters.area_tematica_id) {
            whereConditions.push(`d.area_tematica_id = $${paramIndex}`);
            queryParams.push(filters.area_tematica_id);
            paramIndex++;
        }

        whereConditions.push(`d.removido_em IS NULL`);

        const whereString = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        return { whereString, queryParams };
    }

    private formatExcelString(value: string | null | undefined): string {
        return value !== null && value !== undefined ? `="${String(value).replace(/"/g, '""')}"` : '';
    }

    private formatCurrency(value: number | null): string {
        return value != null
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            : '';
    }

    private convertRowsDemandasInto(input: RetornoDbDemandas[], out: RelDemandasDto[]) {
        for (const db of input) {
            out.push({
                id: db.id,
                status: db.status as any,
                data_registro: Date2YMD.toStringOrNull(db.data_registro) ?? '',
                data_publicado: Date2YMD.toStringOrNull(db.data_publicado),
                orgao_gestor: this.formatExcelString(db.orgao_nome_exibicao),
                unidade_responsavel: this.formatExcelString(db.unidade_responsavel),
                nome_responsavel: this.formatExcelString(db.nome_responsavel),
                cargo_responsavel: this.formatExcelString(db.cargo_responsavel),
                email_responsavel: this.formatExcelString(db.email_responsavel),
                telefone_responsavel: this.formatExcelString(db.telefone_responsavel),
                nome_projeto: this.formatExcelString(db.nome_projeto),
                descricao: this.formatExcelString(db.descricao),
                justificativa: this.formatExcelString(db.justificativa),
                valor: db.valor,
                finalidade: db.finalidade as any,
                observacao: this.formatExcelString(db.observacao),
                area_tematica: this.formatExcelString(db.area_tematica_nome),
                acoes: this.formatExcelString(db.acoes_concatenadas),
            });
        }
    }

    private convertRowsEnderecosInto(input: RetornoDbEnderecos[], out: RelDemandasEnderecosDto[]) {
        for (const db of input) {
            out.push({
                demanda_id: db.demanda_id,
                nome_projeto: this.formatExcelString(db.nome_projeto),
                cep: this.formatExcelString(db.cep),
                endereco: this.formatExcelString(db.endereco),
                bairro: this.formatExcelString(db.bairro),
                subprefeitura: this.formatExcelString(db.subprefeitura),
                distrito: this.formatExcelString(db.distrito),
            });
        }
    }

    async toFileOutput(
        params: CreateRelDemandasDto,
        _ctx: ReportContext,
        user: PessoaFromJwt | null = null
    ): Promise<FileOutput[]> {
        const dados = await this.asJSON(params, user);
        await _ctx.resumoSaida('Demandas', dados.linhas.length);

        const out: FileOutput[] = [];

        const fields = [
            { value: 'id', label: 'ID' },
            { value: 'status', label: 'Status' },
            { value: 'data_registro', label: 'Data de Registro' },
            { value: 'data_publicado', label: 'Data de Publicação' },
            { value: 'orgao_gestor', label: 'Gestor Municipal' },
            { value: 'unidade_responsavel', label: 'Unidade Responsável' },
            { value: 'nome_responsavel', label: 'Nome do Responsável' },
            { value: 'cargo_responsavel', label: 'Cargo do Responsável' },
            { value: 'email_responsavel', label: 'E-mail do Responsável' },
            { value: 'telefone_responsavel', label: 'Telefone do Responsável' },
            { value: 'nome_projeto', label: 'Nome do Projeto' },
            { value: 'descricao', label: 'Descrição' },
            { value: 'justificativa', label: 'Justificativa' },
            {
                value: (row: RelDemandasDto) => this.formatCurrency(row.valor),
                label: 'Valor',
            },
            { value: 'finalidade', label: 'Finalidade' },
            { value: 'observacao', label: 'Observação' },
            { value: 'area_tematica', label: 'Área Temática' },
            { value: 'acoes', label: 'Ação' },
            { value: 'localizacao', label: 'Localização' },
        ];

        const tmpFile = _ctx.getTmpFile('demandas.csv');
        const csvOpts: CsvWriterOptions<RelDemandasDto> = {
            csvOptions: DefaultCsvOptions,
            transforms: DefaultTransforms,
            fields,
        };
        await WriteCsvToFile(dados.linhas, tmpFile.stream, csvOpts);
        out.push({ name: 'demandas.csv', localFile: tmpFile.path });

        // Gerar planilha de endereços
        if (dados.enderecos.length > 0) {
            const fieldsEnderecos = [
                { value: 'demanda_id', label: 'ID da Demanda' },
                { value: 'nome_projeto', label: 'Nome do Projeto' },
                { value: 'cep', label: 'CEP' },
                { value: 'endereco', label: 'Endereço' },
                { value: 'bairro', label: 'Bairro' },
                { value: 'subprefeitura', label: 'Subprefeitura' },
                { value: 'distrito', label: 'Distrito' },
            ];

            const tmpFileEnderecos = _ctx.getTmpFile('enderecos.csv');
            const csvOptsEnderecos: CsvWriterOptions<RelDemandasEnderecosDto> = {
                csvOptions: DefaultCsvOptions,
                transforms: DefaultTransforms,
                fields: fieldsEnderecos,
            };
            await WriteCsvToFile(dados.enderecos, tmpFileEnderecos.stream, csvOptsEnderecos);
            out.push({ name: 'enderecos.csv', localFile: tmpFileEnderecos.path });
        }

        return out;
    }

    getClassFileName(): string {
        return Path2FileName(__filename);
    }
}
