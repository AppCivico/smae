import { Module } from '@nestjs/common';
import { SeiApiService } from './sei-api.service';

@Module({
    providers: [SeiApiService],
    exports: [SeiApiService],
})
export class SeiApiModule {}
