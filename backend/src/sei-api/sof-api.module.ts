import { Module } from '@nestjs/common';
import { SeiApiService } from './sof-api.service';

@Module({
    providers: [SeiApiService],
    exports: [SeiApiService],
})
export class SeiApiModule {}
