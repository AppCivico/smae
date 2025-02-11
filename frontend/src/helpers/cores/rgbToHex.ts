// eslint-disable-next-line no-bitwise
export default (input: [number, number, number] | string): string | null => {
  let r: number;
  let g: number;
  let b: number;

  if (Array.isArray(input)) {
    [r, g, b] = input;
  } else {
    const match = input.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) {
      return null;
    }
    r = parseInt(match[1], 10);
    g = parseInt(match[2], 10);
    b = parseInt(match[3], 10);
  }

  // eslint-disable-next-line no-bitwise
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
