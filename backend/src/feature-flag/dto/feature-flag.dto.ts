import { IsBoolean } from 'class-validator';

export class UpsertFeatureFlagDto {
    @IsBoolean()
    pp_pe: boolean;
}
