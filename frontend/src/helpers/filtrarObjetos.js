function filtrar(item, termos = '') {
  const termosEmLista = typeof termos === 'string'
    ? termos.split(' ')
    : [termos];

  return termosEmLista
    .every((termo) => {
      switch (true) {
        case termo === '':
          return true;

        case typeof termo === 'boolean' && typeof item !== 'object':
        case typeof termo === 'number' && typeof item !== 'object':
          return item === termo;

        case typeof item === 'number':
          return String(item).indexOf(termo) > -1;

        case typeof item === 'string':
          return item.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().indexOf(termo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()) > -1;
        case Array.isArray(item):
          return item.some((y) => filtrar(y, termo));

        case item !== null:
          return Object.values(item).some((z) => filtrar(z, termo));

        default:
          return false;
      }
    });
}

export default ((lista, termo) => {
  const termoLimpo = typeof termo === 'string'
    ? String(termo).trim()
    : termo;

  return !termoLimpo
    ? lista
    : lista.filter((x) => filtrar(x, termoLimpo));
});
