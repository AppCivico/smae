export default ((lista) => (Array.isArray(lista)
  ? lista.reduce((acc, cur, index) => {
    acc[cur] = index;
    return acc;
  }, {})
  : {}));
