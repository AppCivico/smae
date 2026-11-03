import { object } from 'yup';
import { describe, expect, it } from 'vitest';

import { execuçãoOrçamentária, itensDeExecucaoOrcamentaria, orçamentoRealizado } from './formSchemas';

const comUmMes = (empenho, liquidado, demais = {}) => ({
  itens: [{
    mes: 3, valor_empenho: empenho, valor_liquidado: liquidado, ...demais,
  }],
});

describe('itensDeExecucaoOrcamentaria', () => {
  const schema = object({ itens: itensDeExecucaoOrcamentaria });

  it('aceita liquidado menor que o empenhado', async () => {
    await expect(schema.isValid(comUmMes(1000, 500))).resolves.toBe(true);
  });

  it('aceita liquidado igual ao empenhado', async () => {
    await expect(schema.isValid(comUmMes(1000, 1000))).resolves.toBe(true);
  });

  it('recusa liquidado maior que o empenhado', async () => {
    await expect(schema.validate(comUmMes(500, 1000)))
      .rejects.toThrow('Valor liquidado não pode ser maior que o valor empenhado');
  });

  it('compara como números os valores que chegam como texto', async () => {
    await expect(schema.isValid(comUmMes('1000.00', '900.00'))).resolves.toBe(true);
    await expect(schema.isValid(comUmMes('900.00', '1000.00'))).resolves.toBe(false);
  });

  it('exige pelo menos um mês', async () => {
    await expect(schema.isValid({ itens: [] })).resolves.toBe(false);
  });

  it('recusa o mês ainda não escolhido', async () => {
    await expect(schema.validate(comUmMes(10, 5, { mes: 0 }))).rejects.toThrow('Mês inválido');
  });

  describe('meses distintos', () => {
    const item = (mes) => ({ mes, valor_empenho: 10, valor_liquidado: 5 });

    it('aceita meses diferentes', async () => {
      await expect(schema.isValid({ itens: [item(1), item(2), item(3)] })).resolves.toBe(true);
    });

    const errosDe = (itens) => schema.validate({ itens }, { abortEarly: false })
      .then(() => null, (e) => e);

    it('recusa o mesmo mês informado duas vezes', async () => {
      const erro = await errosDe([item(1), item(3), item(1)]);

      expect(erro.errors).toEqual([
        'Cada mês só pode ser informado uma vez',
        'Cada mês só pode ser informado uma vez',
      ]);
    });

    it('compara o mês mesmo quando chega como texto', async () => {
      await expect(schema.isValid({ itens: [item(2), item('2')] })).resolves.toBe(false);
    });

    it('aponta o erro no mês de cada linha repetida', async () => {
      const erro = await errosDe([item(1), item(3), item(1)]);

      expect(erro.inner.map((x) => x.path)).toEqual(['itens[0].mes', 'itens[2].mes']);
    });
  });

  it('trata o percentual apagado como ausente', async () => {
    await expect(schema.isValid(comUmMes(10, 5, { percentual_empenho: '', percentual_liquidado: '' })))
      .resolves.toBe(true);
  });
});

describe('schemas que usam os itens', () => {
  it('orçamentoRealizado recusa liquidado maior que o empenhado', async () => {
    await expect(orçamentoRealizado.isValid({
      dotacao: '16.10.12.361.3010.2.873.33903900.00',
      dotacao_complemento: '1.111.1111.1',
      ...comUmMes(500, 1000),
    })).resolves.toBe(false);
  });

  it('execuçãoOrçamentária recusa liquidado maior que o empenhado', async () => {
    await expect(execuçãoOrçamentária.isValid(comUmMes(500, 1000))).resolves.toBe(false);
  });
});
