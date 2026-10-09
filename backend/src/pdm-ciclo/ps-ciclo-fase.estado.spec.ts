import { calculaEstadoCiclo, FaseEstadoCfg, RevisaoEstado } from './ps-ciclo-fase.estado';

const fases: FaseEstadoCfg[] = [
    { id: 10, ordem: 1, habilitada: true },
    { id: 20, ordem: 2, habilitada: true },
    { id: 30, ordem: 3, habilitada: true },
    { id: 40, ordem: 4, habilitada: true },
];

const rev = (fase_config_id: number, extra: Partial<RevisaoEstado> = {}): RevisaoEstado => ({
    fase_config_id,
    fecha_ciclo: false,
    reaberto_em: null,
    ...extra,
});

describe('calculaEstadoCiclo', () => {
    it('ciclo ativo sem nada preenchido libera todas as fases', () => {
        const e = calculaEstadoCiclo(true, fases, []);
        expect(e.editaveis).toEqual([10, 20, 30, 40]);
        expect(e.fechado).toBe(false);
        expect(e.faseFechamentoId).toBe(40);
    });

    it('fase preenchida fora de ordem continua com todas editáveis', () => {
        const e = calculaEstadoCiclo(true, fases, [rev(30)]);
        expect(e.editaveis).toEqual([10, 20, 30, 40]);
        expect(e.preenchidas).toEqual([30]);
    });

    it('fase desabilitada não conta na ordem nem como fechamento', () => {
        const comDesabilitada = fases.map((f) => (f.id === 40 ? { ...f, habilitada: false } : f));
        const e = calculaEstadoCiclo(true, comDesabilitada, [rev(10), rev(20)]);
        expect(e.editaveis).toEqual([10, 20, 30]);
        expect(e.faseFechamentoId).toBe(30);
    });

    it('fechamento trava tudo', () => {
        const e = calculaEstadoCiclo(true, fases, [rev(10), rev(20), rev(30), rev(40, { fecha_ciclo: true })]);
        expect(e.fechado).toBe(true);
        expect(e.editaveis).toEqual([]);
    });

    it('fechamento numa fase que deixou de ser a última continua fechando o ciclo', () => {
        const e = calculaEstadoCiclo(true, fases, [rev(10), rev(99, { fecha_ciclo: true })]);
        expect(e.fechado).toBe(true);
    });

    it('ciclo inativo sem reabertura não é editável', () => {
        const e = calculaEstadoCiclo(false, fases, [rev(10)]);
        expect(e.cicloEditavel).toBe(false);
        expect(e.editaveis).toEqual([]);
    });

    it('ciclo inativo reaberto volta a ter todas as fases editáveis', () => {
        const ultimas = [rev(10), rev(20), rev(40, { fecha_ciclo: true, reaberto_em: new Date() })];
        const e = calculaEstadoCiclo(false, fases, ultimas);
        expect(e.reaberto).toBe(true);
        expect(e.fechado).toBe(false);
        expect(e.editaveis).toEqual([10, 20, 30, 40]);
    });

    it('sem fases habilitadas não há o que editar nem fase de fechamento', () => {
        const e = calculaEstadoCiclo(
            true,
            fases.map((f) => ({ ...f, habilitada: false })),
            []
        );
        expect(e.editaveis).toEqual([]);
        expect(e.faseFechamentoId).toBeNull();
    });
});
