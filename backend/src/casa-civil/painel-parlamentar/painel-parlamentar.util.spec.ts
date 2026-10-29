import { Decimal } from 'decimal.js';
import { agruparTopN, calcFaseStatus, calcPct, calcPctParlamentarDistribuicao } from './painel-parlamentar.util';

const linha = (rotulo: string, valor: string) => ({ item: { sigla: rotulo }, rotulo, valor: new Decimal(valor) });

describe('painel-parlamentar.util', () => {
    describe('calcPct', () => {
        it('devolve 0 quando o denominador é zero', () => {
            expect(calcPct(new Decimal(100), new Decimal(0))).toBe(0);
            expect(calcPct(new Decimal(0), new Decimal(0))).toBe(0);
        });

        it('arredonda para 2 casas', () => {
            expect(calcPct(new Decimal(1), new Decimal(3))).toBe(33.33);
            expect(calcPct(new Decimal(2), new Decimal(3))).toBe(66.67);
        });

        it('não compara como string: 9.99 de 10.1 não passa de 100%', () => {
            expect(calcPct(new Decimal('9.99'), new Decimal('10.1'))).toBe(98.91);
        });
    });

    describe('agruparTopN', () => {
        it('sem sobra, não cria a linha "Outros"', () => {
            const r = agruparTopN([linha('A', '10'), linha('B', '30')], 5);

            expect(r.map((l) => l.rotulo)).toEqual(['B', 'A']);
            expect(r.some((l) => l.outros)).toBe(false);
        });

        it('mantém o top N por valor e soma o resto em "Outros"', () => {
            const r = agruparTopN(
                [linha('A', '1'), linha('B', '50'), linha('C', '20'), linha('D', '2.5'), linha('E', '40')],
                2
            );

            expect(r.map((l) => l.rotulo)).toEqual(['B', 'E', 'Outros']);
            const outros = r[2];
            expect(outros.outros).toBe(true);
            expect(outros.item).toBeNull();
            expect(outros.valor.toString()).toBe('23.5');
        });

        it('exatamente N linhas não gera "Outros"', () => {
            const r = agruparTopN([linha('A', '1'), linha('B', '2')], 2);

            expect(r).toHaveLength(2);
        });

        it('empate mantém a ordem original e a entrada não é alterada', () => {
            const entrada = [linha('A', '5'), linha('B', '5'), linha('C', '5')];
            const r = agruparTopN(entrada, 2);

            expect(r.map((l) => l.rotulo)).toEqual(['A', 'B', 'Outros']);
            expect(entrada.map((l) => l.rotulo)).toEqual(['A', 'B', 'C']);
        });

        it('lista vazia devolve vazio', () => {
            expect(agruparTopN([], 5)).toEqual([]);
        });
    });

    describe('calcFaseStatus', () => {
        const andamento = [
            { workflow_fase_id: 1, workflow_situacao: { situacao: 'Concluído' } },
            { workflow_fase_id: 2, workflow_situacao: { situacao: 'Em andamento' } },
            { workflow_fase_id: 3, workflow_situacao: null },
        ];

        it('usa a situação do andamento da fase atual', () => {
            expect(calcFaseStatus({ id: 2 }, andamento)).toBe('Em andamento');
        });

        it('sem fase atual devolve null', () => {
            expect(calcFaseStatus(null, andamento)).toBeNull();
        });

        it('fase sem andamento ou sem situação devolve null', () => {
            expect(calcFaseStatus({ id: 9 }, andamento)).toBeNull();
            expect(calcFaseStatus({ id: 3 }, andamento)).toBeNull();
        });
    });

    describe('calcPctParlamentarDistribuicao', () => {
        it('100 mil de 500 mil é 20%', () => {
            expect(calcPctParlamentarDistribuicao(new Decimal(100000), new Decimal(500000))).toBe(20);
        });

        it('distribuição de valor zero não divide por zero', () => {
            expect(calcPctParlamentarDistribuicao(new Decimal(100), new Decimal(0))).toBe(0);
        });
    });
});
