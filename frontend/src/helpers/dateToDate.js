function dateToDate(d, options = {}) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC', ...options }) : '';
  return dx || '';
}

export const dateToYear = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, year: format });

export const dateToMonth = (date, format = 'short') => dateToDate(date, { dateStyle: undefined, month: format });

export const dateToDay = (date, format = 'numeric') => dateToDate(date, { dateStyle: undefined, day: format });

export default dateToDate;
