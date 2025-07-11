import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FeatureFlagDto } from '../auth/models/FeatureFlagDto';
import { IsCrontabDisabled } from '../common/crontab-utils';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertFeatureFlagDto } from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagService {
    private dbAsked: boolean = false;
    private data: FeatureFlagDto;
    constructor(private readonly prisma: PrismaService) {}

    async update(dto: UpsertFeatureFlagDto) {
        await this.prisma.feature_flag.upsert({
            where: { id: 1 },
            create: { id: 1, ...dto },
            update: { ...dto },
        });
        // só serve pro próprio processo, mas os outros se atualizam em 1min
        this.dbAsked = false;
    }

    @Interval(60 * 1000)
    private async handleCron() {
        if (this.data && IsCrontabDisabled('feature_flag')) return;
        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';

        this.dbAsked = true;

        const updated = await this.prisma.feature_flag.findFirst();

        if (updated) {
            this.data = {
                mf_v2: updated.mf_v2,
                panorama: updated.panorama,
                pp_pe: updated.pp_pe,
                mostrar_pdm_antigo: updated.mostrar_pdm_antigo,
                ps_cp_readonly_pdm_config: updated.ps_cp_readonly_pdm_config,
            };
        }
        process.env.INTERNAL_DISABLE_QUERY_LOG = '';
    }

    async featureFlag(): Promise<FeatureFlagDto> {
        if (!this.dbAsked) await this.handleCron();

        if (this.data) return this.data;

        // default se o banco estiver vazio
        return {
            mf_v2: true,
            panorama: true,
            pp_pe: false,
            mostrar_pdm_antigo: false,
            ps_cp_readonly_pdm_config: false,
        };
    }
}
