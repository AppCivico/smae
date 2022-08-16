export interface JwtReducedAccessToken {
    pessoaId: number;
    iat: number;
    exp?: number;
    aud: string
}