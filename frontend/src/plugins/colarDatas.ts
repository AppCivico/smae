import converterDataColada from '@/helpers/converterDataColada';

// o Firefox não dispara "paste" em campos de data; ver aoPressionarTecla
let leituraPendente: ReturnType<typeof setTimeout> | undefined;

// o "paste" é a ação padrão do Ctrl+V e chega logo após o keydown; a folga é
// para não ler a área de transferência à toa, e é curta demais para se perceber
const ESPERA_PELO_PASTE_MS = 50;

function ehCampoDeDataEditavel(alvo: EventTarget | null): alvo is HTMLInputElement {
  return alvo instanceof HTMLInputElement
    && alvo.type === 'date'
    && !alvo.readOnly
    && !alvo.disabled;
}

function notificarAlteracao(campo: HTMLInputElement) {
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  campo.dispatchEvent(new Event('change', { bubbles: true }));
}

function aoColar(evento: ClipboardEvent) {
  const campo = evento.target;

  if (!ehCampoDeDataEditavel(campo)) return;

  clearTimeout(leituraPendente);

  const valor = converterDataColada(evento.clipboardData?.getData('text') || '');

  if (!valor) return;

  evento.preventDefault();
  campo.value = valor;
  notificarAlteracao(campo);
}

function aoPressionarTecla(evento: KeyboardEvent) {
  const campo = evento.target;

  if (!ehCampoDeDataEditavel(campo)
    || !(evento.ctrlKey || evento.metaKey)
    // `code` cobre teclados não latinos, em que `key` não é "v"
    || (evento.key.toLowerCase() !== 'v' && evento.code !== 'KeyV')
    || !navigator.clipboard?.readText) {
    return;
  }

  clearTimeout(leituraPendente);

  // se o "paste" chegar, ele cancela esta leitura
  leituraPendente = setTimeout(async () => {
    try {
      const valor = converterDataColada(await navigator.clipboard.readText());

      if (!valor) return;

      campo.value = valor;
      notificarAlteracao(campo);
    } catch {
      // permissão negada ou leitura cancelada: mantém o comportamento do navegador
    }
  }, ESPERA_PELO_PASTE_MS);
}

export default {
  install() {
    // captura, para funcionar mesmo se algum componente interromper a propagação
    document.addEventListener('paste', aoColar, true);
    document.addEventListener('keydown', aoPressionarTecla, true);
  },
};
