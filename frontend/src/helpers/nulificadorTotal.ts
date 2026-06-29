interface QualquerObjeto {
  [key: string]: unknown;
}

const nulificadorTotal = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((item: unknown) => nulificadorTotal(item));
  }

  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .reduce((acc: QualquerObjeto, key: string) => {
        const value = (obj as QualquerObjeto)[key];
        if (typeof value === 'object' && value !== null) {
          acc[key] = nulificadorTotal(value);
        } else if (typeof value === 'string') {
          acc[key] = value.trim() || null;
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});
  }

  return typeof obj === 'string'
    ? (obj.trim() || null)
    : obj;
};

export default nulificadorTotal;
