const conectivos = [
  'a',
  'ao',
  'até',
  'caso',
  'com',
  'como',
  'da',
  'de',
  'desde',
  'do',
  'e',
  'em',
  'na',
  'no',
  'o',
  'ou',
  'para',
  'pois',
  'por',
  'que',
  'se',
  'sobre',
  'um',
  'uma',
];

export default (str = '', ignoreWords: string[] = conectivos): string => str.split(' ').map((word) => (ignoreWords.includes(word.toLowerCase())
  ? word.toLowerCase()
  : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join(' ');
