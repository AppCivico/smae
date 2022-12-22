export default function monthAndYearToDate(d) {
  if (d) {
    if (d.length == 6) { d = '01/0' + d; }
    else if (d.length == 7) { d = '01/' + d; }
    var x = d.split('/');
    return (x.length == 3) ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10) : null;
  }
  return null;
}
