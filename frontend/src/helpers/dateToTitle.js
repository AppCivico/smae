export default function dateToTitle(d, short = false) {
  var dd = d ? new Date(d) : false;
  if (!dd) return d;
  var month = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][dd.getUTCMonth()];
  var year = dd.getUTCFullYear();
  return `${short ? month.substring(0, 3) : month}/${year}`;
}
