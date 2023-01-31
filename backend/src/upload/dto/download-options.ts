import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class DownloadOptions {
    /**
     * Não fazer download do arquivo
     * @example "false"
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    inline?: boolean;
}
