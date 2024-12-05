export function hasTimeInDate(date) {
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.getUTCHours() !== null;
  }

  if (typeof date === 'string') {
    const hasDateAndTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|([+-]\d{2}:\d{2}))?$/.test(date);
    const isOnlyTime = /^\d{2}:\d{2}:\d{2}$/.test(date);

    return hasDateAndTime && !isOnlyTime;
  }

  return false;
}

/**
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
 */
function dateToDate(d, options = {}) {
  if (!d || typeof d === 'boolean' || typeof d === 'number') return 'Invalid Date';

  const timeZone = hasTimeInDate(d) ? 'America/Sao_Paulo' : 'UTC';
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone, ...options }) : '';
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
