import { IsBoolean } from 'class-validator';

export class UpsertFeatureFlagDto {
    @IsBoolean()
    pp_pe: boolean;

    @IsBoolean()
    ps_cp_readonly_pdm_config: boolean;
}
