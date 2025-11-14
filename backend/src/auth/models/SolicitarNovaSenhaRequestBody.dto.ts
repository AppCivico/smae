import { IsString } from 'class-validator';

export class SolicitarNovaSenhaRequestBody {
    /**
     * e-mail da conta
     * @example "admin@email.com"
     */
    @IsString({ message: 'Precisa ser um e-mail' })
    email: string;
}
