export class RequestLogDto {
    created_at: Date;
    cf_ray: string;
    request_num: number;
    ip: string;
    response_time: number;
    response_size: number;
    req_method: string;
    req_path: string;
    req_host: string;
    req_headers: string | object | null;
    req_query: string | object | null;
    req_body: string | object | null;
    req_body_size: number | null;
    res_code: number;
    created_pessoa_id: number | null;
}

export class RequestSummaryRow {
    count: number;
    request_date?: Date;
    req_method?: string;
    req_path_clean?: string;
    res_code?: number;
}

export class RequestSummaryDto {
    linhas: RequestSummaryRow[];
}
