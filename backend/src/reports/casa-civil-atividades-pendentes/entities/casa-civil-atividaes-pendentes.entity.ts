/**
 * Linha devolvida pelo `asJSON` do relatório de atividades pendentes.
 *
 * Os nomes das propriedades espelham os campos da query (`valor`, `inicio_planejado`,
 * `termino_planejado`) — antes esta classe declarava `valor_repasse`/`previsao_inicio`,
 * que nunca existiram no retorno real, então o Swagger documentava campos inexistentes.
 *
 * Tipos alinhados ao CSV bruto: datas em ISO `YYYY-MM-DD` e valor monetário como string
 * (precisão do `Decimal` do Prisma). Ver `casa-civil-atividades-pendentes-csv.entity.ts`.
 */
export class RelCasaCivilAtividadesPendentes {
    identificador: string;
    parlamentares: string | null;
    valor: string | null;
    atividade: string;
    inicio_planejado: string | null;
    termino_planejado: string | null;
    inicio_real: string | null;
    orgao_responsavel: string | null;
    responsavel_atividade: string;
}
