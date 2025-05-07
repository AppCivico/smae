export function serializarCampos(schema, dados) {
  const novosDados = { ...dados };

  Object.entries(dados).forEach(([campo, valor]) => {
    const schemaCampo = schema.fields?.[campo];

    if (!schemaCampo) return;

    const meta = schemaCampo.spec?.meta;

    if (meta?.serialize) {
      novosDados[campo] = meta.serialize(valor);
    }
  });

  return novosDados;
}

export function serializarEdicoesEmMassa(schema, ops) {
  return ops.map((op) => {
    const campo = op.col;
    const schemaCampo = schema.fields?.[campo];

    if (!schemaCampo) {
      return op;
    }

    const meta = schemaCampo.spec?.meta;

    let novoValor = op.valor;

    if (meta?.serialize) {
      novoValor = meta.serialize(op.valor);
    }

    return {
      ...op,
      valor: novoValor,
    };
  });
}
