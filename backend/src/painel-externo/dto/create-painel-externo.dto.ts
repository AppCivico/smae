import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePainelExternoDto {
    @IsString()
    @MaxLength(100)
    titulo: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
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
    @MaxLength(1024)
    link: string;

    @IsArray()
    @IsOptional()
    @ArrayMaxSize(100, { message: '$property| grupo(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    grupos?: number[];
}
