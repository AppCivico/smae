import converterDataColada from '@/helpers/converterDataColada';

// o Firefox não dispara "paste" em campos de data; ver aoPressionarTecla
let leituraPendente: ReturnType<typeof setTimeout> | undefined;
// invalida leituras já iniciadas: no Firefox, readText() só resolve depois que
// a pessoa clica em "Colar", e ela pode ter colado ou digitado outra coisa antes
let ultimaLeitura = 0;

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
  ultimaLeitura += 1;

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
  ultimaLeitura += 1;

  const leitura = ultimaLeitura;
  const valorAnterior = campo.value;

  // se o "paste" chegar, ele cancela esta leitura
  leituraPendente = setTimeout(async () => {
    try {
      const valor = converterDataColada(await navigator.clipboard.readText());

      const leituraObsoleta = leitura !== ultimaLeitura
        || campo.value !== valorAnterior
        || !ehCampoDeDataEditavel(campo);

      if (!valor || leituraObsoleta) return;

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
