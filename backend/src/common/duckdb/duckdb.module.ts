import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DuckDBProviderService } from './duckdb-provider.service';
import { DuckDBSidecarService } from './duckdb-sidecar.service';
import { DuckDBSearchService } from './duckdb-search.service';

@Module({
    imports: [ConfigModule],
    providers: [DuckDBProviderService, DuckDBSidecarService, DuckDBSearchService],
    exports: [DuckDBProviderService, DuckDBSidecarService, DuckDBSearchService],
})
export class DuckDBModule {}
