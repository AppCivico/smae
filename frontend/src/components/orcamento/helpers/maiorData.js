export default function maiorData(items, key) {
  return items.reduce((r, x) => {
    const k = x[key] ? new Date(x[key]) : 1;
    return k > r ? k : r;
  }, new Date(0));
}
