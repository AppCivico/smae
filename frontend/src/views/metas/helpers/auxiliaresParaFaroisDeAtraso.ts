/* eslint-disable max-len */
import type { CronogramaEtapaAtrasoGrau } from '@back/cronograma-etapas/entities/cronograma-etapa.entity';

export const textoParaFarolDeAtraso = ((grau: CronogramaEtapaAtrasoGrau | unknown, dias = 0): string | null => {
  switch (grau) {
    case 'Concluido':
      return 'Concluído';

    case 'Moderado':
      return dias > 0
        ? `Atraso moderado de ${dias} dias`
        : 'Atraso moderado';

    case 'Alto':
      return dias > 0
        ? `Atraso grave de ${dias} dias`
        : 'Atraso grave';

    default:
      return null;
  }
});

export const classeParaFarolDeAtraso = ((grau: CronogramaEtapaAtrasoGrau | unknown): string | null => (grau && grau !== 'Neutro'
  ? `alerta-de-atraso alerta-de-atraso--${String(grau).toLowerCase()}`
  : null));
