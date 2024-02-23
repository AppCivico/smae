export default ((str, maxLen, suffix = '...', separator = ' ') => {
  switch (true) {
    case (!str || str.length <= maxLen):
      return str;
    case str.lastIndexOf(separator, maxLen) === -1:
      return str.substr(0, maxLen) + suffix;
    default:
      return str.substr(0, str.lastIndexOf(separator, maxLen)) + suffix;
  }
});
