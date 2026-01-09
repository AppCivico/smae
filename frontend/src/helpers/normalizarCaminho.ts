// remove './' inicial e garante que o caminho não é vazio e garante barra final
export default (caminho = '') => (typeof caminho === 'string' && caminho.length
  ? caminho
    // .replace(/\/$/, '')
    .replace(/^\.\//, '')
    .replace(/\/?$/, '/')
  : '/');
