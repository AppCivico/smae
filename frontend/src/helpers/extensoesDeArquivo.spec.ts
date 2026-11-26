import { describe, expect, it } from 'vitest';

import {
  arquivoTemExtensaoPermitida,
  extensoesComoTexto,
  extensoesParaAccept,
  listarExtensoes,
} from './extensoesDeArquivo';

describe('listarExtensoes', () => {
  it('normaliza espaços, maiúsculas, ponto inicial e repetições', () => {
    expect(listarExtensoes(' pdf, .DOCX,xlsx ,,pdf')).toEqual(['.pdf', '.docx', '.xlsx']);
  });

  it('devolve lista vazia sem extensões', () => {
    expect(listarExtensoes(null)).toEqual([]);
    expect(listarExtensoes(undefined)).toEqual([]);
    expect(listarExtensoes('')).toEqual([]);
    expect(listarExtensoes(' , ')).toEqual([]);
  });
});

describe('extensoesParaAccept e extensoesComoTexto', () => {
  it('formatam a lista', () => {
    expect(extensoesParaAccept(['.pdf', '.docx'])).toBe('.pdf,.docx');
    expect(extensoesComoTexto(['.pdf', '.docx'])).toBe('.pdf, .docx');
  });

  it('não restringe `accept` sem extensões', () => {
    expect(extensoesParaAccept([])).toBeUndefined();
  });
});

describe('arquivoTemExtensaoPermitida', () => {
  const lista = ['.pdf', '.tar.gz'];

  it('aceita qualquer arquivo quando não há extensões', () => {
    expect(arquivoTemExtensaoPermitida('planilha.xlsx', [])).toBe(true);
  });

  it('compara o final do nome sem diferenciar maiúsculas', () => {
    expect(arquivoTemExtensaoPermitida('Relatório Final.PDF', lista)).toBe(true);
    expect(arquivoTemExtensaoPermitida('copia.tar.gz', lista)).toBe(true);
  });

  it('recusa extensões fora da lista, inclusive parecidas', () => {
    expect(arquivoTemExtensaoPermitida('planilha.xlsx', lista)).toBe(false);
    expect(arquivoTemExtensaoPermitida('arquivo.pdfx', lista)).toBe(false);
    expect(arquivoTemExtensaoPermitida('pdf', lista)).toBe(false);
  });
});
