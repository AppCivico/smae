import hexToRgb from './hexToRgb';
import rgbToHex from './rgbToHex';

const parseColor = (color: string): number[] | null => {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  const rgbMatch = color.match(/\d+/g);
  return rgbMatch && rgbMatch.length === 3
    ? rgbMatch?.map(Number)
    : null;
};

const getDefaultFormat = (cor1: string, cor2: string): 'rgb' | 'hex' => (cor1.startsWith('#') && cor2.startsWith('#') ? 'hex' : 'rgb');

export default (cor1: string, cor2: string, quantidade: number, format?: 'rgb' | 'hex'): string[] => {
  const cor1Array = parseColor(cor1);
  const cor2Array = parseColor(cor2);
  const coresIntermediarias: string[] = [];

  if (!cor1Array || !cor2Array || (format && !['rgb', 'hex'].includes(format))) {
    // Retorna array vazio se não conseguir extrair os valores das cores ou se o
    // formato for inválido
    return coresIntermediarias;
  }

  const formatDeSaida = format || getDefaultFormat(cor1, cor2);

  for (let i = 0; i < quantidade; i += 1) {
    const canaisRGB = cor1Array.map((cor1Value, index) => {
      const cor2Value = cor2Array[index];
      return Math.round(cor1Value + ((cor2Value - cor1Value) * (i + 1)) / (quantidade + 1));
    });

    if (canaisRGB.length === 3) {
      const novaCor = formatDeSaida === 'hex'
        ? rgbToHex(canaisRGB as [number, number, number])
        : `rgb(${canaisRGB.join(', ')})`;

      if (novaCor) {
        coresIntermediarias.push(novaCor);
      }
    }
  }
  return coresIntermediarias;
};
