interface AnyObject {
  [key: string]: any;
}

const nulificadorTotal = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map((item: any) => nulificadorTotal(item));
  } if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj)
      .reduce((acc: AnyObject, key: string) => {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          acc[key] = nulificadorTotal(obj[key]);
        } else {
          acc[key] = obj[key] === '' ? null : obj[key];
        }
        return acc;
      }, {});
  }
  return obj === '' ? null : obj;
};

export default nulificadorTotal;
