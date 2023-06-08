import { utils } from "xlsx";

// digitar tudo em lowercase
// o espaço no excel tbm é ignorado e vira _ depois do trim
export const ColunasNecessarias = [
    'ano',
    'mes', // caso especial, aceita mês lá no decode do header
    'valor_empenho',
    'valor_liquidado',
];

export const OutrasColumns = [
    'dotacao',
    'meta_id',
    'atividade_id',
    'iniciativa_id',
    'meta_codigo',
    'atividade_codigo',
    'iniciativa_codigo',
    'projeto_id',
    'projeto_codigo',
    'processo',
    'nota_empenho',
];

export class OrcamentoImportacaoHelpers {

    static createColumnHeaderIndex(sheet: any, columns: string[]): { [key: string]: number } {
        const index: { [key: string]: number } = {};
        const primeiraLinhaRange = utils.decode_range(sheet['!ref']);

        // s = start cell
        // e = ending cell
        // _.c = (start/end) column-number
        columns.forEach((columnName) => {
            for (let colIndex = primeiraLinhaRange.s.c; colIndex <= primeiraLinhaRange.e.c; colIndex++) {
                const position = utils.encode_cell({ c: colIndex, r: primeiraLinhaRange.s.r });
                let cellValue = sheet[position]?.v.trim().toLowerCase() as string | undefined;

                if (cellValue !== undefined) {
                    cellValue = cellValue.replace(/\s/g, '_');
                    cellValue = cellValue.replace(/c[óo]d$/g, 'codigo');
                    cellValue = cellValue.replace(/código/g, 'codigo');

                    if (
                        cellValue === columnName ||
                        (cellValue === 'mês' && columnName === 'mes')
                    ) {
                        index[columnName] = colIndex;
                        break;
                    }
                }
            }
        });

        return index;
    }
}
