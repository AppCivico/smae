/**
 * Converte a lista de extensões de um tipo de documento (`"pdf, .docx,XLSX"`) em
 * extensões normalizadas: minúsculas, com ponto e sem repetição (`['.pdf', '.docx', '.xlsx']`).
 * Lista vazia significa "qualquer extensão".
 */
export function listarExtensoes(extensoes?: string | null): string[] {
  if (!extensoes) return [];

  const lista = extensoes
    .split(',')
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean)
    .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`));

  return [...new Set(lista)];
}

/** Valor para o atributo `accept` de um `<input type="file">`; `undefined` não restringe. */
export function extensoesParaAccept(lista: string[]): string | undefined {
  return lista.length ? lista.join(',') : undefined;
}

/** Texto para exibir à pessoa, como `.pdf, .docx`. */
export function extensoesComoTexto(lista: string[]): string {
  return lista.join(', ');
}

/**
 * Mesma regra do backend: o nome do arquivo precisa terminar com uma das extensões.
 * Sem extensões, qualquer arquivo é aceito.
 */
export function arquivoTemExtensaoPermitida(nomeDoArquivo: string, lista: string[]): boolean {
  if (!lista.length) return true;

  const nome = nomeDoArquivo.toLowerCase();
  return lista.some((ext) => nome.endsWith(ext));
}
