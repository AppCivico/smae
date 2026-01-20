import {
  describe,
  expect,
  it,
} from 'vitest';
import maskFloat from './maskFloat';

function criarEvento(value) {
  return { target: { value } };
}

describe('maskFloat', () => {
  it('deve formatar valor numérico com 2 casas decimais por padrão', () => {
    const el = criarEvento('123456');
    maskFloat(el);
    expect(el.target.value).toBe('1.234,56');
  });

  it('deve formatar valor com 3 casas decimais quando especificado', () => {
    const el = criarEvento('1234567');
    maskFloat(el, 3);
    expect(el.target.value).toBe('1.234,567');
  });

  it('deve formatar valor com 4 casas decimais quando especificado', () => {
    const el = criarEvento('12345678');
    maskFloat(el, 4);
    expect(el.target.value).toBe('1.234,5678');
  });

  it('deve remover caracteres não numéricos antes de formatar', () => {
    const el = criarEvento('1.234,56');
    maskFloat(el);
    expect(el.target.value).toBe('1.234,56');
  });

  it('deve lidar com strings contendo letras', () => {
    const el = criarEvento('abc123def456');
    maskFloat(el);
    expect(el.target.value).toBe('1.234,56');
  });

  it('deve lidar com valor vazio', () => {
    const el = criarEvento('');
    maskFloat(el);
    expect(el.target.value).toBe('0,00');
  });

  it('deve lidar com valor zero', () => {
    const el = criarEvento('0');
    maskFloat(el);
    expect(el.target.value).toBe('0,00');
  });

  it('deve lidar com valores pequenos', () => {
    const el = criarEvento('1');
    maskFloat(el);
    expect(el.target.value).toBe('0,01');
  });

  it('deve lidar com valores pequenos e 3 casas decimais', () => {
    const el = criarEvento('5');
    maskFloat(el, 3);
    expect(el.target.value).toBe('0,005');
  });

  it('deve formatar grandes números corretamente', () => {
    const el = criarEvento('12345678901');
    maskFloat(el);
    expect(el.target.value).toBe('123.456.789,01');
  });

  it('deve lidar com caracteres especiais', () => {
    const el = criarEvento('R$ 1.234,56');
    maskFloat(el);
    expect(el.target.value).toBe('1.234,56');
  });

  it('deve modificar o valor diretamente no elemento', () => {
    const el = criarEvento('999');
    maskFloat(el);
    expect(el.target.value).toBe('9,99');
  });

  it('deve lidar com apenas zeros', () => {
    const el = criarEvento('000');
    maskFloat(el);
    expect(el.target.value).toBe('0,00');
  });

  it('deve formatar corretamente com 1 casa decimal', () => {
    const el = criarEvento('12345');
    maskFloat(el, 1);
    expect(el.target.value).toBe('1.234,5');
  });

  it('deve formatar corretamente com 0 casas decimais', () => {
    const el = criarEvento('12345');
    maskFloat(el, 0);
    expect(el.target.value).toBe('12.345');
  });
});
