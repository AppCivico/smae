import { Module } from '@nestjs/common';
import { DuckDBProviderService } from './duckdb-provider.service';

@Module({
    imports: [],
    providers: [DuckDBProviderService],
    exports: [DuckDBProviderService],
})
export class DuckDBModule {}
