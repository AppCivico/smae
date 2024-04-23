interface QualquerObjeto {
  [key: string]: any;
}

const nulificadorTotal = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item: any) => nulificadorTotal(item));
  } if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .reduce((acc: QualquerObjeto, key: string) => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          acc[key] = nulificadorTotal(obj[key]);
        } else if (typeof obj[key] === 'string') {
          acc[key] = obj[key].trim() || null;
        } else {
          acc[key] = obj[key];
        }
        return acc;
      }, {});
  }
  return typeof obj === 'string'
    ? (obj.trim() || null)
    : obj;
};

export default nulificadorTotal;
