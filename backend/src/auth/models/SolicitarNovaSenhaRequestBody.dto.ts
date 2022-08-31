import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SolicitarNovaSenhaRequestBody {
    /**
    * e-mail da conta
    * @example "admin@email.com"
    */
    @IsString({ message: '$property| Precisa ser um e-mail' })
    email: string;

}