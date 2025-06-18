import { Injectable } from '@nestjs/common';
import { UpsertFeatureFlagDto } from './dto/feature-flag.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Interval } from '@nestjs/schedule';
import { FeatureFlagDto } from '../auth/models/FeatureFlagDto';

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
        if (this.data && process.env['DISABLED_CRONTABS'] == 'all') return;
        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';

        this.dbAsked = true;

        const updated = await this.prisma.feature_flag.findFirst();

        if (updated) {
            this.data = {
                mf_v2: updated.mf_v2,
                panorama: updated.panorama,
                pp_pe: updated.pp_pe,
                mostrar_pdm_antigo: updated.mostrar_pdm_antigo,
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
        };
    }
}
