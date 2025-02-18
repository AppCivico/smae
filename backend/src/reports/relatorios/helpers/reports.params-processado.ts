import { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReportDto } from '../dto/create-report.dto';
import { RelatorioParamDto } from '../entities/report.entity';
import { FonteRelatorio } from '@prisma/client';
type RelatorioProcesado = Record<string, string | Array<string>>;

function nomeTabelaColParametro(nomeChave: string): { tabela: string; coluna: string } | undefined {
    const tabelaConfig: Record<string, { coluna: string; chaves?: string[] }> = {
        projeto: { coluna: 'nome' },
        pdm: { coluna: 'nome', chaves: ['plano_setorial'] },
        transferencia_tipo: { coluna: 'nome', chaves: ['tipo'] },
        parlamentar: { coluna: 'nome_popular' },
        tag: { coluna: 'descricao', chaves: ['tags'] },
        meta: { coluna: 'titulo', chaves: ['metas'] },
        atividade: { coluna: 'titulo' },
        iniciativa: { coluna: 'titulo' },
        orgao: { coluna: 'sigla', chaves: ['orgaos', 'orgao_gestor'] },
        portfolio: { coluna: 'titulo' },
        indicador: { coluna: 'titulo' },
        partido: { coluna: 'nome' },
        regiao: { coluna: 'descricao', chaves: ['regioes'] },
    };

    const mapeamento = Object.entries(tabelaConfig).reduce(
        (acc, [tabela, config]) => {
            // Adiciona o próprio da tabela no mapeamento
            acc[tabela] = { tabela, coluna: config.coluna };

            if (config.chaves) {
                config.chaves.forEach((chave) => {
                    acc[chave] = { tabela, coluna: config.coluna };
                });
            }
            return acc;
        },
        {} as Record<string, { tabela: string; coluna: string }>
    );

    return mapeamento[nomeChave];
}

export const ParseBffParamsProcessados = (parametros: any, _fonte: FonteRelatorio): RelatorioParamDto[] | null => {
    let ret: RelatorioParamDto[] | null = null;

    if (!parametros || typeof parametros !== 'object') return null;

    const keys = Object.keys(parametros).sort();
    if (keys.length === 0) return [];

    const chavesExistentes = new Set<string>();
    ret = [];
    for (const k of keys) {
        const v = parametros[k];
        if (v === '') continue;
        const str = k.charAt(0).toUpperCase() + k.slice(1);
        str.replace(/_/g, ' ');

        if (chavesExistentes.has(k)) continue;
        chavesExistentes.add(k);
        chavesExistentes.add(k + '_nome'); // hack: pula alguns itens que ficaram salvos com o "_nome" já no input

        ret.push({
            filtro: str,
            valor: Array.isArray(v) ? v.map((r) => r.toString()) : v.toString(),
        });
    }

    return ret;
};

export const BuildParametrosProcessados = async (
    prisma: PrismaService,
    dto?: CreateReportDto,
    reportId?: number
): Promise<InputJsonValue | undefined> => {
    let parametros;
    const parametros_processados: RelatorioProcesado = {};

    // Caso esteja passando ID de report, é porque a chamada é de sync.
    if (reportId) {
        const report = await prisma.relatorio.findUnique({
            where: {
                id: reportId,
                removido_em: null,
            },
            select: {
                parametros: true,
                parametros_processados: true,
            },
        });
        if (!report) return undefined;

        if (!report.parametros) return undefined;
        if (report.parametros_processados && report.parametros_processados.toString().length > 0)
            return report.parametros_processados;

        parametros = report.parametros;
    } else {
        if (!dto) return undefined;

        parametros = dto.parametros;
    }

    for (const paramKey of Object.keys(parametros)) {
        const valor = parametros[paramKey];
        if (!valor) continue;

        const nomeChave = paramKey
            .replace(/(_id|_ids)$/, '') // remove _id ou _ids
            .replace('plano_setorial_id', 'pdm_id'); // ajuste para pdm_id

        parametros_processados[nomeChave] = valor.toString();

        const nomeTabelaCol = nomeTabelaColParametro(nomeChave);
        if (!nomeTabelaCol) continue;

        if (typeof valor === 'number') {
            const query = `SELECT COALESCE(${nomeTabelaCol.coluna}, '') AS nome, removido_em FROM ${nomeTabelaCol.tabela} WHERE id = ${valor}`;
            const rowNome = await prisma.$queryRawUnsafe<Array<{ nome: string; removido_em: Date | undefined }>>(query);
            if (rowNome.length > 0) {
                parametros_processados[nomeChave] = rowNome[0].removido_em
                    ? '(Removido) ' + rowNome[0].nome
                    : rowNome[0].nome;
            }
        } else if (Array.isArray(valor)) {
            if (valor.length === 0) continue;

            const joinedValues = valor.join(',');
            // str must match \d,? pattern
            if (/^\d+(,\d+)*$/.test(joinedValues) === false) continue;

            const query = `SELECT id as id, COALESCE(${nomeTabelaCol.coluna}, '') AS nome, removido_em
                    FROM ${nomeTabelaCol.tabela} WHERE id IN (${joinedValues})`;
            const rowNome =
                await prisma.$queryRawUnsafe<Array<{ id: Number; nome: string; removido_em: Date | undefined }>>(query);

            if (rowNome.length > 0) {
                parametros_processados[nomeChave] = rowNome
                    .map((r) => {
                        return r.removido_em ? '(Removido) ' + r.nome : r.nome;
                    })
                    .sort();
            }
        }
    }

    return parametros_processados;
};
