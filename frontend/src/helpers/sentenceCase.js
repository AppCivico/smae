export default (str = '') => {
  const castedString = String(str);
  return castedString.toLowerCase().charAt(0).toUpperCase() + castedString.slice(1);
};
