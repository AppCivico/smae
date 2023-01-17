export default (d = '') => {
  if (d) {
    let d1 = d;

    if (d.length === 6) {
      d1 = `01/0${d}`;
    } else if (d.length === 7) {
      d1 = `01/${d}`;
    }

    const x = d1.split('/');

    return (x.length === 3)
      ? new Date(Date.UTC(x[2], x[1] - 1, x[0])).toISOString().substring(0, 10)
      : null;
  }
  return null;
};
