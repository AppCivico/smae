export class AuditLogDto {
    id: number;
    contexto: string;
    ip: string;
    log: string;
    pessoa_id: number | null;
    pessoa_nome?: string; // nome_exibicao da pessoa
    pessoa_sessao_id: number | null;
    criado_em: Date;
}

export class AuditLogSummaryRow {
    count: number;
    date?: Date;
    contexto?: string;
    pessoa_id?: number;
}

export class AuditLogSummaryDto {
    linhas: AuditLogSummaryRow[];
}
