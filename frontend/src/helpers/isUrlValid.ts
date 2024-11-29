export default (stringToTest:string, httpOnly = false, assumeHttp = false) => {
  if (typeof stringToTest !== 'string') {
    return false;
  }

  let url;
  const urlString = assumeHttp && !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(stringToTest)
    ? `https://${stringToTest}`
    : stringToTest;

  try {
    url = new URL(urlString);
  } catch (e) {
    return false;
  }

  return httpOnly
    ? (url.protocol === 'http:' || url.protocol === 'https:')
    : !!url;
};
