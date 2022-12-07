import { Request } from 'express';
import { Pessoa } from '../../pessoa/entities/pessoa.entity';

export interface AuthRequestLogin extends Request {
    user: Pessoa;
}