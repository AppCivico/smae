import isSelectorValid from './isSelectorValid';

export default (param) => {
  switch (true) {
    case isSelectorValid(param):
      return document.querySelectorAll(param);
    case param instanceof HTMLElement:
      return [param];
    case param instanceof NodeList:
    case param instanceof HTMLCollection:
      return Array.from(param);

    default:
      return null;
  }
};
