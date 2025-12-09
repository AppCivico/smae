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
