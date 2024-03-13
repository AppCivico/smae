function filtrar(item, termos = '') {
  return termos.split(' ').every((termo) => {
    switch (true) {
      case termo === '':
        return true;

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

export default ((lista, termo) => (!termo.trim()
  ? lista
  : lista.filter((x) => filtrar(x, termo.trim()))
));
