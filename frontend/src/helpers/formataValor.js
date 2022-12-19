export default function formataValor(d) {
  return Number(d).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }) ?? d;
}
