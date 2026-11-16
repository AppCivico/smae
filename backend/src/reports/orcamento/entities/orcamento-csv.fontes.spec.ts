import 'reflect-metadata';
import { FonteRelatorio } from '@prisma/client';
import { getReportRowColumnsDaFonte, getReportRowSchema } from '../../post-process/report-column.decorator';
import { RelOrcamentoExecutadoCsvRow, RelOrcamentoPlanejadoCsvRow } from './orcamento-csv.entity';

/**
 * As classes do orçamento são compartilhadas por PS, Projetos e Obras. A listagem por fonte (que
 * alimenta o seletor de colunas dos modelos) não pode vazar colunas de uma variante para a fonte
 * que nunca as produz — era o bug "no MDO aparecem colunas de outro módulo".
 */
const PDM = ['meta__codigo', 'meta__titulo', 'meta__id', 'iniciativa__id', 'atividade__id'];
const PROJETO = ['projeto__codigo', 'projeto__nome', 'projeto__id'];

describe.each([RelOrcamentoExecutadoCsvRow, RelOrcamentoPlanejadoCsvRow])('colunas por fonte de %p', (cls) => {
    const nomes = (fonte: FonteRelatorio) => getReportRowColumnsDaFonte(cls, fonte).map((c) => c.propriedade);

    it.each(['ObrasOrcamento', 'ProjetoOrcamento'] as FonteRelatorio[])(
        '%s não lista meta/iniciativa/atividade',
        (f) => {
            expect(nomes(f)).not.toEqual(
                expect.arrayContaining([expect.stringMatching(/^(meta|iniciativa|atividade)__/)])
            );
            expect(nomes(f)).toEqual(expect.arrayContaining(PROJETO));
        }
    );

    it('PSOrcamento não lista projeto', () => {
        expect(nomes('PSOrcamento')).toEqual(expect.arrayContaining(PDM));
        expect(nomes('PSOrcamento').filter((n) => n.startsWith('projeto__'))).toEqual([]);
    });

    it('o schema de execução continua com o superconjunto', () => {
        const todas = getReportRowSchema(cls).colunas.map((c) => c.name);
        expect(todas).toEqual(expect.arrayContaining([...PDM, ...PROJETO]));
    });
});
