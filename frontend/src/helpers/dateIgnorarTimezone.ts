import { UTCDate } from '@date-fns/utc';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

function dateIgnorarTimezone(x: string | Date | null | undefined, formato = 'MMMM yyyy'): string | null {
  if (!x) {
    return null;
  }

  let dataAtual = x;

  if (typeof dataAtual === 'string' && dataAtual.includes('T')) {
    dataAtual = dataAtual.replace(/T(.)*/, '');
  }

  try {
    return format(new UTCDate(`${dataAtual}T00:00:00.000000Z` as string), formato, {
      locale: ptBR,
    });
  } catch (e) {
    console.error('Erro ao tentar formatar data', dataAtual, e);
    return 'err';
  }
}

export default dateIgnorarTimezone;
