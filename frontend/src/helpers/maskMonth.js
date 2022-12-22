export default function maskMonth(el) {
  var kC = event.keyCode;
  var data = el.target.value.replace(/[^0-9/]/g, '');
  if (kC != 8 && kC != 46) {
    if (data.length == 2) {
      el.target.value = data += '/';
    } else {
      el.target.value = data;
    }
  }
}
