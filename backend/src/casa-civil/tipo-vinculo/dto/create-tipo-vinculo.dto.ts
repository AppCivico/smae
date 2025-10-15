import { IsString } from 'class-validator';

export class CreateTipoVinculoDto {
    @IsString()
    nome: string;
}
