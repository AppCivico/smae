import { IsBoolean, IsString, MaxLength } from 'class-validator';

export class CreateGrupoPaineisDto {
    /**
     * nome
     */
    @IsString({ message: '$property| Precisa ser alfanumérico' })
    @MaxLength(30, { message: '$property| código 30 caracteres' })
    nome: string;

    /**
     * ativo
     */
    @IsBoolean()
    ativo: boolean;
}
