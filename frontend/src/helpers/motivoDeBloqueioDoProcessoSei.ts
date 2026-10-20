type ProcessoSei = {
  bloqueado_por_contratos?: { id: number; numero: string }[];
} | null | undefined;

export default (processo: ProcessoSei): string | null => {
  const contratos = processo?.bloqueado_por_contratos;
  if (!contratos?.length) return null;

  return `Em uso no(s) contrato(s) ${contratos.map((c) => c.numero).join(', ')}. Remova-o do(s) contrato(s) antes.`;
};
