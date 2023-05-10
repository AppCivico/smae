export default function agrupaFilhos(array) {
  const ar = { items: [], filhos: {} };

  if (Array.isArray(array)) {
    array.forEach((x) => {
      if (x.iniciativa?.id && !ar.filhos[x.iniciativa.id]) {
        ar.filhos[x.iniciativa.id] = {
          id: x.iniciativa.id, label: `${x.iniciativa.codigo} - ${x.iniciativa.titulo}`, filhos: {}, items: [],
        };
      }
      if (x.atividade?.id && !ar.filhos[x.iniciativa.id].filhos[x.atividade.id]) {
        ar.filhos[x.iniciativa.id].filhos[x.atividade.id] = {
          id: x.atividade.id, label: `${x.atividade.codigo} - ${x.atividade.titulo}`, filhos: {}, items: [],
        };
      }

      if (x.atividade?.id) {
        ar.filhos[x.iniciativa.id].filhos[x.atividade.id].items.push(x);
      } else if (x.iniciativa?.id) {
        ar.filhos[x.iniciativa.id].items.push(x);
      } else if (x.meta?.id) {
        ar.items.push(x);
      }
    });
  }
  return ar;
}
