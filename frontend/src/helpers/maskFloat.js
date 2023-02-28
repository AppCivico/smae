import dinheiro from './dinheiro';

export default function maskFloat(el) {
  el.target.value = dinheiro(Number(el.target.value.replace(/[\D]/g, '')) / 100);
  // el.target?._vei?.onChange(el);
}
