import { Module } from '@nestjs/common';
import { SofApiService } from './sof-api.service';

@Module({
    providers: [SofApiService],
    exports: [SofApiService],
})
export class SofApiModule {}
