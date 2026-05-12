import { IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_HTML } from 'src/common/consts';

export class EnviarEmailParlamentaresDto {
    @IsOptional()
    @IsString()
    @MaxLength(500)
    assunto?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_HTML)
    corpo?: string;
}
