/* eslint-disable max-len */
// eslint-disable-next-line import/no-extraneous-dependencies
import { CronogramaEtapaAtrasoGrau } from '@/../../common/CronogramaEtapaAtrasoGrau';

export const textoParaFarolDeAtraso = ((grau: CronogramaEtapaAtrasoGrau | any, dias = 0): String | null => {
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

export const classeParaFarolDeAtraso = ((grau: CronogramaEtapaAtrasoGrau | any): String | null => (grau && grau !== 'Neutro'
  ? `alerta-de-atraso alerta-de-atraso--${String(grau).toLowerCase()}`
  : null));
