import { Request } from 'express';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';

export interface AuthRequestLogin extends Request {
    user: Pessoa;
}