import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import colarDatas from './colarDatas';

describe('plugin colarDatas', () => {
  let campo: HTMLInputElement;
  let aoMudar: ReturnType<typeof vi.fn>;

  function colar(alvo: HTMLElement, texto: string) {
    const evento = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(evento, 'clipboardData', {
      value: { getData: () => texto },
    });
    alvo.dispatchEvent(evento);
    return evento;
  }

  function pressionarCtrlV(alvo: HTMLElement) {
    alvo.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'v',
      ctrlKey: true,
      bubbles: true,
    }));
  }

  beforeAll(() => {
    colarDatas.install();
  });

  beforeEach(() => {
    campo = document.createElement('input');
    campo.type = 'date';
    aoMudar = vi.fn();
    campo.addEventListener('input', aoMudar);
    document.body.appendChild(campo);
  });

  afterEach(() => {
    campo.remove();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('preenche o campo de data ao colar uma data reconhecida', () => {
    const evento = colar(campo, '19/01/1992');

    expect(campo.value).toBe('1992-01-19');
    expect(aoMudar).toHaveBeenCalled();
    expect(evento.defaultPrevented).toBe(true);
  });

  it('mantém o comportamento do navegador quando o texto não é data', () => {
    const evento = colar(campo, 'abc');

    expect(campo.value).toBe('');
    expect(evento.defaultPrevented).toBe(false);
  });

  it('não interfere em campos que não são de data', () => {
    const texto = document.createElement('input');
    document.body.appendChild(texto);

    const evento = colar(texto, '19/01/1992');

    expect(evento.defaultPrevented).toBe(false);
    texto.remove();
  });

  it('não altera campos somente leitura', () => {
    campo.readOnly = true;

    const evento = colar(campo, '19/01/1992');

    expect(campo.value).toBe('');
    expect(evento.defaultPrevented).toBe(false);
  });

  it('reconhece Ctrl+V em teclados não latinos pelo código da tecla', async () => {
    vi.useFakeTimers();
    const readText = vi.fn().mockResolvedValue('19/01/1992');
    vi.stubGlobal('navigator', { clipboard: { readText } });

    campo.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'м',
      code: 'KeyV',
      ctrlKey: true,
      bubbles: true,
    }));
    await vi.runAllTimersAsync();

    expect(campo.value).toBe('1992-01-19');
  });

  it('lê a área de transferência quando o navegador não dispara "paste"', async () => {
    vi.useFakeTimers();
    const readText = vi.fn().mockResolvedValue('19/01/1992');
    vi.stubGlobal('navigator', { clipboard: { readText } });

    pressionarCtrlV(campo);
    await vi.runAllTimersAsync();

    expect(readText).toHaveBeenCalled();
    expect(campo.value).toBe('1992-01-19');
  });

  it('não lê a área de transferência quando o "paste" chega', async () => {
    vi.useFakeTimers();
    const readText = vi.fn().mockResolvedValue('01/01/2000');
    vi.stubGlobal('navigator', { clipboard: { readText } });

    pressionarCtrlV(campo);
    colar(campo, '19/01/1992');
    await vi.runAllTimersAsync();

    expect(readText).not.toHaveBeenCalled();
    expect(campo.value).toBe('1992-01-19');
  });
});
