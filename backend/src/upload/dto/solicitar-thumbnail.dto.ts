import { IsString } from 'class-validator';

export class SolicitarThumbnailDto {
    @IsString()
    token: string;
}

export class SolicitarThumbnailResponseDto {
    aceito: boolean;
    mensagem: string;
}
