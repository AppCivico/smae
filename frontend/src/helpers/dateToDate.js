export default function dateToDate(d, options = {}) {
  const dd = d ? new Date(d) : false;
  if (!dd) return d;
  const dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC', ...options }) : '';
  return dx || '';
}
