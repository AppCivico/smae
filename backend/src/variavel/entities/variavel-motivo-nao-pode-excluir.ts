export const VariavelMotivoNaoPodeExcluir = {
    SemPermissao: 'SemPermissao',
    EmPlano: 'EmPlano',
    EmIndicadorAtivo: 'EmIndicadorAtivo',
} as const;
export type VariavelMotivoNaoPodeExcluir =
    (typeof VariavelMotivoNaoPodeExcluir)[keyof typeof VariavelMotivoNaoPodeExcluir];

export function calculaMotivoNaoPodeExcluir(
    pode_editar: boolean,
    em_plano: boolean,
    em_indicador_ativo: boolean
): VariavelMotivoNaoPodeExcluir | null {
    if (!pode_editar) return VariavelMotivoNaoPodeExcluir.SemPermissao;
    if (em_indicador_ativo) return VariavelMotivoNaoPodeExcluir.EmIndicadorAtivo;
    if (em_plano) return VariavelMotivoNaoPodeExcluir.EmPlano;
    return null;
}
