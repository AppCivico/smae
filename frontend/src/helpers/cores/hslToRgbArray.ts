const hue2rgb = (p: number, q: number, t: number) => {
  let tempT = t;
  if (tempT < 0) tempT += 1;
  if (tempT > 1) tempT -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
};

export default (input: [number, number, number] | string) => {
  let h: number;
  let s: number;
  let l: number;

  if (Array.isArray(input)) {
    [h, s, l] = input;
  } else {
    const match = input.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
    if (!match) {
      return null;
    }
    h = parseInt(match[1], 10);
    s = parseInt(match[2], 10) / 100;
    l = parseInt(match[3], 10) / 100;
  }

  let r: number;
  let g: number;
  let b: number;

  if (s === 0) {
    r = l; // achromatic
    g = l;
    b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h / 360 + 1 / 3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};
