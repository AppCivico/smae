export default function formatProcesso(d) {
  const data = String(d).replace(/\D/g, '').slice(0, 16);
  let s = data.slice(0, 4);

  if (data.length > 12) {
    // SEI
    if (data.length > 4) s += `.${data.slice(4, 8)}`;
    if (data.length > 8) s += `/${data.slice(8, 15)}`;
    if (data.length > 15) s += `-${data.slice(15, 16)}`;
  } else if (data.length === 12) {
    // SINPROC
    if (data.length > 4) s += `-${data.slice(4, 5)}`;
    if (data.length > 5) s += `.${data.slice(5, 8)}`;
    if (data.length > 8) s += `.${data.slice(8, 11)}`;
    if (data.length > 11) s += `-${data.slice(11, 12)}`;
  } else {
    // separação por espaços só para facilitar leitura
    if (data.length > 4) s += ` ${data.slice(4, 8)}`;
    if (data.length > 8) s += ` ${data.slice(8, 12)}`;
  }

  return s;
}
