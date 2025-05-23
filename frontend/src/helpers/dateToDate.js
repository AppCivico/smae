export function hasTimeInDate(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.getUTCHours() !== null;
  }

  if (typeof date === 'string') {
    const hasDateAndTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,4})?(?:Z|[+-]\d{2}:\d{2})?$/.test(date);
    const isOnlyTime = /^\d{2}:\d{2}:\d{2}$/.test(date);

    return hasDateAndTime && !isOnlyTime;
  }

  return false;
}

/**
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
 */
function dateToDate(d, options = {}) {
  switch (true) {
    case d === null:
    case d === undefined:
    case d === '':
      return '';
    case typeof d === 'boolean':
    case typeof d === 'number':
      return 'Invalid Date';
    default:
      break;
  }

  const timeZone = hasTimeInDate(d) ? 'America/Sao_Paulo' : 'UTC';
  const dd = d ? new Date(d) : false;

  if (!dd) {
    return d;
  }

  const temHoras = dd.getHours() !== 0 && dd.getMinutes() !== 0;
  const podeUsarDateStyle = !['year', 'month', 'day'].some((key) => options[key]);

  if (
    !podeUsarDateStyle
    && (options.dateStyle || options.timeStyle)
  ) {
    console.warn('Existem configurações conflitatentes com configuração de data.', options);
    delete options.dateStyle;
    delete options.timeStyle;
  }

  const configuracaoDeHorario = {
    dateStyle: podeUsarDateStyle ? 'short' : undefined,
    timeStyle: podeUsarDateStyle && temHoras ? 'short' : undefined,
    timeZone,
    ...options,
  };

  const dx = (dd) ? dd.toLocaleString('pt-BR', configuracaoDeHorario) : '';

  return dx || '';
}

export const dateToYear = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, year: format });

export const dateToMonth = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, month: format });

export const dateToDay = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, day: format });

export const dateToMonthYear = (date) => {
  if (!date || typeof date === 'number') return 'Invalid Date';
  const month = dateToMonth(date, '2-digit');
  const year = dateToYear(date, 'numeric');
  return `${month}/${year}`;
};

export const localizarData = (date) => dateToDate(date, {
  dateStyle: 'short',
  timeStyle: undefined,
});

export const localizarDataHorario = (date) => dateToDate(date, {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const dateToShortDate = (date) => dateToDate(date, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  dateStyle: undefined,
});

export default dateToDate;
