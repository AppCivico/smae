import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreatePartidoDto {
    @IsNumber()
    @Max(99)
    numero: number;

    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Sigla' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    sigla: string;

    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsOptional()
    @IsString({ message: '$property| observação: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Observação' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    observacao?: string;

    /**
     * fundação do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    fundacao?: Date;

    /**
     * encerramento do partido
     * @example YYYY-MM-DD
     */
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    encerramento?: Date;
}
