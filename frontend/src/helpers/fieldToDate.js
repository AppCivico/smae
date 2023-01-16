export default function fieldToDate(d = '') {
  const x = d.split('/');
  return (x.length === 3)
    ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10)
    : null;
}
