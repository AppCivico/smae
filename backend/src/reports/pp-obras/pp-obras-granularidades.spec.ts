import 'reflect-metadata';

import { getReportRowSchema, getReportRowsOptions } from '../post-process/report-column.decorator';
import {
    ehColunaDaObra,
    linhasPorObra,
    RelObrasCsvRow,
    RelObrasSimplificadoCsvRow,
} from './entities/pp-obras-csv.entity';

const obras = getReportRowSchema(RelObrasCsvRow);
const simplificado = getReportRowSchema(RelObrasSimplificadoCsvRow);

/** Linha mínima: o que a deduplicação olha, mais um marcador para distinguir as cópias. */
function linha(obraId: number, orgaoId: number | null) {
    return { obra_id: obraId, orgao_id: orgaoId };
}

describe('granularidades do relatório de obras', () => {
    it('mantém os nomes de arquivo de cada granularidade', () => {
        // O nome é contrato: entra em `config.arquivos[].arquivo` dos modelos salvos e é o que o
        // usuário vê no zip. `obras.csv` não foi renomeado, por isso não houve migration.
        expect(getReportRowsOptions(RelObrasCsvRow)!.arquivo).toBe('obras.csv');
        expect(getReportRowsOptions(RelObrasSimplificadoCsvRow)!.arquivo).toBe('obras_simplificado.csv');
    });

    it('obras_simplificado.csv é o arquivo completo sem as colunas dos joins 1:N', () => {
        // Igualdade estrutural (nome, tipo, rótulo e formatação): os dois são lidos como o mesmo
        // relatório, e um rótulo divergente entre eles seria justamente o que `copiarColunas` evita.
        expect(simplificado.colunas).toEqual(obras.colunas.filter((c) => ehColunaDaObra(c.name)));
    });

    it('remove exatamente as colunas de órgão participante e fonte de recurso', () => {
        // Lista fechada: uma coluna 1:N nova em `obras.csv` precisa entrar aqui de propósito,
        // senão o arquivo simplificado volta a ter linhas que diferem só por ela.
        const removidas = obras.colunas.filter((c) => !ehColunaDaObra(c.name)).map((c) => c.name);
        expect(removidas.sort()).toEqual(
            [
                'fonte_recurso_valor_nominal',
                'fonte_recurso_valor_pct',
                'orgao_descricao',
                'orgao_id',
                'orgao_sigla',
            ].sort()
        );
    });

    describe('linhasPorObra', () => {
        it('deixa uma linha por obra, mantendo a primeira ocorrência', () => {
            const out = linhasPorObra([linha(1, 10), linha(1, 11), linha(2, 20), linha(1, 12)]);

            expect(out.map((l) => l.obra_id)).toEqual([1, 2]);
            expect(out.map((l) => l.orgao_id)).toEqual([10, 20]);
        });

        it('preserva a ordem de chegada das obras', () => {
            const out = linhasPorObra([linha(3, 30), linha(1, 10), linha(3, 31), linha(2, 20)]);

            expect(out.map((l) => l.obra_id)).toEqual([3, 1, 2]);
        });

        it('mantém obra sem órgão participante nem fonte de recurso', () => {
            expect(linhasPorObra([linha(7, null)]).map((l) => l.obra_id)).toEqual([7]);
        });

        it('devolve lista vazia para entrada vazia', () => {
            expect(linhasPorObra([])).toEqual([]);
        });
    });
});
