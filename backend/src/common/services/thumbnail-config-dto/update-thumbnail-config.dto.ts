import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateThumbnailConfigDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(4096)
    width?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(4096)
    height?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    quality?: number;
}
