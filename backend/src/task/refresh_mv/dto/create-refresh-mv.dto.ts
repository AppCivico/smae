import { IsString, Matches, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class CreateRefreshMvDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'mv_name' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @Matches(/^[A-Z_0-9]+$/i)
    mv_name: string;
}
