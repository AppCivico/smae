import hexToRgb from './hexToRgbArray';
import hslToRgb from './hslToRgbArray';
import rgbToHex from './rgbToHex';
import rgbToHsl from './rgbToHslArray';

const parseColorToArray = (color: string, format = 'rgb'): number[] | null => {
  if (color.startsWith('#')) {
    const corRgb = hexToRgb(color);

    if (format === 'rgb') {
      return corRgb;
    }

    if (corRgb) {
      // Se o formato de saída for hsl, converter a cor de RGB para HSL
      return rgbToHsl(corRgb);
    }

    return null;
  }

  if (color.startsWith('rgb') && format === 'hsl') {
    return rgbToHsl(color);
  }

  if (color.startsWith('hsl') && format === 'rgb') {
    return hslToRgb(color);
  }

  const commaSeparated = color.match(/\d+/g);

  return commaSeparated && commaSeparated.length === 3
    ? commaSeparated?.map(Number)
    : null;
};

type ColorFormat = 'rgb' | 'hex' | 'hsl';
type HuePath = 'short' | 'long';

type Options = {
  format?: ColorFormat;
  huePath?: HuePath;
};

const interpolateHue = (h1: number, h2: number, t: number, path: 'short' | 'long'): number => {
  let delta = 0;
  let direction = 0;

  if (path === 'long') {
    delta = 360 - Math.min(Math.abs(h2 - h1), 360 - Math.abs(h2 - h1));
    direction = (h2 - h1 + 360) % 360 < 180
      ? -1
      : 1;
  } else {
    delta = Math.min(Math.abs(h2 - h1), 360 - Math.abs(h2 - h1));
    direction = (h2 - h1 + 360) % 360 < 180
      ? 1
      : -1;
  }

  return ((h1 + direction * delta * t) + 360) % 360;
};

const getDefaultFormat = (cor1: string, cor2: string): 'rgb' | 'hex' | 'hsl' => {
  if (cor1.startsWith('#') && cor2.startsWith('#')) return 'hex';
  if (cor1.startsWith('hsl') && cor2.startsWith('hsl')) return 'hsl';
  return 'rgb';
};

export default (cor1: string, cor2: string, quantidade: number, options: Options = {}) => {
  const {
    format,
    huePath = 'short',
  } = options;

  const coresIntermediarias: string[] = [];

  if (format && !['rgb', 'hex', 'hsl'].includes(format)) {
    // Retorna array vazio se o formato for inválido
    return coresIntermediarias;
  }

  // se o formato de saída não for definido, tentar inferir a partir das cores
  const formatoDeSaida = format || getDefaultFormat(cor1, cor2);

  if (formatoDeSaida === 'hsl') {
    const cor1Array = parseColorToArray(cor1, 'hsl');
    const cor2Array = parseColorToArray(cor2, 'hsl');

    if (!cor1Array || !cor2Array) {
      return coresIntermediarias;
    }

    for (let i = 0; i < quantidade; i += 1) {
      const t = (i + 1) / (quantidade + 1);
      const h = interpolateHue(cor1Array[0], cor2Array[0], t, huePath);
      const s = cor1Array[1] + (cor2Array[1] - cor1Array[1]) * t;
      const l = cor1Array[2] + (cor2Array[2] - cor1Array[2]) * t;

      const novaCor = `hsl(${h}, ${s}%, ${l}%)`;
      coresIntermediarias.push(novaCor);
    }
  } else {
    const cor1Array = parseColorToArray(cor1, 'rgb');
    const cor2Array = parseColorToArray(cor2, 'rgb');

    if (!cor1Array || !cor2Array) {
      // Retorna array vazio se não conseguir extrair os valores das cores
      return coresIntermediarias;
    }

    for (let i = 0; i < quantidade; i += 1) {
      const canaisRGB = cor1Array.map((cor1Value, index) => {
        const cor2Value = cor2Array[index];
        return Math.round(cor1Value + ((cor2Value - cor1Value) * (i + 1)) / (quantidade + 1));
      });

      if (canaisRGB.length === 3) {
        const novaCor = formatoDeSaida === 'hex'
          ? rgbToHex(canaisRGB as [number, number, number])
          : `rgb(${canaisRGB.join(', ')})`;

        if (novaCor) {
          coresIntermediarias.push(novaCor);
        }
      }
    }
  }

  return coresIntermediarias;
};
