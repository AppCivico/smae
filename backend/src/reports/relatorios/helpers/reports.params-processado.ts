import { InputJsonValue } from '@prisma/client/runtime/library';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReportDto } from '../dto/create-report.dto';
import { RelatorioParamDto } from '../entities/report.entity';
import { FonteRelatorio, ParlamentarCargo, TipoRelatorio } from '@prisma/client';
import { EnumHumano } from 'src/reports/utils/utils.service';
import { InternalServerErrorException } from '@nestjs/common';
type RelatorioProcesado = Record<string, string | Array<string>>;

// Mapeamento de enums por valor
const enumMap: Record<string, typeof ParlamentarCargo | typeof TipoRelatorio> = {
    cargo: ParlamentarCargo,
    tipo: TipoRelatorio,
};

function nomeTabelaColParametro(
    nomeChave: string
): { tabela: string; coluna: string; chave_exibicao?: string } | undefined {
    const tabelaConfig: Record<string, { coluna: string; chaves?: string[]; chave_exibicao?: string[] }> = {
        projeto: { coluna: 'nome' },
        pdm: { coluna: 'nome', chaves: ['plano_setorial'], chave_exibicao: ['PdM'] },
        transferencia_tipo: { coluna: 'nome', chaves: ['tipo'] },
        parlamentar: { coluna: 'nome_popular' },
        tag: { coluna: 'descricao', chaves: ['tags'] },
        meta: { coluna: 'titulo', chaves: ['metas'] },
        atividade: { coluna: 'titulo' },
        iniciativa: { coluna: 'titulo' },
        orgao: {
            coluna: 'sigla',
            chaves: ['orgaos', 'orgao_gestor', 'orgao_responsavel', 'orgao_concedente'],
            chave_exibicao: ['Órgãos', 'Órgão gestor', 'Órgão responsável', 'Órgão concedente'],
        },
        portfolio: { coluna: 'titulo' },
        indicador: { coluna: 'titulo' },
        partido: { coluna: 'nome' },
        regiao: { coluna: 'descricao', chaves: ['regioes'] },
        eleicao: { coluna: 'ano' },
        // hack, passa o mesmo nome como chave pra conseguir setar a chave de exibição
        grupo_tematico: { coluna: 'nome', chaves: ['grupo_tematico'], chave_exibicao: ['Grupo Temático'] },
    };

    const mapeamento = Object.entries(tabelaConfig).reduce(
        (acc, [tabela, config]) => {
            // Adiciona o próprio da tabela no mapeamento
            acc[tabela] = {
                tabela,
                coluna: config.coluna,
            };

            if (config.chaves) {
                config.chaves.forEach((chave, idx) => {
                    acc[chave] = {
                        tabela,
                        coluna: config.coluna,
                        chave_exibicao: config.chave_exibicao ? config.chave_exibicao[idx] : undefined,
                    };
                });
            }

            // Caso a config possua chave_exibicao, o tamanho do array deve ser igual ao de chaves
            if (config.chave_exibicao && config.chave_exibicao.length !== config.chaves!.length) {
                throw new InternalServerErrorException(
                    `O array chave_exibicao de ${tabela} deve ter o mesmo tamanho de chaves.`
                );
            }

            return acc;
        },
        {} as Record<string, { tabela: string; coluna: string; chave_exibicao?: string }>
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
        if (report.parametros_processados && report.parametros_processados.valueOf())
            return report.parametros_processados.valueOf() as InputJsonValue;

        parametros = report.parametros;
    } else {
        if (!dto) return undefined;

        parametros = dto.parametros;
    }

    for (const paramKey of Object.keys(parametros)) {
        // "eh_publico" é um param deprecated, mas como algumas linhas ainda podem ter ele, vamos ignorar.
        if (paramKey === 'eh_publico') continue;

        let valor = parametros[paramKey];
        if (!valor) continue;

        let nomeChave = paramKey
            .replace(/(_id|_ids)$/, '') // remove _id ou _ids
            .replace('plano_setorial_id', 'pdm_id') // ajuste para pdm_id

            // Tratamentos específicos
            .replace('listar_variaveis_regionalizadas', 'Listar variáveis regionalizadas')
            .replace('ano_inicio', 'Ano início')
            .replace('ano_fim', 'Ano fim')
            .replace('data_inicio', 'Data início')
            .replace('data_termino', 'Data término')
            .replace(/\bmes\b/gi, 'Mês')
            .replace('periodo', 'Período');

        parametros_processados[nomeChave] = valor.toString();

        // Verifica se o valor possui um mapeamento para tabela e coluna.
        const nomeTabelaCol = nomeTabelaColParametro(nomeChave);

        if (!nomeTabelaCol) {
            // Trocando _ por espaços, pois se caiu aqui não é ID
            delete parametros_processados[nomeChave];
            nomeChave = nomeChave.replace(/_/g, ' ');
            parametros_processados[nomeChave] = valor;

            // Pode ser um enum e necessita de tradução.
            const enumMapKey = enumMap[nomeChave];
            if (enumMapKey) {
                valor = EnumHumano(enumMapKey, valor);
                parametros_processados[nomeChave] = valor;
                continue;
            }

            // Pode ser um boolean e necessita de tradução.
            if (typeof valor === 'boolean') {
                parametros_processados[nomeChave] = valor ? 'Sim' : 'Não';
            }

            // Pode ser uma data
            // Valores de data, nos DTOs são Dates, mas no banco são strings.
            if (typeof valor == 'string' && valor.match(/^\d{4}-\d{2}-\d{2}/)) {
                // Caso o valor se pareça com uma data, precisamos verificar se é possui algo como "T00:00:00.000Z"
                // e remover para apresentar apenas a data.
                // O valor enviado pelo front segue o seguinte padrão: "2025-12-31T00:00:00.000Z"
                valor = valor.split('T')[0]; // Pega apenas a parte da data
                parametros_processados[nomeChave] = valor;
                continue;
            } else if (valor instanceof Date) {
                // Tratando data que é Date
                valor = valor.toISOString().split('T')[0];
                parametros_processados[nomeChave] = valor;
            }

            continue;
        }

        // Caso o resultado da func nomeTabelaCol possua chave_exibicao, substitui o nomeChave
        if (nomeTabelaCol.chave_exibicao) {
            delete parametros_processados[nomeChave];
            nomeChave = nomeTabelaCol.chave_exibicao;
            parametros_processados[nomeChave] = valor;
        }

        // Aqui são tratados valores que são IDs de tabelas, ou seja, são números ou arrays de números.
        if (typeof valor === 'number' && nomeTabelaCol) {
            if (valor === 0) {
                // TODO: esse comportamento aqui é ruim, alinhar com os fronts para mapear quando eles estão enviado 0 e tratar no front.
                delete parametros_processados[nomeChave];
                continue;
            }

            const query = `SELECT COALESCE(${nomeTabelaCol.coluna}::text, '') AS nome, removido_em FROM ${nomeTabelaCol.tabela} WHERE id = ${valor}`;
            const rowNome = await prisma.$queryRawUnsafe<Array<{ nome: string; removido_em: Date | undefined }>>(query);
            if (rowNome.length > 0) {
                parametros_processados[nomeChave] = rowNome[0].removido_em
                    ? '(Removido) ' + rowNome[0].nome
                    : rowNome[0].nome;
            }
        } else if (Array.isArray(valor) && nomeTabelaCol) {
            // Removendo valores null
            valor = valor.filter((v: any) => v !== null);

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
