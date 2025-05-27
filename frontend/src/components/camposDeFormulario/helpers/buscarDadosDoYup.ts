import type { AnyObjectSchema } from 'yup';

export default (schema:AnyObjectSchema, caminho:string) => {
  if (!schema) {
    return null;
  }

  if (schema.fields[caminho]) {
    return schema.fields[caminho];
  }

  return caminho.split('.').reduce((acc, key, i, array) => (!array[i + 1]
    ? acc[key]
    : (
      acc?.[key]?.fields
      || acc?.[key]?.innerType?.fields
      || acc?.[key]
      || acc
    )
  ), (schema?.fields || {})) || null;
};
