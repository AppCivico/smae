export default function dateToTitle(d) {
  var dd = d ? new Date(d) : false;
  if (!dd) return d;
  var month = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"][dd.getUTCMonth()];
  var year = dd.getUTCFullYear();
  return `${month}/${year}`;
}
