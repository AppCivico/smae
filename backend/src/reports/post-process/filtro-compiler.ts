import { BadRequestException } from '@nestjs/common';
import { quoteIdent } from './csv-schema.provider';
import { RelatorioModeloFiltroDto, RelatorioModeloFiltroOp } from './dto/relatorio-modelo.dto';
import { ReportColumnDef, ReportColumnType } from './report-schema';

function litText(value: unknown): string {
    return "'" + String(value).replace(/'/g, "''") + "'";
}

/**
 * Converte um valor do modelo em literal SQL, validado contra o tipo da coluna.
 *
 * Números e booleanos são reemitidos a partir do valor já parseado (nunca por
 * interpolação de string), e datas passam por `CAST(... AS DATE)` com o texto escapado.
 * Assim nenhum trecho de entrada do usuário chega ao SQL como código.
 */
function literalPara(tipo: ReportColumnType, valor: unknown, coluna: string): string {
    if (valor === null || valor === undefined) return 'NULL';

    switch (tipo) {
        case 'BIGINT':
        case 'INTEGER': {
            const n = Number(valor);
            if (!Number.isInteger(n)) throw new BadRequestException(`Filtro inválido: ${coluna} espera inteiro.`);
            return String(n);
        }
        case 'DOUBLE':
        case 'DECIMAL(18,2)':
        case 'DECIMAL(18,4)': {
            const n = Number(valor);
            if (!Number.isFinite(n)) throw new BadRequestException(`Filtro inválido: ${coluna} espera número.`);
            return `CAST(${n} AS ${tipo})`;
        }
        case 'BOOLEAN': {
            if (typeof valor === 'boolean') return valor ? 'TRUE' : 'FALSE';
            if (valor === 'true' || valor === 'false') return valor === 'true' ? 'TRUE' : 'FALSE';
            throw new BadRequestException(`Filtro inválido: ${coluna} espera booleano.`);
        }
        case 'DATE':
        case 'TIMESTAMP': {
            const texto = String(valor);
            if (!/^\d{4}-\d{2}-\d{2}([ T][\d:.]+Z?)?$/.test(texto))
                throw new BadRequestException(`Filtro inválido: ${coluna} espera data ISO (YYYY-MM-DD).`);
            return `CAST(${litText(texto)} AS ${tipo})`;
        }
        case 'VARCHAR':
        default:
            return litText(valor);
    }
}

/**
 * Compila filtros estruturados em condições SQL.
 *
 * A coluna precisa existir no schema — nomes não são interpolados sem verificação.
 */
export function compilarFiltros(filtros: RelatorioModeloFiltroDto[], colunas: ReportColumnDef[]): string[] {
    const porNome = new Map(colunas.map((c) => [c.name, c]));

    return filtros.map((f) => {
        const def = porNome.get(f.coluna);
        if (!def) throw new BadRequestException(`Filtro inválido: coluna "${f.coluna}" não existe neste relatório.`);

        const id = quoteIdent(def.name);

        switch (f.op) {
            case RelatorioModeloFiltroOp.is_null:
                return `${id} IS NULL`;
            case RelatorioModeloFiltroOp.is_not_null:
                return `${id} IS NOT NULL`;
            case RelatorioModeloFiltroOp.eq:
                return `${id} = ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.ne:
                return `${id} IS DISTINCT FROM ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.gt:
                return `${id} > ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.gte:
                return `${id} >= ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.lt:
                return `${id} < ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.lte:
                return `${id} <= ${literalPara(def.type, f.valor, def.name)}`;
            case RelatorioModeloFiltroOp.contains:
                // ILIKE com os curingas do usuário escapados — só os nossos delimitam.
                return `${id}::VARCHAR ILIKE ${litText('%' + escapeLike(String(f.valor ?? '')) + '%')} ESCAPE '\\'`;
            case RelatorioModeloFiltroOp.starts_with:
                return `${id}::VARCHAR ILIKE ${litText(escapeLike(String(f.valor ?? '')) + '%')} ESCAPE '\\'`;
            case RelatorioModeloFiltroOp.in: {
                const valores = f.valores ?? [];
                if (!valores.length) throw new BadRequestException(`Filtro inválido: "${f.coluna}" com lista vazia.`);
                const lista = valores.map((v) => literalPara(def.type, v, def.name)).join(', ');
                return `${id} IN (${lista})`;
            }
            default:
                f.op satisfies never;
                throw new BadRequestException(`Operador de filtro não suportado.`);
        }
    });
}

function escapeLike(value: string): string {
    return value.replace(/[\\%_]/g, (m) => '\\' + m);
}
