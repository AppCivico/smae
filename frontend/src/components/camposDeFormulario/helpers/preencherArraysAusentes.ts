import type { AnyObjectSchema } from 'yup';

import buscarDadosDoYup from './buscarDadosDoYup';

/**
 * Varre um schema Yup e retorna `carga` com um array vazio em todo campo do
 * tipo array ausente — recursivamente, tanto dentro de campos do tipo objeto
 * quanto nos itens de campos do tipo array. Usado para repor arrays que o
 * vee-validate remove do payload quando o campo fica vazio
 * (ex: `preencherArraysAusentes(schema, cargaControlada)`). Um campo
 * explicitamente `null` é preservado, não é considerado "ausente".
 */
const preencherArraysAusentes = (
  schema: AnyObjectSchema,
  carga: Record<string, unknown>,
): Record<string, unknown> => Object.keys(schema.fields)
  .reduce((acc: Record<string, unknown>, campo) => {
    const dadosDoCampo = buscarDadosDoYup(schema, campo);

    if (dadosDoCampo?.type === 'array') {
      const valorDoCampo = acc[campo];
      const schemaDoItem = dadosDoCampo.innerType;

      if (valorDoCampo === undefined) {
        acc[campo] = [];
      } else if (Array.isArray(valorDoCampo) && schemaDoItem?.fields) {
        acc[campo] = valorDoCampo.map((item) => (item && typeof item === 'object'
          ? preencherArraysAusentes(schemaDoItem, item)
          : item));
      }
    } else if (
      dadosDoCampo?.type === 'object'
      && dadosDoCampo.fields
      && acc[campo]
      && typeof acc[campo] === 'object'
    ) {
      acc[campo] = preencherArraysAusentes(dadosDoCampo, acc[campo] as Record<string, unknown>);
    }

    return acc;
  }, { ...carga });

export default preencherArraysAusentes;
