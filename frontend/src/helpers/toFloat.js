export default function toFloat(v) {
  return Number.isNaN(v) || String(v).indexOf(',') !== -1
    ? Number(String(v).replace(/[^0-9\-,]/g, '').replace(',', '.'))
    : parseFloat(v);
}
