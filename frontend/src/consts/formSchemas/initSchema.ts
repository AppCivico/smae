/* eslint-disable no-template-curly-in-string */
import {
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

import i18n from './config/i18n';
import fieldToDate from '@/helpers/fieldToDate';
import haDuplicatasNaLista from '@/helpers/haDuplicatasNaLista';

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
    .transform((v) => (v === '' ? null : v));
});

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
    .transform((v) => {
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

    return haDuplicatasNaLista(value, params)
      ? createError({ path, message })
      : true;
  });
});

// eslint-disable-next-line @typescript-eslint/naming-convention
addMethod(number, 'nullableOuVazio', function _() {
  return this
    .nullable()
    .transform((v) => (v === '' || Number.isNaN(v) ? null : v));
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
