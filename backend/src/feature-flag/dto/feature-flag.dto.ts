import { IsBoolean } from 'class-validator';

export class UpsertFeatureFlagDto {
    @IsBoolean()
    panorama: boolean;
    @IsBoolean()
    mf_v2: boolean;
}
