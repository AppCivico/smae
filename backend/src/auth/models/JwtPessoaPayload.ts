export interface JwtPessoaPayload {
    /// session id
    sid: number;
    iat?: number;
    exp?: number;
}