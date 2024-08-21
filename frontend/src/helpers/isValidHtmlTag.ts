// Tests if a string is a valid HTML tag
//
// @link: https://stackoverflow.com/a/34629494/15425845
export default (() => {
  const unknown = '[object HTMLUnknownElement]';
  // cache of tested strings.
  // some HTML5 elements some browsers doesn't support already added.
  const testedStrings: Record<string, boolean> = { CANVAS: true, VIDEO: true };

  return (tag = '') => {
    if (!tag) {
      return false;
    }

    if (testedStrings[tag.toUpperCase()]) {
      return true;
    }

    testedStrings[tag] = (document?.createElement(tag).toString() !== unknown);

    return !!testedStrings[tag];
  };
})();
