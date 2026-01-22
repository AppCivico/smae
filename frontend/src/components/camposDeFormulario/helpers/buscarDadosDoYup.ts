/* eslint-disable no-underscore-dangle */
import type { AnyObjectSchema } from 'yup';

/**
 * Busca metadados de um campo no schema Yup, incluindo suporte a lazy schemas.
 *
 * @param schema - Schema Yup do formulário
 * @param caminho - Nome do campo ou caminho aninhado (ex: "usuario.nome")
 * @returns Metadados do campo (type, tests, etc.) ou null se não encontrado
 */
export default (schema: AnyObjectSchema, caminho: string) => {
  if (!schema) {
    return null;
  }

  let field = schema.fields[caminho];

  // Yup lazy schemas não expõem metadados diretamente em `fields`.
  // Precisamos resolvê-los chamando a função interna _resolve().
  // Nota: _resolve() é uma API não documentada do Yup, pode quebrar em updates.
  // Parâmetros: _resolve(value, options) - passamos objetos vazios como fallback seguro.
  if (field && typeof field._resolve === 'function') {
    try {
      const resolved = field._resolve({}, {});
      // Apenas usa o schema resolvido se ele tiver a estrutura esperada (.spec)
      if (resolved && resolved.spec) {
        field = resolved;
      }
      // Se não tiver .spec, mantém o lazy wrapper original
    } catch (error) {
      // Lazy schema pode falhar se depender de valores específicos.
      // Nesse caso, mantemos o campo original (não resolvido).
      if (import.meta.env.DEV) {
        console.warn(
          `[buscarDadosDoYup] Falha ao resolver lazy schema para campo "${caminho}":`,
          error,
        );
      }
    }
  }

  if (field) {
    return field;
  }

  return caminho.split('.').reduce((acc, key, i, array) => {
    const chaveLimpa = key.replace(/\[(\d+)\]$/, '');

    return !array[i + 1]
      ? acc[chaveLimpa]
      : (
        acc?.[chaveLimpa]?.fields
      || acc?.[chaveLimpa]?.innerType?.fields
      || acc?.[chaveLimpa]
      || acc
      );
  }, (schema?.fields || {})) || null;
};
