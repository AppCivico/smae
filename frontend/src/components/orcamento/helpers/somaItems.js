export default function somaItems(items, key) {
  return items.reduce((r, x) => (x[key] && Number(x[key]) ? r + Number(x[key]) : r), 0);
}
