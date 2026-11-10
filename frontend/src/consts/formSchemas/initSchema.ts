/* eslint-disable no-template-curly-in-string */
import {
  ValidationError,
  addMethod,
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  ref,
  setLocale,
  string,
} from 'yup';

import fieldToDate from '@/helpers/fieldToDate';
import haDuplicatasNaLista from '@/helpers/haDuplicatasNaLista';

import i18n from './config/i18n';

type ParamsSemDuplicatas = Parameters<typeof haDuplicatasNaLista>[1];

/**
 * Tipagem dos métodos adicionados via `addMethod()` abaixo.
 * Métodos adicionados em `mixed` valem para todos os schemas,
 * porque, no yup 0.32, `mixed.prototype` é o `BaseSchema.prototype`.
 *
 * Os parâmetros genéricos precisam repetir os da declaração original
 * para que as interfaces sejam mescladas, mesmo sem uso.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
declare module 'yup' {
  interface BaseSchema<TCast, TContext, TOutput> {
    inArray(arrayToCompare: unknown, message?: string): this;
    nullableOuVazio(): this;
    semDuplicatas(message?: string, params?: ParamsSemDuplicatas): this;
  }

  interface StringSchema<TType, TContext, TOut> {
    fieldUntilToday(errorMessage?: string): this;
    nullableOuVazio(): StringSchema<TType | null, TContext>;
    validarCasasDecimais(casasDecimais?: number): this;
  }

  interface DateSchema<TType, TContext, TOut> {
    nullableOuVazio(): DateSchema<TType | null, TContext>;
  }

  interface NumberSchema<TType, TContext, TOut> {
    nullableOuVazio(): NumberSchema<TType | null, TContext>;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(string, 'fieldUntilToday', function _(errorMessage = 'Valor de ${path} futuro') {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  return this.test('teste', errorMessage, function __(value) {
    const { path, createError } = this;

    if (!value) return true;

    try {
      const cleanDate = fieldToDate(value).replace(/-/g, '');
      const cleanNow = new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '');

      return Number(cleanDate) <= Number(cleanNow)
        || createError({ path });
    } catch (error) {
      return createError({ path, message: 'Valor de ${path} inválido' });
    }
  });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(string, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v: unknown) => (v === '' ? null : v));
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(string, 'validarCasasDecimais', function _(casasDecimais = 0) {
  return this
    .test('casas-decimais', (value, { createError }) => {
      if (!value) return true;

      const valorNumerico = value.replace(',', '.');
      const partesDecimais = valorNumerico.split('.')[1];
      const numeroCasasDecimais = partesDecimais ? partesDecimais.length : 0;

      if (numeroCasasDecimais > casasDecimais) {
        return createError({
          message: `O valor deve ter no máximo ${casasDecimais} casas decimais`,
        });
      }

      return true;
    });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(date, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v: Date) => {
      try {
        v.toISOString();
        return v;
      } catch (e) {
        return null;
      }
    });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(mixed, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => (v === '' || v === false ? null : v));
});

addMethod(mixed, 'semDuplicatas', function semDuplicatas(message = '${path} não pode ter valores repetidos', params = {}) {
  return this.test('semDuplicatas', message, function semDuplicatasTeste(value) {
    const { path, createError } = this;

    const indices = haDuplicatasNaLista(value, params);

    if (!indices.length) return true;

    const props = params.apenas
      ? ([] as (string | number)[]).concat(params.apenas)
      : null;

    const errosDuplicata = (i: number) => {
      if (props) {
        return props.map((prop) => createError({ path: `${path}[${i}].${prop}`, message }));
      }
      return [createError({ path: `${path}[${i}]`, message })];
    };

    return new ValidationError(
      indices.flatMap(errosDuplicata),
      value,
      path,
    );
  });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(number, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v: unknown) => (v === '' || Number.isNaN(v) ? null : v));
});

/**
 * @link https://github.com/jquense/yup/issues/384#issuecomment-442958997
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(mixed, 'inArray', function _(arrayToCompare, message = '${path} não encontrado em ${arrayToCompare}') {
  return this.test({
    message,
    name: 'inArray',
    exclusive: true,
    params: { arrayToCompare },
    test(value) {
      return (this.resolve(arrayToCompare) || []).includes(value);
    },
  });
});

setLocale(i18n);

export {
  array,
  boolean,
  date,
  mixed,
  number,
  object,
  ref,
  setLocale,
  string,
};
