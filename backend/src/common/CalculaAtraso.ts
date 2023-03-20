import { DateTime } from 'luxon';

export class CalculaAtraso {
    static emDias(hoje: DateTime, termino_planejado: Date | null, termino_real: Date | null): number | null {
        // se sabe quando começa, não ta atrasado
        if (termino_planejado == null) return null;
        // se já acabou, não ta atrasado
        if (termino_real != null) return null;

        const d = DateTime.fromJSDate(termino_planejado).diff(hoje).as('days');
        // se ta positivo, ta no futuro, não ta atrasado ainda
        return d >= 0 ? null : Math.floor(Math.abs(d));
    }
}
