import { IsInt, IsString } from 'class-validator';

export class GerarThumbnailDto {
    @IsInt()
    arquivo_id: number;

    @IsString()
    tipo_upload: string;
}
