const keywords = {
  true: true,
  false: false,
  null: null,
  undefined,
};

/**
 * @link https://github.com/ljharb/qs/issues/91#issuecomment-1833694874
 */
export default ((str:string) => {
  if (/^(?:-(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))|(?:0|(?:[1-9](?:\d{0,2}(?:,\d{3})+|\d*))))(?:.\d+|)$/.test(str)) {
    return parseFloat(str);
  }
  if (str in keywords) {
    return keywords[str as keyof typeof keywords];
  }
  return str;
});
