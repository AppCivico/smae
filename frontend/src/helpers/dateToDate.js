/**
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
 */
function dateToDate(d, options = {}) {
  if (!d || typeof d === 'boolean') return 'Invalid Date';
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC', ...options }) : '';
  return dx || '';
}

export const dateToYear = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, year: format });

export const dateToMonth = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, month: format });

export const dateToDay = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, day: format });

export const dateToMonthYear = (date) => {
  const month = dateToMonth(date, '2-digit');
  const year = dateToYear(date, 'numeric');
  return `${month}/${year}`;
};

export const localizarData = (date) => dateToDate(date, {
  dateStyle: 'short',
  timeStyle: undefined,
  timeZone: 'America/Sao_Paulo',
});

export const localizarDataHorario = (date) => dateToDate(date, {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
  timeStyle: 'short',
});

export const dateToShortDate = (date) => dateToDate(date, {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'America/Sao_Paulo',
  dateStyle: undefined,
});

export default dateToDate;
