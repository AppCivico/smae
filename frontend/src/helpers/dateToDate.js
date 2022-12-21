export default function dateToDate(d, options = {}) {
  var dd = d ? new Date(d) : false;
  if (!dd) return d;
  var dx = (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC', ...options }) : '';
  return dx ? dx : '';
}
