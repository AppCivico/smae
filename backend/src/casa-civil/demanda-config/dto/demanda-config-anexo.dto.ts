import { IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from 'src/common/consts';

export class AppendDemandaConfigAnexoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Upload Token' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    upload_token: string;
}
