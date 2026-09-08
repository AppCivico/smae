import 'reflect-metadata';

import { getReportRowSchema, getReportRowsOptions } from '../post-process/report-column.decorator';
import {
    ehColunaDeTransferencia,
    linhasPorTransferencia,
    RelTransferenciasCsvRow,
    RelTransferenciasEDistribuicaoCsvRow,
} from './entities/transferencias-csv.entity';

const transferencias = getReportRowSchema(RelTransferenciasCsvRow);
const comDistribuicao = getReportRowSchema(RelTransferenciasEDistribuicaoCsvRow);

/** Linha mínima: o que a deduplicação olha, mais um marcador para distinguir as cópias. */
function linha(id: number, distribuicaoId: number) {
    return { id, distribuicao_recurso__id: distribuicaoId };
}

describe('granularidades do relatório de transferências', () => {
    it('mantém os nomes de arquivo de cada granularidade', () => {
        // O nome é contrato: entra em `config.arquivos[].arquivo` dos modelos salvos (e uma
        // migration reapontou os antigos) e é o que o usuário vê no zip. Trocar de dono de novo
        // sem migration repetiria o problema que a inversão resolveu.
        expect(getReportRowsOptions(RelTransferenciasCsvRow)!.arquivo).toBe('transferencias.csv');
        expect(getReportRowsOptions(RelTransferenciasEDistribuicaoCsvRow)!.arquivo).toBe(
            'transferencias_e_distribuicao.csv'
        );
    });

    it('transferencias.csv é o arquivo completo sem as colunas de distribuição', () => {
        // Igualdade estrutural (nome, tipo, rótulo e formatação), não só de nomes: os dois são
        // lidos como o mesmo relatório, e um rótulo divergente entre eles já seria a duplicação
        // de verdade que `copiarColunas` evita.
        expect(transferencias.colunas).toEqual(comDistribuicao.colunas.filter((c) => ehColunaDeTransferencia(c.name)));
    });

    it('transferencias.csv não traz nenhuma coluna de distribuição', () => {
        expect(transferencias.colunas.filter((c) => !ehColunaDeTransferencia(c.name))).toEqual([]);
    });

    it('recorta de fato — o arquivo completo tem colunas de distribuição', () => {
        // Guarda contra o teste acima passar por vacuidade, caso o prefixo mude na fonte.
        expect(comDistribuicao.colunas.some((c) => !ehColunaDeTransferencia(c.name))).toBe(true);
    });

    describe('linhasPorTransferencia', () => {
        it('deixa uma linha por transferência, mantendo a primeira ocorrência', () => {
            const out = linhasPorTransferencia([linha(1, 10), linha(1, 11), linha(2, 20), linha(1, 12)]);

            expect(out.map((l) => l.id)).toEqual([1, 2]);
            expect(out.map((l) => l.distribuicao_recurso__id)).toEqual([10, 20]);
        });

        it('preserva a ordem de chegada das transferências', () => {
            const out = linhasPorTransferencia([linha(3, 30), linha(1, 10), linha(3, 31), linha(2, 20)]);

            expect(out.map((l) => l.id)).toEqual([3, 1, 2]);
        });

        it('mantém transferência sem distribuição', () => {
            expect(linhasPorTransferencia([{ id: 7, distribuicao_recurso__id: null }]).map((l) => l.id)).toEqual([7]);
        });

        it('devolve lista vazia para entrada vazia', () => {
            expect(linhasPorTransferencia([])).toEqual([]);
        });
    });
});
