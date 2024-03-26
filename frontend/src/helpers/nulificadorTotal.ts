interface AnyObject {
  [key: string]: any;
}

const nulificadorTotal = (obj: AnyObject): AnyObject => Object.keys(obj)
  .reduce((acc: AnyObject, key: string) => {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      acc[key] = nulificadorTotal(obj[key]);
    } else {
      acc[key] = obj[key] === '' ? null : obj[key];
    }
    return acc;
  }, {});

export default nulificadorTotal;
