export default function dateToTitle(d, short = false) {
  let dd = false;

  if (d) {
    dd = d === 'hoje'
      ? new Date()
      : new Date(d);
  }

  if (!dd) return d;
  const month = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dd.getUTCMonth()];
  const year = dd.getUTCFullYear();
  return `${short ? month.substring(0, 3) : month}/${year}`;
}
