const queryCheck = (s) => document.createDocumentFragment().querySelector(s);

export default function isSelectorValid(selector) {
  if (typeof selector !== 'string') return false;
  try { queryCheck(selector); } catch { return false; }
  return true;
}
