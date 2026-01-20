import dinheiro from './dinheiro';

export default function maskFloat(el, casasDecimais = 2) {
  const divisor = 10 ** casasDecimais;

  el.target.value = dinheiro(
    Number(el.target.value.replace(/[\D]/g, '')) / divisor,
    { minimumFractionDigits: casasDecimais, maximumFractionDigits: casasDecimais },
  );
}
