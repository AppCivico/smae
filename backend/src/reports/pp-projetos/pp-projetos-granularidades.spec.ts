import 'reflect-metadata';

import { getReportRowSchema, getReportRowsOptions } from '../post-process/report-column.decorator';
import {
    ehColunaDoProjeto,
    linhasPorProjeto,
    RelProjetosCsvRow,
    RelProjetosSimplificadoCsvRow,
} from './entities/pp-projetos-csv.entity';

const projetos = getReportRowSchema(RelProjetosCsvRow);
const simplificado = getReportRowSchema(RelProjetosSimplificadoCsvRow);

/** Linha mínima: o que a deduplicação olha, mais um marcador para distinguir as cópias. */
function linha(id: number, premissaId: number | null) {
    return { id, premissa: premissaId === null ? null : { id: premissaId } };
}

describe('granularidades do relatório de projetos', () => {
    it('mantém os nomes de arquivo de cada granularidade', () => {
        // O nome entra em `config.arquivos[].arquivo` dos modelos salvos.
        expect(getReportRowsOptions(RelProjetosCsvRow)!.arquivo).toBe('projetos.csv');
        expect(getReportRowsOptions(RelProjetosSimplificadoCsvRow)!.arquivo).toBe('projetos_simplificado.csv');
    });

    it('projetos_simplificado.csv é o arquivo completo sem as colunas dos joins 1:N', () => {
        expect(simplificado.colunas).toEqual(projetos.colunas.filter((c) => ehColunaDoProjeto(c.name)));
    });

    it('remove exatamente as colunas de órgão participante, premissa, restrição e fonte de recurso', () => {
        const removidas = projetos.colunas.filter((c) => !ehColunaDoProjeto(c.name)).map((c) => c.name);
        expect(removidas.sort()).toEqual(
            [
                'orgao_participante__id',
                'orgao_participante__sigla',
                'orgao_participante__descricao',
                'premissa__id',
                'premissa__premissa',
                'restricao__id',
                'restricao__restricao',
                'fonte_recurso__id',
                'fonte_recurso__nome',
                'fonte_recurso__fonte_recurso_cod_sof',
                'fonte_recurso__fonte_recurso_ano',
                'fonte_recurso__valor_percentual',
                'fonte_recurso__valor_nominal',
            ].sort()
        );
    });

    describe('linhasPorProjeto', () => {
        it('deixa uma linha por projeto, mantendo a primeira ocorrência', () => {
            const out = linhasPorProjeto([linha(1, 10), linha(1, 11), linha(2, 20), linha(1, 12)]);

            expect(out.map((l) => l.id)).toEqual([1, 2]);
            expect(out.map((l) => l.premissa?.id)).toEqual([10, 20]);
        });

        it('preserva a ordem de chegada dos projetos', () => {
            const out = linhasPorProjeto([linha(3, 30), linha(1, 10), linha(3, 31), linha(2, 20)]);

            expect(out.map((l) => l.id)).toEqual([3, 1, 2]);
        });

        it('mantém projeto sem nenhum vínculo 1:N', () => {
            expect(linhasPorProjeto([linha(7, null)]).map((l) => l.id)).toEqual([7]);
        });

        it('devolve lista vazia para entrada vazia', () => {
            expect(linhasPorProjeto([])).toEqual([]);
        });
    });
});
