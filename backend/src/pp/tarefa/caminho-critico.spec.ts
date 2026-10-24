import { TarefaDependenteTipo } from '@prisma/client';
import { CaminhoCriticoTarefa, calculaCaminhoCritico } from './caminho-critico';

const ymd = (d: Date | null) => (d ? d.toISOString().substring(0, 10) : null);

function t(
    id: number,
    inicio: string | null,
    termino: string | null,
    extra: Partial<CaminhoCriticoTarefa> = {}
): CaminhoCriticoTarefa {
    return {
        id,
        tarefa_pai_id: null,
        nivel: 1,
        inicio_planejado: inicio,
        termino_planejado: termino,
        dependencias: [],
        ...extra,
    };
}

const dep = (dependencia_tarefa_id: number, tipo: TarefaDependenteTipo, latencia = 0) => ({
    dependencia_tarefa_id,
    tipo,
    latencia,
});

describe('calculaCaminhoCritico', () => {
    it('cadeia termina-pro-início com uma tarefa paralela com folga', () => {
        // 1 (01..05) -> 2 (05..10); 3 (01..03) solta
        const r = calculaCaminhoCritico([
            t(1, '2026-01-01', '2026-01-05'),
            t(2, '2026-01-05', '2026-01-10', { dependencias: [dep(1, TarefaDependenteTipo.termina_pro_inicio)] }),
            t(3, '2026-01-01', '2026-01-03'),
        ]);

        expect(r.por_tarefa.get(1)).toMatchObject({ folga: 0, eh_critica: true });
        expect(r.por_tarefa.get(2)).toMatchObject({ folga: 0, eh_critica: true });
        expect(r.por_tarefa.get(3)).toMatchObject({ folga: 7, eh_critica: false });
        expect(ymd(r.por_tarefa.get(3)!.inicio_mais_tarde)).toBe('2026-01-08');
        expect(ymd(r.por_tarefa.get(3)!.termino_mais_tarde)).toBe('2026-01-10');
        expect(r.caminho).toEqual([1, 2]);
    });

    it('latência e ramo mais curto', () => {
        // 1 -> 2 (lat 2) e 1 -> 3; 3 termina antes de 2
        const r = calculaCaminhoCritico([
            t(1, '2026-01-01', '2026-01-02'),
            t(2, '2026-01-04', '2026-01-10', { dependencias: [dep(1, TarefaDependenteTipo.termina_pro_inicio, 2)] }),
            t(3, '2026-01-02', '2026-01-04', { dependencias: [dep(1, TarefaDependenteTipo.termina_pro_inicio)] }),
        ]);

        expect(r.por_tarefa.get(1)!.folga).toBe(0);
        expect(r.por_tarefa.get(2)!.folga).toBe(0);
        expect(r.por_tarefa.get(3)!.folga).toBe(6);
        expect(r.caminho).toEqual([1, 2]);
    });

    it('inicia-pro-início prende o início da antecessora', () => {
        // 2 começa junto com 1 (SS) e é a mais longa; 1 é curta
        const r = calculaCaminhoCritico([
            t(1, '2026-01-01', '2026-01-02'),
            t(2, '2026-01-01', '2026-01-10', { dependencias: [dep(1, TarefaDependenteTipo.inicia_pro_inicio)] }),
        ]);

        // 1 não pode começar depois de 01, mas termina com folga própria de duração
        expect(ymd(r.por_tarefa.get(1)!.inicio_mais_tarde)).toBe('2026-01-01');
        expect(r.por_tarefa.get(1)!.folga).toBe(0);
        expect(r.por_tarefa.get(2)!.folga).toBe(0);
    });

    it('termina-pro-término e inicia-pro-término', () => {
        const r = calculaCaminhoCritico([
            t(1, '2026-01-01', '2026-01-05'),
            t(2, '2026-01-03', '2026-01-10'),
            t(3, '2026-01-06', '2026-01-08', {
                dependencias: [dep(1, TarefaDependenteTipo.termina_pro_termino, 1)],
            }),
            t(4, '2026-01-02', '2026-01-04', {
                dependencias: [dep(2, TarefaDependenteTipo.inicia_pro_termino)],
            }),
        ]);

        // 3 pode terminar até 10, então 1 pode terminar até 09
        expect(r.por_tarefa.get(3)!.folga).toBe(2);
        expect(r.por_tarefa.get(1)!.folga).toBe(4);
        // 4 precisa terminar depois do início de 2: 2 pode começar até 03 (é crítica), sem efeito em 4 (lf=10)
        expect(r.por_tarefa.get(2)!.folga).toBe(0);
        expect(r.por_tarefa.get(4)!.folga).toBe(6);
    });

    it('tarefa-mãe usa a menor folga das filhas', () => {
        const r = calculaCaminhoCritico([
            t(10, '2026-01-01', '2026-01-10'),
            t(11, '2026-01-01', '2026-01-10', { tarefa_pai_id: 10, nivel: 2 }),
            t(12, '2026-01-01', '2026-01-04', { tarefa_pai_id: 10, nivel: 2 }),
            t(20, '2026-01-01', '2026-01-05'),
        ]);

        expect(r.por_tarefa.get(12)!.folga).toBe(6);
        expect(r.por_tarefa.get(11)!.folga).toBe(0);
        expect(r.por_tarefa.get(10)).toMatchObject({ folga: 0, eh_critica: true });
        expect(r.por_tarefa.get(20)!.folga).toBe(5);
        expect(r.caminho).toEqual([11]);
    });

    it('dependência na tarefa-mãe propaga para as filhas', () => {
        // 30 depende do fim da mãe 10; filha 12 termina antes da 11
        const r = calculaCaminhoCritico([
            t(10, '2026-01-01', '2026-01-10'),
            t(11, '2026-01-01', '2026-01-10', { tarefa_pai_id: 10, nivel: 2 }),
            t(12, '2026-01-01', '2026-01-05', { tarefa_pai_id: 10, nivel: 2 }),
            t(30, '2026-01-10', '2026-01-20', { dependencias: [dep(10, TarefaDependenteTipo.termina_pro_inicio)] }),
        ]);

        expect(r.por_tarefa.get(11)!.folga).toBe(0);
        expect(r.por_tarefa.get(12)!.folga).toBe(5);
        expect(r.por_tarefa.get(30)!.folga).toBe(0);
        expect(r.caminho).toEqual([11, 30]);
    });

    it('tarefa sem datas fica de fora', () => {
        const r = calculaCaminhoCritico([
            t(1, '2026-01-01', '2026-01-05'),
            t(2, null, null, { dependencias: [dep(1, TarefaDependenteTipo.termina_pro_inicio)] }),
        ]);

        expect(r.por_tarefa.get(2)).toEqual({
            folga: null,
            eh_critica: false,
            inicio_mais_tarde: null,
            termino_mais_tarde: null,
        });
        expect(r.por_tarefa.get(1)!.folga).toBe(0);
    });

    it('aceita Date vindo do Prisma', () => {
        const r = calculaCaminhoCritico([
            t(1, new Date('2026-01-01') as any, new Date('2026-01-05') as any),
            t(2, new Date('2026-01-01') as any, new Date('2026-01-02') as any),
        ]);
        expect(r.por_tarefa.get(2)!.folga).toBe(3);
    });

    it('lista vazia', () => {
        expect(calculaCaminhoCritico([])).toEqual({ por_tarefa: new Map(), caminho: [] });
    });
});
