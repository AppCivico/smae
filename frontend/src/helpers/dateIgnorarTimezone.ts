import { UTCDate } from '@date-fns/utc';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

function dateIgnorarTimezone(x: string, formato = 'MMMM yyyy') {
  return format(new UTCDate(`${x}T00:00:00.000000Z` as string), formato, {
    locale: ptBR,
  });
}

export default dateIgnorarTimezone;
