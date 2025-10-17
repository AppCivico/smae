// Mapa de cores nomeadas predefinidas
export const coresNomeadas = {
  vermelho: { fill: '#EE3B2B', stroke: '#C2CED1' },
  laranja: { fill: '#F2890D', stroke: '#C2CED1' },
  verde: { fill: '#8EC122', stroke: '#C2CED1' },
  padrão: { fill: '#152741', stroke: '#f7c234' },
};

// Caminhos SVG para cada variante
const PATH_COM_CONTORNO = 'M11.9999 21C6.66694 15.946 3.99994 11.946 3.99994 9C3.99994 6.87827 4.84279 4.84344 6.34308 3.34315C7.84338 1.84285 9.87821 1 11.9999 1C14.1217 1 16.1565 1.84285 17.6568 3.34315C19.1571 4.84344 19.9999 6.87827 19.9999 9C19.9999 11.946 17.3329 15.946 11.9999 21ZM11.9999 12C12.7956 12 13.5587 11.6839 14.1213 11.1213C14.6839 10.5587 14.9999 9.79565 14.9999 9C14.9999 8.20435 14.6839 7.44129 14.1213 6.87868C13.5587 6.31607 12.7956 6 11.9999 6C11.2043 6 10.4412 6.31607 9.87862 6.87868C9.31601 7.44129 8.99994 8.20435 8.99994 9C8.99994 9.79565 9.31601 10.5587 9.87862 11.1213C10.4412 11.6839 11.2043 12 11.9999 12Z';

const PATH_SO_CONTORNO = 'M11.9999 20.309C9.5208 17.929 7.66382 15.8037 6.41609 13.9321C5.10609 11.9672 4.49994 10.3298 4.49994 9C4.49994 7.01088 5.29012 5.10322 6.69664 3.6967C8.10316 2.29018 10.0108 1.5 11.9999 1.5C13.9891 1.5 15.8967 2.29018 17.3032 3.6967C18.7098 5.10322 19.4999 7.01088 19.4999 9C19.4999 10.3298 18.8938 11.9672 17.5838 13.9321C16.3361 15.8037 14.4791 17.929 11.9999 20.309ZM11.9999 12.5C12.9282 12.5 13.8184 12.1313 14.4748 11.4749C15.1312 10.8185 15.4999 9.92826 15.4999 9C15.4999 8.07174 15.1312 7.1815 14.4748 6.52513C13.8184 5.86875 12.9282 5.5 11.9999 5.5C11.0717 5.5 10.1814 5.86875 9.52506 6.52513C8.86869 7.1815 8.49994 8.07174 8.49994 9C8.49994 9.92826 8.86869 10.8185 9.52506 11.4749C10.1814 12.1313 11.0717 12.5 11.9999 12.5Z';

const PATH_PADRAO = 'M12 20.309C9.52086 17.929 7.66388 15.8037 6.41615 13.9321C5.10615 11.9672 4.5 10.3298 4.5 9C4.5 7.01088 5.29018 5.10322 6.6967 3.6967C8.10322 2.29018 10.0109 1.5 12 1.5C13.9891 1.5 15.8968 2.29018 17.3033 3.6967C18.7098 5.10322 19.5 7.01088 19.5 9C19.5 10.3298 18.8938 11.9672 17.5839 13.9321C16.3361 15.8037 14.4791 17.929 12 20.309ZM12 12.5C12.9283 12.5 13.8185 12.1313 14.4749 11.4749C15.1313 10.8185 15.5 9.92826 15.5 9C15.5 8.07174 15.1313 7.1815 14.4749 6.52513C13.8185 5.86875 12.9283 5.5 12 5.5C11.0717 5.5 10.1815 5.86875 9.52513 6.52513C8.86875 7.1815 8.5 8.07174 8.5 9C8.5 9.92826 8.86875 10.8185 9.52513 11.4749C10.1815 12.1313 11.0717 12.5 12 12.5Z';

/**
 * Determina as cores de preenchimento e contorno
 * @param {string|object} cor - Nome da cor, hex color ou objeto com {fill, stroke}
 * @returns {{preenchimento: string, contorno: string}}
 */
export function determinarCores(cor) {
  let corPreenchimento;
  let corContorno;

  if (typeof cor === 'string') {
    if (coresNomeadas[cor]) {
      const corConfig = coresNomeadas[cor];
      corPreenchimento = corConfig.fill;
      corContorno = corConfig.stroke;
    } else if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(cor)) {
      corPreenchimento = cor;
      corContorno = coresNomeadas.padrão.stroke;
    } else {
      corPreenchimento = coresNomeadas.padrão.fill;
      corContorno = coresNomeadas.padrão.stroke;
    }
  } else if (cor && typeof cor === 'object') {
    corPreenchimento = cor.fill || coresNomeadas.padrão.fill;
    corContorno = cor.stroke || coresNomeadas.padrão.stroke;
  } else {
    corPreenchimento = coresNomeadas.padrão.fill;
    corContorno = coresNomeadas.padrão.stroke;
  }

  return {
    preenchimento: corPreenchimento,
    contorno: corContorno,
  };
}

/**
 * Gera o SVG string de um marcador de mapa
 * @param {string|object} cor - Nome da cor, hex color ou objeto com {fill, stroke}
 * @param {object} opcoes - Opções adicionais
 *   { variante: 'padrao'|'sem-contorno'|'so-contorno'|'com-contorno' }
 * @returns {string} SVG string
 */
export function gerarSvgMarcador(cor, opcoes = {}) {
  const { variante = 'padrao' } = opcoes;
  const cores = determinarCores(cor);

  let pathD;
  let attrs = '';

  if (variante === 'sem-contorno' || variante === 'com-contorno') {
    pathD = PATH_COM_CONTORNO;
    attrs = ` fill-rule="evenodd" clip-rule="evenodd" fill="${cores.preenchimento}"`;
    if (variante === 'com-contorno') attrs += ` stroke="${cores.contorno}"`;
  } else if (variante === 'so-contorno') {
    pathD = PATH_SO_CONTORNO;
    attrs = ` stroke="${cores.contorno}"`;
  } else {
    pathD = PATH_PADRAO;
    attrs = ` fill="${cores.preenchimento}" stroke="${cores.contorno}"`;
  }

  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path${attrs} d="${pathD}"/></svg>`;
}
