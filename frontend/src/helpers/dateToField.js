export default function dateToField(d) {
  var dd = d ? new Date(d) : false;
  return (dd) ? dd.toLocaleString('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }) : '';
}
