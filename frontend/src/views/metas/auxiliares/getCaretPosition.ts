export default (editableDiv: HTMLElement): [number, number] => {
  let caretPos: [number, number] = [editableDiv.childNodes.length + 1, 0];
  let sel: Selection | null;
  let range: Range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel?.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode === editableDiv) {
        const pi = Array.from(editableDiv.childNodes)
          .findIndex((x) => x == range.commonAncestorContainer);
        caretPos = [pi ?? 0, range.endOffset];
      }
    }
  }

  return caretPos;
};
