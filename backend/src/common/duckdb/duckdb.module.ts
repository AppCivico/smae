import { Module } from '@nestjs/common';
import { DuckDBProviderService } from './duckdb-provider.service';
import { SmaeConfigModule } from '../services/smae-config.module';

@Module({
    imports: [SmaeConfigModule],
    providers: [DuckDBProviderService],
    exports: [DuckDBProviderService],
})
export class DuckDBModule {}
