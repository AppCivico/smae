import { Module } from '@nestjs/common';
import { TransfereGovApiService } from './transfere-gov-api.service';

@Module({
    providers: [TransfereGovApiService],
    exports: [TransfereGovApiService],
})
export class TransfereGovApiModule {}
