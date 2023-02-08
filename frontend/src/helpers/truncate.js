export default ((str, maxLen, suffix = '...', separator = ' ') => (str.length <= maxLen
  ? str
  : str.substr(0, str.lastIndexOf(separator, maxLen)) + suffix)
);
