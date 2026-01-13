import type { AnyObjectSchema } from 'yup';

export default (schema:AnyObjectSchema, caminho:string) => {
  if (!schema) {
    return null;
  }

  if (schema.fields[caminho]) {
    return schema.fields[caminho];
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
