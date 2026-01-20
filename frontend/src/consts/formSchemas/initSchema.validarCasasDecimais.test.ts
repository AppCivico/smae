import {
  describe,
  expect,
  it,
} from 'vitest';
import { string } from './initSchema';

describe('validarCasasDecimais', () => {
  it('deve aceitar valores vazios ou nulos', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('')).resolves.toBe('');
    await expect(schema.validate(undefined)).resolves.toBe(undefined);

    await expect(schema.nullable().validate(null)).resolves.toBe(null);
  });

  it('deve aceitar valores sem casas decimais', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('100')).resolves.toBe('100');
    await expect(schema.validate('1234')).resolves.toBe('1234');
  });

  it('deve aceitar valores com vírgula como separador decimal', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('100,00')).resolves.toBe('100,00');
    await expect(schema.validate('1234,56')).resolves.toBe('1234,56');
  });

  it('deve aceitar valores com ponto como separador decimal', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('100.00')).resolves.toBe('100.00');
    await expect(schema.validate('1234.56')).resolves.toBe('1234.56');
  });

  it('deve aceitar valores com exatamente o número de casas decimais permitido', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('100,12')).resolves.toBe('100,12');
    await expect(schema.validate('50.99')).resolves.toBe('50.99');
  });

  it('deve aceitar valores com menos casas decimais que o permitido', async () => {
    const schema = string().validarCasasDecimais(3);

    await expect(schema.validate('100,1')).resolves.toBe('100,1');
    await expect(schema.validate('50.12')).resolves.toBe('50.12');
  });

  it('deve rejeitar valores com mais casas decimais que o permitido', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('100,123'))
      .rejects
      .toThrow('O valor deve ter no máximo 2 casas decimais');

    await expect(schema.validate('50.999'))
      .rejects
      .toThrow('O valor deve ter no máximo 2 casas decimais');
  });

  it('deve funcionar com 0 casas decimais', async () => {
    const schema = string().validarCasasDecimais(0);

    await expect(schema.validate('100')).resolves.toBe('100');
    await expect(schema.validate('1234')).resolves.toBe('1234');

    await expect(schema.validate('100,5'))
      .rejects
      .toThrow('O valor deve ter no máximo 0 casas decimais');
  });

  it('deve funcionar com 4 casas decimais', async () => {
    const schema = string().validarCasasDecimais(4);

    await expect(schema.validate('100,1234')).resolves.toBe('100,1234');
    await expect(schema.validate('50.9999')).resolves.toBe('50.9999');

    await expect(schema.validate('100,12345'))
      .rejects
      .toThrow('O valor deve ter no máximo 4 casas decimais');
  });

  it('deve usar 0 casas decimais como padrão se não for especificado', async () => {
    const schema = string().validarCasasDecimais();

    await expect(schema.validate('100')).resolves.toBe('100');

    await expect(schema.validate('100,5'))
      .rejects
      .toThrow('O valor deve ter no máximo 0 casas decimais');
  });

  it('deve aceitar valores negativos', async () => {
    const schema = string().validarCasasDecimais(2);

    await expect(schema.validate('-100,00')).resolves.toBe('-100,00');
    await expect(schema.validate('-1234.56')).resolves.toBe('-1234.56');

    await expect(schema.validate('-100,123'))
      .rejects
      .toThrow('O valor deve ter no máximo 2 casas decimais');
  });
});
