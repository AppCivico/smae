import { Request } from 'express';
import { PessoaFromJwt } from './../models/PessoaFromJwt';

export interface AuthRequest extends Request {
    user: PessoaFromJwt;
}