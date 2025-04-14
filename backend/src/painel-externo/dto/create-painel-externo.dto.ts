import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreatePainelExternoDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Título' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    titulo: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao: string | null;

    @IsString()
    @IsUrl({
        protocols: ['https'],
        require_tld: true,
        require_protocol: true,
        require_host: true,
        require_port: false,
        require_valid_protocol: true,
        allow_underscores: false,
        allow_trailing_dot: false,
        allow_protocol_relative_urls: false,
        allow_fragments: true,
        allow_query_components: true,
        validate_length: true,
    })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    link: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    grupos?: number[];
}
