import { Request } from 'express';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';

export interface AuthRequest extends Request {
    user: PessoaFromJwt;
}