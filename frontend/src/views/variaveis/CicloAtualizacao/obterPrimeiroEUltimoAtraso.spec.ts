import { describe, expect, it } from 'vitest';
import { obterPrimeiroEUltimoAtraso } from './obterPrimeiroEUltimoAtraso';

describe('obterPrimeiroEUltimoAtraso', () => {
  it('deve retornar string vazia para array nulo', () => {
    expect(obterPrimeiroEUltimoAtraso(null)).toBe('');
  });

  it('deve retornar string vazia para array vazio', () => {
    expect(obterPrimeiroEUltimoAtraso([])).toBe('');
  });

  it('deve retornar única data formatada para array com um elemento', () => {
    expect(obterPrimeiroEUltimoAtraso(['2025-01-01'])).toBe('01/01/2025');
  });

  it('deve separar com vírgula duas datas não consecutivas', () => {
    expect(obterPrimeiroEUltimoAtraso(['2025-01-01', '2025-02-01'])).toBe(
      '01/01/2025, 01/02/2025',
    );
  });

  it('deve agrupar datas consecutivas com ⋯', () => {
    expect(
      obterPrimeiroEUltimoAtraso(['2025-01-01', '2025-01-02', '2025-01-03']),
    ).toBe('01/01/2025 ⋯ 03/01/2025');
  });

  it('deve agrupar datas consecutivas e separar gap com vírgula', () => {
    expect(
      obterPrimeiroEUltimoAtraso(['2025-01-01', '2025-01-02', '2025-03-01']),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/03/2025');
  });

  it('deve processar múltiplos grupos de datas consecutivas', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-02-02',
        '2025-03-01',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025 ⋯ 02/02/2025, 01/03/2025');
  });

  it('deve limitar a 3 grupos e adicionar "e outros" quando há mais valores', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-02-02',
        '2025-03-01',
        '2025-04-01',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025 ⋯ 02/02/2025, 01/03/2025 e outros');
  });

  it('deve adicionar "e outros" quando há valores após o 3º grupo', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-02-02',
        '2025-03-01',
        '2025-03-02',
        '2025-04-01',
        '2025-04-02',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025 ⋯ 02/02/2025, 01/03/2025 ⋯ 02/03/2025 e outros');
  });

  it('deve processar sequência longa de datas consecutivas como um único grupo', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-01-03',
        '2025-01-04',
        '2025-01-05',
        '2025-01-06',
        '2025-01-07',
      ]),
    ).toBe('01/01/2025 ⋯ 07/01/2025');
  });

  it('deve processar lista com apenas gaps (sem consecutivos)', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-05',
        '2025-01-10',
      ]),
    ).toBe('01/01/2025, 05/01/2025, 10/01/2025');
  });

  it('deve processar lista com apenas gaps e adicionar "e outros" após 3 itens', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-05',
        '2025-01-10',
        '2025-01-15',
        '2025-01-20',
      ]),
    ).toBe('01/01/2025, 05/01/2025, 10/01/2025 e outros');
  });

  it('deve processar datas consecutivas de diferentes meses', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-30',
        '2025-01-31',
        '2025-02-01',
        '2025-02-02',
      ]),
    ).toBe('30/01/2025 ⋯ 02/02/2025');
  });

  it('deve processar datas consecutivas de diferentes anos', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2024-12-30',
        '2024-12-31',
        '2025-01-01',
        '2025-01-02',
      ]),
    ).toBe('30/12/2024 ⋯ 02/01/2025');
  });

  it('deve processar combinação: grupo + único + grupo', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-01-05',
        '2025-01-10',
        '2025-01-11',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 05/01/2025, 10/01/2025 ⋯ 11/01/2025');
  });

  it('deve processar exatamente 3 grupos sem adicionar "e outros"', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-03-01',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025, 01/03/2025');
  });

  it('deve processar dois pares consecutivos', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-02-02',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025 ⋯ 02/02/2025');
  });

  it('deve processar lista iniciando com data única', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-05',
        '2025-01-06',
        '2025-01-07',
      ]),
    ).toBe('01/01/2025, 05/01/2025 ⋯ 07/01/2025');
  });

  it('deve processar lista terminando com data única antes de exceder 3 grupos', () => {
    expect(
      obterPrimeiroEUltimoAtraso([
        '2025-01-01',
        '2025-01-02',
        '2025-02-01',
        '2025-02-02',
        '2025-03-05',
      ]),
    ).toBe('01/01/2025 ⋯ 02/01/2025, 01/02/2025 ⋯ 02/02/2025, 05/03/2025');
  });
});
