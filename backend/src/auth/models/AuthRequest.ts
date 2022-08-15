import { Request } from 'express';
import { Pessoa } from '../../pessoa/entities/pessoa.entity';

export interface AuthRequest extends Request {
    user: Pessoa;
}